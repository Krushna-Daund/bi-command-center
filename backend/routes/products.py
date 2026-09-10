from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("/summary")
@cache(expire=300)
def get_products_summary(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        SELECT 
            COUNT(DISTINCT p.product_id) as total_products,
            COUNT(DISTINCT p.category_name_english) as total_categories,
            COUNT(oi.order_item_id) as items_sold,
            COALESCE(SUM(oi.price), 0) as product_revenue,
            CASE WHEN COUNT(DISTINCT p.product_id) = 0 THEN 0 ELSE COALESCE(SUM(oi.price), 0) / COUNT(DISTINCT p.product_id) END as avg_product_revenue
        FROM filtered_orders fo
        JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
        JOIN analytics.dim_product p ON oi.product_key = p.product_key
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchone()
        
    return results

@router.get("/categories")
@cache(expire=300)
def get_categories_performance(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        SELECT 
            COALESCE(p.category_name_english, 'Unknown') as category,
            COUNT(oi.order_item_id) as items_sold,
            COALESCE(SUM(oi.price), 0) as product_revenue
        FROM filtered_orders fo
        JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
        JOIN analytics.dim_product p ON oi.product_key = p.product_key
        GROUP BY COALESCE(p.category_name_english, 'Unknown')
        ORDER BY product_revenue DESC
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results

@router.get("/pareto")
@cache(expire=300)
def get_products_pareto(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , product_sales AS (
            SELECT 
                oi.product_key,
                p.product_id,
                COALESCE(SUM(oi.price), 0) as revenue
            FROM filtered_orders fo
            JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            JOIN analytics.dim_product p ON oi.product_key = p.product_key
            GROUP BY oi.product_key, p.product_id
        )
        , total_sales AS (
            SELECT SUM(revenue) as total_revenue, COUNT(product_key) as total_products FROM product_sales
        )
        , ranked_products AS (
            SELECT 
                product_id,
                revenue,
                SUM(revenue) OVER (ORDER BY revenue DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as cumulative_revenue,
                ROW_NUMBER() OVER (ORDER BY revenue DESC) as rn
            FROM product_sales
        )
        SELECT 
            rn as product_rank,
            revenue,
            CASE WHEN t.total_revenue > 0 THEN (cumulative_revenue / t.total_revenue) * 100 ELSE 0 END as cumulative_pct,
            CASE WHEN t.total_products > 0 THEN (rn::float / t.total_products) * 100 ELSE 0 END as product_pct
        FROM ranked_products
        CROSS JOIN total_sales t
        WHERE rn <= 1000 -- Limit for frontend charting, Pareto curve shape
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results

@router.get("/category_matrix")
@cache(expire=300)
def get_category_matrix(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , category_months AS (
            SELECT 
                p.category_name_english as category,
                d.year,
                d.month,
                COALESCE(SUM(oi.price), 0) as revenue
            FROM filtered_orders fo
            JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            JOIN analytics.dim_product p ON oi.product_key = p.product_key
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_date d ON o.order_date_key = d.date_key
            WHERE p.category_name_english IS NOT NULL
            GROUP BY p.category_name_english, d.year, d.month
        )
        , growth_calc AS (
            SELECT 
                category,
                year,
                month,
                revenue,
                LAG(revenue) OVER (PARTITION BY category ORDER BY year, month) as prev_revenue
            FROM category_months
        )
        , latest_month AS (
            SELECT year, month FROM growth_calc ORDER BY year DESC, month DESC LIMIT 1
        )
        SELECT 
            gc.category,
            gc.revenue,
            CASE WHEN gc.prev_revenue > 0 THEN ((gc.revenue - gc.prev_revenue) / gc.prev_revenue) * 100 ELSE 0 END as growth_pct
        FROM growth_calc gc
        JOIN latest_month lm ON gc.year = lm.year AND gc.month = lm.month
        WHERE gc.revenue > 1000 -- Filter small noise categories
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results
