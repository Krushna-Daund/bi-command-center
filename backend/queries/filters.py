from dependencies import GlobalFilterParams

def build_filtered_orders_cte(filters: GlobalFilterParams) -> tuple[str, dict]:
    """
    Builds a CTE named 'filtered_orders' that returns order_id and order_key 
    for all orders that match the global filters.
    Optimized to use EXISTS instead of JOINs to avoid DISTINCT overhead.
    """
    conditions = []
    params = {}

    if filters.date_from:
        conditions.append("o.order_purchase_timestamp >= %(date_from)s")
        params["date_from"] = f"{filters.date_from} 00:00:00"
    if filters.date_to:
        conditions.append("o.order_purchase_timestamp <= %(date_to)s")
        params["date_to"] = f"{filters.date_to} 23:59:59"
    if filters.order_status:
        conditions.append("o.order_status = %(order_status)s")
        params["order_status"] = filters.order_status

    if filters.customer_state or filters.customer_city:
        cust_conds = []
        if filters.customer_state:
            cust_conds.append("c.state = %(customer_state)s")
            params["customer_state"] = filters.customer_state
        if filters.customer_city:
            cust_conds.append("c.city = %(customer_city)s")
            params["customer_city"] = filters.customer_city
        
        conditions.append(f"""
            EXISTS (
                SELECT 1 FROM analytics.dim_customer c 
                WHERE c.customer_key = o.customer_key 
                AND {" AND ".join(cust_conds)}
            )
        """)

    # Product/Category require order_item and product
    if filters.category or filters.product:
        prod_conds = []
        if filters.category:
            prod_conds.append("p.category_name_english = %(category)s")
            params["category"] = filters.category
        if filters.product:
            prod_conds.append("p.product_id = %(product)s")
            params["product"] = filters.product
            
        conditions.append(f"""
            EXISTS (
                SELECT 1 FROM analytics.fact_order_item oi
                JOIN analytics.dim_product p ON oi.product_key = p.product_key
                WHERE oi.order_key = o.order_key
                AND {" AND ".join(prod_conds)}
            )
        """)

    # Seller requires order_item and seller
    if filters.seller_state or filters.seller_city or filters.seller:
        sel_conds = []
        if filters.seller_state:
            sel_conds.append("s.state = %(seller_state)s")
            params["seller_state"] = filters.seller_state
        if filters.seller_city:
            sel_conds.append("s.city = %(seller_city)s")
            params["seller_city"] = filters.seller_city
        if filters.seller:
            sel_conds.append("s.seller_id = %(seller)s")
            params["seller"] = filters.seller
            
        conditions.append(f"""
            EXISTS (
                SELECT 1 FROM analytics.fact_order_item oi
                JOIN analytics.dim_seller s ON oi.seller_key = s.seller_key
                WHERE oi.order_key = o.order_key
                AND {" AND ".join(sel_conds)}
            )
        """)

    # Payment
    if filters.payment_type:
        conditions.append("""
            EXISTS (
                SELECT 1 FROM analytics.fact_payment py
                WHERE py.order_key = o.order_key
                AND py.payment_type = %(payment_type)s
            )
        """)
        params["payment_type"] = filters.payment_type

    # Review
    if filters.review_score is not None:
        conditions.append("""
            EXISTS (
                SELECT 1 FROM analytics.fact_review r
                WHERE r.order_key = o.order_key
                AND r.review_score = %(review_score)s
            )
        """)
        params["review_score"] = filters.review_score

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    cte = f"""
    WITH filtered_orders AS (
        SELECT o.order_key, o.order_id
        FROM analytics.fact_order o
        WHERE {where_clause}
    )
    """
    return cte, params
