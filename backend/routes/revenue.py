from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/revenue", tags=["revenue"])

@router.get("/trend")
@cache(expire=300)
def get_revenue_trend(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        SELECT 
            d.year,
            d.month,
            MAX(d.month_name) as month_name,
            COALESCE(SUM(oi.price), 0) as product_revenue,
            COALESCE(SUM(oi.freight_value), 0) as freight_revenue,
            COALESCE(SUM(oi.price + oi.freight_value), 0) as total_revenue
        FROM filtered_orders fo
        JOIN analytics.fact_order o ON fo.order_key = o.order_key
        JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
        JOIN analytics.dim_date d ON o.order_date_key = d.date_key
        GROUP BY d.year, d.month
        ORDER BY d.year, d.month
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results

@router.get("/category")
@cache(expire=300)
def get_revenue_by_category(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        SELECT 
            COALESCE(p.category_name_english, 'Unknown') as category,
            COALESCE(SUM(oi.price + oi.freight_value), 0) as total_revenue,
            COUNT(oi.order_item_id) as items_sold
        FROM filtered_orders fo
        JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
        JOIN analytics.dim_product p ON oi.product_key = p.product_key
        GROUP BY COALESCE(p.category_name_english, 'Unknown')
        ORDER BY total_revenue DESC
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results

@router.get("/state")
@cache(expire=300)
def get_revenue_by_state(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        SELECT 
            c.state,
            COALESCE(SUM(oi.price + oi.freight_value), 0) as total_revenue,
            COUNT(DISTINCT fo.order_id) as total_orders
        FROM filtered_orders fo
        JOIN analytics.fact_order o ON fo.order_key = o.order_key
        JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
        JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
        GROUP BY c.state
        ORDER BY total_revenue DESC
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results
