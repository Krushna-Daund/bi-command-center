from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/customers", tags=["customers"])

@router.get("/summary")
@cache(expire=300)
def get_customers_summary(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        , customer_orders AS (
            SELECT 
                c.customer_unique_id, 
                COUNT(DISTINCT fo.order_id) as order_count,
                COALESCE(SUM(oi.price + oi.freight_value), 0) as total_spent
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
            LEFT JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            GROUP BY c.customer_unique_id
        )
        SELECT 
            COUNT(*) as total_customers,
            COUNT(CASE WHEN order_count > 1 THEN 1 END) as repeat_customers,
            CASE WHEN COUNT(*) = 0 THEN 0 ELSE COUNT(CASE WHEN order_count > 1 THEN 1 END) * 100.0 / COUNT(*) END as repeat_rate,
            CASE WHEN COUNT(*) = 0 THEN 0 ELSE SUM(total_spent) / COUNT(*) END as avg_value_per_customer
        FROM customer_orders
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchone()
        
    return results

@router.get("/state")
@cache(expire=300)
def get_customers_by_state(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        SELECT 
            c.state,
            COUNT(DISTINCT c.customer_unique_id) as unique_customers
        FROM filtered_orders fo
        JOIN analytics.fact_order o ON fo.order_key = o.order_key
        JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
        GROUP BY c.state
        ORDER BY unique_customers DESC
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results

@router.get("/segmentation")
@cache(expire=300)
def get_customer_segmentation(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    query = f"""
        {cte_sql}
        , customer_orders AS (
            SELECT 
                c.customer_unique_id, 
                COUNT(DISTINCT fo.order_id) as order_count,
                COALESCE(SUM(oi.price), 0) as total_spent
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
            LEFT JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            GROUP BY c.customer_unique_id
        )
        , segments AS (
            SELECT 
                CASE 
                    WHEN order_count = 1 AND total_spent < 100 THEN 'One-time (Low Value)'
                    WHEN order_count = 1 AND total_spent >= 100 THEN 'One-time (High Value)'
                    WHEN order_count > 1 AND order_count <= 3 THEN 'Occasional (2-3)'
                    WHEN order_count > 3 THEN 'Loyal (4+)'
                    ELSE 'Other'
                END as segment,
                COUNT(customer_unique_id) as num_customers,
                SUM(total_spent) as total_revenue
            FROM customer_orders
            GROUP BY 1
        )
        SELECT * FROM segments ORDER BY total_revenue DESC
    """
    with db.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()

@router.get("/cohorts")
@cache(expire=300)
def get_customer_cohorts(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    query = f"""
        {cte_sql}
        , customer_first_order AS (
            SELECT 
                c.customer_unique_id,
                MIN(d.year * 100 + d.month) as cohort_month
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
            JOIN analytics.dim_date d ON o.order_date_key = d.date_key
            GROUP BY c.customer_unique_id
        )
        , customer_activity AS (
            SELECT 
                c.customer_unique_id,
                d.year * 100 + d.month as activity_month
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
            JOIN analytics.dim_date d ON o.order_date_key = d.date_key
            GROUP BY c.customer_unique_id, d.year * 100 + d.month
        )
        , cohort_size AS (
            SELECT cohort_month, COUNT(DISTINCT customer_unique_id) as num_customers
            FROM customer_first_order
            GROUP BY cohort_month
        )
        , retention AS (
            SELECT 
                f.cohort_month,
                a.activity_month,
                (a.activity_month / 100 - f.cohort_month / 100) * 12 + (a.activity_month %% 100 - f.cohort_month %% 100) as months_since_first,
                COUNT(DISTINCT a.customer_unique_id) as active_customers
            FROM customer_first_order f
            JOIN customer_activity a ON f.customer_unique_id = a.customer_unique_id
            GROUP BY 1, 2, 3
        )
        SELECT 
            r.cohort_month::text as cohort_month,
            s.num_customers as cohort_size,
            r.months_since_first as month_index,
            r.active_customers,
            CASE WHEN s.num_customers > 0 THEN (r.active_customers::float / s.num_customers) * 100 ELSE 0 END as retention_pct
        FROM retention r
        JOIN cohort_size s ON r.cohort_month = s.cohort_month
        WHERE r.months_since_first <= 12
        ORDER BY r.cohort_month DESC, r.months_since_first
        LIMIT 500
    """
    with db.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()

@router.get("/value_distribution")
@cache(expire=300)
def get_customer_value_distribution(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    query = f"""
        {cte_sql}
        , customer_orders AS (
            SELECT 
                c.customer_unique_id, 
                COALESCE(SUM(oi.price), 0) as total_spent
            FROM filtered_orders fo
            JOIN analytics.fact_order o ON fo.order_key = o.order_key
            JOIN analytics.dim_customer c ON o.customer_key = c.customer_key
            JOIN analytics.fact_order_item oi ON fo.order_key = oi.order_key
            GROUP BY c.customer_unique_id
        )
        SELECT 
            percentile_cont(0.25) WITHIN GROUP (ORDER BY total_spent) as p25,
            percentile_cont(0.50) WITHIN GROUP (ORDER BY total_spent) as median,
            percentile_cont(0.75) WITHIN GROUP (ORDER BY total_spent) as p75,
            percentile_cont(0.90) WITHIN GROUP (ORDER BY total_spent) as p90,
            percentile_cont(0.95) WITHIN GROUP (ORDER BY total_spent) as p95,
            percentile_cont(0.99) WITHIN GROUP (ORDER BY total_spent) as p99,
            AVG(total_spent) as mean
        FROM customer_orders
    """
    with db.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchone()
