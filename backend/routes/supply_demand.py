from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/supply_demand", tags=["supply_demand"])

@router.get("/category")
@cache(expire=300)
def get_supply_demand_category(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , cat_metrics AS (
            SELECT 
                p.category_name_english as category,
                COUNT(DISTINCT fo.order_id) as demand_proxy_orders,
                COUNT(DISTINCT oi.seller_key) as supply_proxy_sellers,
                COALESCE(SUM(oi.price), 0) as revenue
            FROM filtered_orders fo
            JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            JOIN analytics.dim_product p ON oi.product_key = p.product_key
            WHERE p.category_name_english IS NOT NULL
            GROUP BY p.category_name_english
        )
        , cat_stats AS (
            SELECT 
                AVG(demand_proxy_orders) as avg_demand,
                AVG(supply_proxy_sellers) as avg_supply
            FROM cat_metrics
        )
        SELECT 
            m.category,
            m.demand_proxy_orders,
            m.supply_proxy_sellers,
            m.revenue,
            CASE WHEN s.avg_demand > 0 THEN m.demand_proxy_orders / s.avg_demand ELSE 0 END as demand_index,
            CASE WHEN s.avg_supply > 0 THEN m.supply_proxy_sellers / s.avg_supply ELSE 0 END as supply_index,
            CASE WHEN m.supply_proxy_sellers > 0 THEN m.demand_proxy_orders::float / m.supply_proxy_sellers ELSE 0 END as demand_supply_ratio,
            CASE 
                WHEN (m.demand_proxy_orders > s.avg_demand) AND (m.supply_proxy_sellers < s.avg_supply) THEN 'Opportunity'
                WHEN (m.demand_proxy_orders > s.avg_demand) AND (m.supply_proxy_sellers >= s.avg_supply) THEN 'Competitive'
                WHEN (m.demand_proxy_orders <= s.avg_demand) AND (m.supply_proxy_sellers >= s.avg_supply) THEN 'Oversupplied'
                ELSE 'Underserved'
            END as gap_status
        FROM cat_metrics m
        CROSS JOIN cat_stats s
        ORDER BY m.demand_proxy_orders DESC
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results

@router.get("/state")
@cache(expire=300)
def get_supply_demand_state(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , state_metrics AS (
            SELECT 
                c.state as state,
                COUNT(DISTINCT fo.order_id) as demand_proxy_orders,
                COUNT(DISTINCT oi.seller_key) as supply_proxy_sellers,
                COALESCE(SUM(oi.price), 0) as revenue
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
            JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            GROUP BY c.state
        )
        , state_stats AS (
            SELECT 
                AVG(demand_proxy_orders) as avg_demand,
                AVG(supply_proxy_sellers) as avg_supply
            FROM state_metrics
        )
        SELECT 
            m.state,
            m.demand_proxy_orders,
            m.supply_proxy_sellers,
            m.revenue,
            CASE WHEN s.avg_demand > 0 THEN m.demand_proxy_orders / s.avg_demand ELSE 0 END as demand_index,
            CASE WHEN s.avg_supply > 0 THEN m.supply_proxy_sellers / s.avg_supply ELSE 0 END as supply_index,
            CASE WHEN m.supply_proxy_sellers > 0 THEN m.demand_proxy_orders::float / m.supply_proxy_sellers ELSE 0 END as demand_supply_ratio,
            CASE 
                WHEN (m.demand_proxy_orders > s.avg_demand) AND (m.supply_proxy_sellers < s.avg_supply) THEN 'Opportunity'
                WHEN (m.demand_proxy_orders > s.avg_demand) AND (m.supply_proxy_sellers >= s.avg_supply) THEN 'Competitive'
                WHEN (m.demand_proxy_orders <= s.avg_demand) AND (m.supply_proxy_sellers >= s.avg_supply) THEN 'Oversupplied'
                ELSE 'Underserved'
            END as gap_status
        FROM state_metrics m
        CROSS JOIN state_stats s
        ORDER BY m.demand_proxy_orders DESC
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results
