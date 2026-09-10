from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from psycopg.rows import dict_row
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/kpis", tags=["kpis"])

@router.get("/")
@cache(expire=300)
def get_kpis(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    orders_query = f"""
        {cte_sql}
        SELECT 
            COUNT(DISTINCT fo.order_id) as total_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN fo.order_id END) as delivered_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'canceled' THEN fo.order_id END) as canceled_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'unavailable' THEN fo.order_id END) as unavailable_orders
        FROM filtered_orders fo
        JOIN analytics.fact_order o ON fo.order_key = o.order_key
    """
    
    revenue_query = f"""
        {cte_sql}
        SELECT
            COALESCE(SUM(oi.price), 0) as product_revenue,
            COALESCE(SUM(oi.freight_value), 0) as freight_revenue,
            COALESCE(SUM(oi.price + oi.freight_value), 0) as total_order_value,
            CASE WHEN COUNT(DISTINCT fo.order_id) = 0 THEN 0 
                 ELSE COALESCE(SUM(oi.price + oi.freight_value), 0) / COUNT(DISTINCT fo.order_id) 
            END as aov
        FROM filtered_orders fo
        JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
    """
    
    customers_query = f"""
        {cte_sql}
        , customer_counts AS (
            SELECT c.customer_unique_id, COUNT(DISTINCT fo.order_id) as order_count
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
            GROUP BY c.customer_unique_id
        )
        SELECT 
            COUNT(DISTINCT customer_unique_id) as unique_customers,
            COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_unique_id END) as repeat_customers,
            CASE WHEN COUNT(DISTINCT customer_unique_id) = 0 THEN 0
                 ELSE COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_unique_id END) * 100.0 / COUNT(DISTINCT customer_unique_id)
            END as repeat_customer_rate
        FROM customer_counts
    """

    delivery_query = f"""
        {cte_sql}
        , valid_deliveries AS (
            SELECT 
                EXTRACT(EPOCH FROM (o.order_delivered_customer_date - o.order_purchase_timestamp)) / 86400.0 as delivery_days,
                CASE WHEN o.order_delivered_customer_date <= o.order_estimated_delivery_date THEN 1 ELSE 0 END as is_on_time
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            WHERE o.order_status = 'delivered'
              AND o.order_delivered_customer_date IS NOT NULL
              AND o.order_purchase_timestamp IS NOT NULL
              AND o.order_estimated_delivery_date IS NOT NULL
        ),
        filtered_deliveries AS (
            SELECT * FROM valid_deliveries
            WHERE delivery_days >= 0 AND delivery_days <= 90
        )
        SELECT 
            COUNT(*) as valid_records,
            COALESCE(AVG(delivery_days), 0) as avg_days,
            COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY delivery_days), 0) as median_days,
            COALESCE(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY delivery_days), 0) as p90_days,
            CASE WHEN COUNT(*) = 0 THEN 0 ELSE SUM(is_on_time) * 100.0 / COUNT(*) END as on_time_rate
        FROM filtered_deliveries
    """

    reviews_query = f"""
        {cte_sql}
        SELECT 
            COUNT(*) as total_reviews,
            COALESCE(AVG(r.review_score), 0) as average_score,
            CASE WHEN COUNT(*) = 0 THEN 0 ELSE COUNT(CASE WHEN r.review_score = 5 THEN 1 END) * 100.0 / COUNT(*) END as five_star_rate,
            CASE WHEN COUNT(*) = 0 THEN 0 ELSE COUNT(CASE WHEN r.review_score IN (1, 2) THEN 1 END) * 100.0 / COUNT(*) END as negative_rate
        FROM filtered_orders fo
        JOIN analytics.fact_review r ON fo.order_key = r.order_key
    """

    with db.cursor() as cur:
        cur.execute(orders_query, params)
        orders = cur.fetchone()
        
        cur.execute(revenue_query, params)
        revenue = cur.fetchone()
        
        cur.execute(customers_query, params)
        customers = cur.fetchone()
        
        cur.execute(delivery_query, params)
        delivery = cur.fetchone()
        
        cur.execute(reviews_query, params)
        reviews = cur.fetchone()

    return {
        "orders": orders,
        "revenue": revenue,
        "customers": customers,
        "delivery": delivery,
        "reviews": reviews
    }
