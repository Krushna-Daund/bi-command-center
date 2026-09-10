from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/growth", tags=["growth"])

@router.get("/metrics")
@cache(expire=300)
def get_growth_metrics(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , monthly_base AS (
            SELECT 
                d.year,
                d.month,
                MAX(d.month_name) as month_name,
                COUNT(DISTINCT fo.order_id) as orders,
                COUNT(DISTINCT o.customer_key) as customers,
                COALESCE(SUM(oi.price + oi.freight_value), 0) as revenue
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_date d ON o.order_date_key = d.date_key
            LEFT JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            GROUP BY d.year, d.month
        )
        , growth_calc AS (
            SELECT 
                year,
                month,
                month_name,
                revenue,
                LAG(revenue) OVER (ORDER BY year, month) as prev_revenue,
                orders,
                LAG(orders) OVER (ORDER BY year, month) as prev_orders,
                customers,
                LAG(customers) OVER (ORDER BY year, month) as prev_customers,
                
                SUM(revenue) OVER (ORDER BY year, month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as rolling_3m_revenue,
                SUM(revenue) OVER (ORDER BY year, month ROWS BETWEEN 5 PRECEDING AND CURRENT ROW) as rolling_6m_revenue,
                SUM(revenue) OVER (ORDER BY year, month) as cumulative_revenue
            FROM monthly_base
        )
        SELECT 
            year,
            month,
            month_name,
            revenue,
            prev_revenue,
            CASE WHEN prev_revenue > 0 THEN (revenue - prev_revenue) / prev_revenue ELSE 0 END as revenue_growth_pct,
            revenue - COALESCE(prev_revenue, 0) as revenue_abs_growth,
            
            orders,
            prev_orders,
            CASE WHEN prev_orders > 0 THEN (orders - prev_orders)::float / prev_orders ELSE 0 END as order_growth_pct,
            orders - COALESCE(prev_orders, 0) as order_abs_growth,
            
            customers,
            prev_customers,
            CASE WHEN prev_customers > 0 THEN (customers - prev_customers)::float / prev_customers ELSE 0 END as customer_growth_pct,
            
            rolling_3m_revenue,
            rolling_6m_revenue,
            cumulative_revenue
        FROM growth_calc
        ORDER BY year, month
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results

@router.get("/contribution")
@cache(expire=300)
def get_growth_contribution(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , category_revenue AS (
            SELECT 
                p.category_name_english as category,
                COALESCE(SUM(oi.price + oi.freight_value), 0) as revenue
            FROM filtered_orders fo
            JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            JOIN analytics.dim_product p ON oi.product_key = p.product_key
            WHERE p.category_name_english IS NOT NULL
            GROUP BY p.category_name_english
        )
        , total AS (
            SELECT SUM(revenue) as total_revenue FROM category_revenue
        )
        SELECT 
            cr.category,
            cr.revenue,
            CASE WHEN t.total_revenue > 0 THEN (cr.revenue / t.total_revenue) * 100 ELSE 0 END as contribution_pct
        FROM category_revenue cr
        CROSS JOIN total t
        ORDER BY cr.revenue DESC
        LIMIT 20
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results
