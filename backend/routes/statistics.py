from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/statistics", tags=["statistics"])

@router.get("/order_value_histogram")
@cache(expire=300)
def get_order_value_histogram(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    query = f"""
        {cte_sql}
        , order_values AS (
            SELECT 
                fo.order_id,
                COALESCE(SUM(oi.price + oi.freight_value), 0) as total_value
            FROM filtered_orders fo
            JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            GROUP BY fo.order_id
        )
        , max_val AS (
            SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY total_value) as p95 FROM order_values
        )
        , bucket_size AS (
            SELECT CASE WHEN p95 = 0 THEN 10 ELSE p95 / 20 END as b_size FROM max_val
        )
        SELECT 
            (FLOOR(total_value / b.b_size) * b.b_size)::numeric(10,2) as bucket_start,
            ((FLOOR(total_value / b.b_size) + 1) * b.b_size)::numeric(10,2) as bucket_end,
            COUNT(order_id) as num_orders
        FROM order_values
        CROSS JOIN bucket_size b
        WHERE total_value <= (SELECT p95 * 1.5 FROM max_val) -- Exclude extreme outliers from histogram
        GROUP BY 1, 2
        ORDER BY 1
    """
    with db.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()

@router.get("/delivery_time_distribution")
@cache(expire=300)
def get_delivery_time_distribution(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    query = f"""
        {cte_sql}
        , delivery_times AS (
            SELECT 
                fo.order_id,
                EXTRACT(EPOCH FROM (o.order_delivered_customer_date - o.order_purchase_timestamp))/86400 as days_to_deliver
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            WHERE o.order_status = 'delivered' 
              AND o.order_delivered_customer_date IS NOT NULL 
              AND o.order_purchase_timestamp IS NOT NULL
        )
        SELECT 
            FLOOR(days_to_deliver) as days,
            COUNT(order_id) as num_orders
        FROM delivery_times
        WHERE days_to_deliver >= 0 AND days_to_deliver <= 30
        GROUP BY 1
        ORDER BY 1
    """
    with db.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()

@router.get("/outliers")
@cache(expire=300)
def get_outliers(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    query = f"""
        {cte_sql}
        , order_values AS (
            SELECT 
                fo.order_id,
                c.state as customer_state,
                COALESCE(SUM(oi.price + oi.freight_value), 0) as total_value
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
            JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            GROUP BY fo.order_id, c.state
        )
        , percentiles AS (
            SELECT 
                percentile_cont(0.99) WITHIN GROUP (ORDER BY total_value) as p99
            FROM order_values
        )
        SELECT 
            v.order_id,
            v.customer_state,
            v.total_value,
            (v.total_value / p.p99) as multiple_of_p99
        FROM order_values v
        CROSS JOIN percentiles p
        WHERE v.total_value > p.p99
        ORDER BY v.total_value DESC
        LIMIT 50
    """
    with db.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()
