from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

@router.get("/distribution")
@cache(expire=300)
def get_review_distribution(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        SELECT 
            r.review_score,
            COUNT(*) as count
        FROM filtered_orders fo
        JOIN analytics.fact_review r ON fo.order_key = r.order_key
        GROUP BY r.review_score
        ORDER BY r.review_score DESC
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results

@router.get("/trend")
@cache(expire=300)
def get_review_trend(
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
            COALESCE(AVG(r.review_score), 0) as average_score
        FROM filtered_orders fo
        JOIN analytics.fact_review r ON fo.order_key = r.order_key
        JOIN analytics.fact_order o ON fo.order_key = o.order_key
        JOIN analytics.dim_date d ON o.order_date_key = d.date_key
        GROUP BY d.year, d.month
        ORDER BY d.year, d.month
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results
