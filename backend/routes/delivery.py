from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/delivery", tags=["delivery"])

@router.get("/trend")
@cache(expire=300)
def get_delivery_trend(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , valid_deliveries AS (
            SELECT 
                d.year,
                d.month,
                d.month_name,
                EXTRACT(EPOCH FROM (o.order_delivered_customer_date - o.order_purchase_timestamp)) / 86400.0 as delivery_days
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_date d ON o.order_date_key = d.date_key
            WHERE o.order_status = 'delivered'
              AND o.order_delivered_customer_date IS NOT NULL
              AND o.order_purchase_timestamp IS NOT NULL
        )
        SELECT 
            year,
            month,
            MAX(month_name) as month_name,
            COALESCE(AVG(delivery_days), 0) as avg_delivery_days
        FROM valid_deliveries
        WHERE delivery_days >= 0 AND delivery_days <= 90
        GROUP BY year, month
        ORDER BY year, month
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results

@router.get("/state")
@cache(expire=300)
def get_delivery_by_state(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , valid_deliveries AS (
            SELECT 
                c.state,
                EXTRACT(EPOCH FROM (o.order_delivered_customer_date - o.order_purchase_timestamp)) / 86400.0 as delivery_days
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
            WHERE o.order_status = 'delivered'
              AND o.order_delivered_customer_date IS NOT NULL
              AND o.order_purchase_timestamp IS NOT NULL
        )
        SELECT 
            state,
            COALESCE(AVG(delivery_days), 0) as avg_delivery_days
        FROM valid_deliveries
        WHERE delivery_days >= 0 AND delivery_days <= 90
        GROUP BY state
        ORDER BY avg_delivery_days ASC
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results
