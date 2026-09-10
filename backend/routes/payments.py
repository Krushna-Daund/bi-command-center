from fastapi import APIRouter, Depends, Request
from fastapi_cache.decorator import cache
from psycopg import Connection
from dependencies import get_db, GlobalFilterParams
from queries.filters import build_filtered_orders_cte

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.get("/summary")
@cache(expire=300)
def get_payment_summary(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        SELECT 
            COALESCE(SUM(p.payment_value), 0) as total_payment_value,
            COALESCE(AVG(p.payment_installments), 0) as avg_installments,
            COUNT(CASE WHEN p.payment_installments > 1 THEN 1 END) as installment_orders
        FROM filtered_orders fo
        JOIN analytics.fact_payment p ON fo.order_key = p.order_key
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchone()
        
    return results

@router.get("/distribution")
@cache(expire=300)
def get_payment_distribution(
    request: Request,
    filters: GlobalFilterParams = Depends(),
    db: Connection = Depends(get_db)
):
    cte_sql, params = build_filtered_orders_cte(filters)
    
    query = f"""
        {cte_sql}
        SELECT 
            p.payment_type,
            COUNT(*) as count,
            COALESCE(SUM(p.payment_value), 0) as total_value
        FROM filtered_orders fo
        JOIN analytics.fact_payment p ON fo.order_key = p.order_key
        GROUP BY p.payment_type
        ORDER BY total_value DESC
    """
    
    with db.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
        
    return results
