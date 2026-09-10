from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/health_score", tags=["health_score"])

@router.get("/")
@cache(expire=300)
def get_business_health(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , customer_counts AS (
            SELECT c.customer_unique_id, COUNT(DISTINCT fo.order_id) as order_count
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
            GROUP BY c.customer_unique_id
        )
        , metrics AS (
            SELECT 
                COUNT(DISTINCT fo.order_id) as total_orders,
                COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN fo.order_id END) as delivered_orders,
                COUNT(DISTINCT CASE WHEN o.order_status = 'canceled' THEN fo.order_id END) as canceled_orders,
                
                COALESCE(SUM(oi.price + oi.freight_value), 0) as total_revenue,
                
                (SELECT COUNT(DISTINCT customer_unique_id) FROM customer_counts) as unique_customers,
                (SELECT COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_unique_id END) FROM customer_counts) as repeat_customers,
                
                COUNT(CASE WHEN o.order_status = 'delivered' AND o.order_delivered_customer_date <= o.order_estimated_delivery_date THEN 1 END) as on_time_deliveries,
                COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as total_deliveries,
                
                AVG(r.review_score) as avg_review
                
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            LEFT JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            LEFT JOIN analytics.fact_review r ON fo.order_key = r.order_key
        )
        SELECT * FROM metrics
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        metrics = cur.fetchone()

    # Default to 0 if none
    total_orders = metrics.get('total_orders') or 0
    delivered_orders = metrics.get('delivered_orders') or 0
    canceled_orders = metrics.get('canceled_orders') or 0
    total_revenue = metrics.get('total_revenue') or 0
    unique_customers = metrics.get('unique_customers') or 0
    repeat_customers = metrics.get('repeat_customers') or 0
    on_time_deliveries = metrics.get('on_time_deliveries') or 0
    total_deliveries = metrics.get('total_deliveries') or 0
    avg_review = metrics.get('avg_review') or 0

    # Calculate proxies for Health Score
    
    # 1. Revenue Health
    # A proxy based on Average Order Value > 100
    aov = (total_revenue / total_orders) if total_orders > 0 else 0
    revenue_score = min(100, (aov / 150) * 100) # Baseline 150 target
    
    # 2. Customer Health (Repeat Rate)
    # Target 15% repeat rate to be 100% healthy
    repeat_rate = (repeat_customers / unique_customers) if unique_customers > 0 else 0
    customer_score = min(100, (repeat_rate / 0.15) * 100)
    
    # 3. Operational Health (Cancellation & On-Time)
    cancellation_rate = (canceled_orders / total_orders) if total_orders > 0 else 0
    cancellation_score = max(0, 100 - (cancellation_rate / 0.05) * 100) # > 5% is 0
    
    on_time_rate = (on_time_deliveries / total_deliveries) if total_deliveries > 0 else 0
    on_time_score = min(100, on_time_rate * 100)
    
    ops_score = (cancellation_score + on_time_score) / 2
    
    # 4. Customer Experience Health (Reviews)
    # Score 5.0 -> 100, Score 3.0 -> 0
    cx_score = max(0, min(100, (float(avg_review) - 3.0) / 2.0 * 100))
    
    # Overall Score
    overall_score = (revenue_score + customer_score + ops_score + cx_score) / 4
    
    return {
        "overall_health": overall_score,
        "revenue_health": revenue_score,
        "customer_health": customer_score,
        "operational_health": ops_score,
        "cx_health": cx_score,
        "raw_metrics": {
            "aov": float(aov),
            "repeat_rate": float(repeat_rate),
            "cancellation_rate": float(cancellation_rate),
            "on_time_rate": float(on_time_rate),
            "avg_review": float(avg_review)
        }
    }
