from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/sellers", tags=["sellers"])

@router.get("/summary")
@cache(expire=300)
def get_sellers_summary(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , seller_performance AS (
            SELECT 
                s.seller_id,
                COUNT(DISTINCT fo.order_id) as order_count,
                COALESCE(SUM(oi.price), 0) as product_revenue
            FROM filtered_orders fo
            JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            JOIN analytics.dim_seller s ON oi.seller_key = s.seller_key
            GROUP BY s.seller_id
        )
        SELECT 
            (SELECT COUNT(DISTINCT seller_id) FROM analytics.dim_seller) as total_sellers,
            COUNT(DISTINCT seller_id) as active_sellers,
            CASE WHEN COUNT(DISTINCT seller_id) = 0 THEN 0 ELSE SUM(order_count) / COUNT(DISTINCT seller_id) END as avg_orders_per_seller,
            CASE WHEN COUNT(DISTINCT seller_id) = 0 THEN 0 ELSE SUM(product_revenue) / COUNT(DISTINCT seller_id) END as avg_revenue_per_seller
        FROM seller_performance
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchone()
        
    return results

@router.get("/top")
@cache(expire=300)
def get_top_sellers(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        SELECT 
            s.seller_id,
            s.state,
            COUNT(DISTINCT fo.order_id) as total_orders,
            COUNT(oi.order_item_id) as items_sold,
            COALESCE(SUM(oi.price), 0) as product_revenue
        FROM filtered_orders fo
        JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
        JOIN analytics.dim_seller s ON oi.seller_key = s.seller_key
        GROUP BY s.seller_id, s.state
        ORDER BY product_revenue DESC
        LIMIT 50
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results

@router.get("/state")
@cache(expire=300)
def get_sellers_by_state(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        SELECT 
            s.state,
            COUNT(DISTINCT s.seller_id) as active_sellers,
            COALESCE(SUM(oi.price), 0) as total_revenue
        FROM filtered_orders fo
        JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
        JOIN analytics.dim_seller s ON oi.seller_key = s.seller_key
        GROUP BY s.state
        ORDER BY total_revenue DESC
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results

@router.get("/pareto")
@cache(expire=300)
def get_sellers_pareto(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , seller_sales AS (
            SELECT 
                s.seller_id,
                COALESCE(SUM(oi.price), 0) as revenue
            FROM filtered_orders fo
            JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            JOIN analytics.dim_seller s ON oi.seller_key = s.seller_key
            GROUP BY s.seller_id
        )
        , total_sales AS (
            SELECT SUM(revenue) as total_revenue, COUNT(seller_id) as total_sellers FROM seller_sales
        )
        , ranked_sellers AS (
            SELECT 
                seller_id,
                revenue,
                SUM(revenue) OVER (ORDER BY revenue DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as cumulative_revenue,
                ROW_NUMBER() OVER (ORDER BY revenue DESC) as rn
            FROM seller_sales
        )
        SELECT 
            rn as seller_rank,
            revenue,
            CASE WHEN t.total_revenue > 0 THEN (cumulative_revenue / t.total_revenue) * 100 ELSE 0 END as cumulative_pct,
            CASE WHEN t.total_sellers > 0 THEN (rn::float / t.total_sellers) * 100 ELSE 0 END as seller_pct
        FROM ranked_sellers
        CROSS JOIN total_sales t
        WHERE rn <= 500 -- Limit for frontend charting
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results
