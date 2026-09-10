import os
from typing import Optional
from fastapi import Query
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()

def get_db():
    conn = psycopg.connect(
        host=os.getenv("DATABASE_HOST", "localhost"),
        port=os.getenv("DATABASE_PORT", "5432"),
        dbname=os.getenv("DATABASE_NAME", "bi_command_center"),
        user=os.getenv("DATABASE_USER", "postgres"),
        password=os.getenv("DATABASE_PASSWORD"),
        row_factory=dict_row
    )
    try:
        yield conn
    finally:
        conn.close()

class GlobalFilterParams:
    def __init__(
        self,
        date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
        date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
        customer_state: Optional[str] = Query(None, description="Customer state abbreviation (e.g., SP)"),
        customer_city: Optional[str] = Query(None, description="Customer city name"),
        category: Optional[str] = Query(None, description="Product category (English)"),
        product: Optional[str] = Query(None, description="Product ID"),
        seller_state: Optional[str] = Query(None, description="Seller state abbreviation"),
        seller_city: Optional[str] = Query(None, description="Seller city name"),
        seller: Optional[str] = Query(None, description="Seller ID"),
        order_status: Optional[str] = Query(None, description="Order status (e.g., delivered)"),
        payment_type: Optional[str] = Query(None, description="Payment type (e.g., credit_card)"),
        review_score: Optional[int] = Query(None, description="Review score (1-5)")
    ):
        self.date_from = date_from
        self.date_to = date_to
        self.customer_state = customer_state
        self.customer_city = customer_city
        self.category = category
        self.product = product
        self.seller_state = seller_state
        self.seller_city = seller_city
        self.seller = seller
        self.order_status = order_status
        self.payment_type = payment_type
        self.review_score = review_score

def get_filter_conditions(filters: GlobalFilterParams) -> tuple[str, dict]:
    """
    Returns a tuple of (sql_where_clause, params_dict)
    Assumes standard aliases for tables in queries:
    o  - fact_order
    c  - dim_customer
    oi - fact_order_item
    p  - dim_product
    s  - dim_seller
    py - fact_payment
    r  - fact_review
    """
    conditions = []
    params = {}

    if filters.date_from:
        conditions.append("o.order_purchase_timestamp >= %(date_from)s")
        params["date_from"] = f"{filters.date_from} 00:00:00"
    if filters.date_to:
        conditions.append("o.order_purchase_timestamp <= %(date_to)s")
        params["date_to"] = f"{filters.date_to} 23:59:59"
    if filters.customer_state:
        conditions.append("c.state = %(customer_state)s")
        params["customer_state"] = filters.customer_state
    if filters.customer_city:
        conditions.append("c.city = %(customer_city)s")
        params["customer_city"] = filters.customer_city
    if filters.category:
        conditions.append("p.category_name_english = %(category)s")
        params["category"] = filters.category
    if filters.product:
        conditions.append("p.product_id = %(product)s")
        params["product"] = filters.product
    if filters.seller_state:
        conditions.append("s.state = %(seller_state)s")
        params["seller_state"] = filters.seller_state
    if filters.seller_city:
        conditions.append("s.city = %(seller_city)s")
        params["seller_city"] = filters.seller_city
    if filters.seller:
        conditions.append("s.seller_id = %(seller)s")
        params["seller"] = filters.seller
    if filters.order_status:
        conditions.append("o.order_status = %(order_status)s")
        params["order_status"] = filters.order_status
    if filters.payment_type:
        conditions.append("py.payment_type = %(payment_type)s")
        params["payment_type"] = filters.payment_type
    if filters.review_score is not None:
        conditions.append("r.review_score = %(review_score)s")
        params["review_score"] = filters.review_score

    where_clause = " AND ".join(conditions)
    if where_clause:
        where_clause = f" AND {where_clause} "
    else:
        where_clause = " "
    
    return where_clause, params
