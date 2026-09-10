from pathlib import Path
import os
from datetime import datetime, date, timedelta

import pandas as pd
import psycopg
from dotenv import load_dotenv


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data" / "olist"
ENV_FILE = PROJECT_ROOT / "backend" / ".env"

load_dotenv(ENV_FILE)


DB_CONFIG = {
    "host": os.getenv("DATABASE_HOST"),
    "port": os.getenv("DATABASE_PORT"),
    "dbname": os.getenv("DATABASE_NAME"),
    "user": os.getenv("DATABASE_USER"),
    "password": os.getenv("DATABASE_PASSWORD"),
}


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    return psycopg.connect(**DB_CONFIG)


# ============================================================
# 1. CUSTOMER
# ============================================================

def load_customers(conn):

    print("\n[1/9] Loading customers...")

    df = pd.read_csv(
        DATA_DIR / "olist_customers_dataset.csv"
    )

    rows = [
        (
            row.customer_id,
            row.customer_unique_id,
            row.customer_zip_code_prefix,
            row.customer_city,
            row.customer_state,
        )
        for row in df.itertuples(index=False)
    ]

    with conn.cursor() as cur:

        cur.executemany(
            """
            INSERT INTO analytics.dim_customer (
                customer_id,
                customer_unique_id,
                zip_code_prefix,
                city,
                state
            )
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (customer_id) DO NOTHING
            """,
            rows,
        )

    conn.commit()

    print(f"   Loaded {len(df):,} customers")


# ============================================================
# 2. PRODUCTS + CATEGORY
# ============================================================

def load_products(conn):

    print("\n[2/9] Loading products and categories...")

    products = pd.read_csv(
        DATA_DIR / "olist_products_dataset.csv"
    )

    translations = pd.read_csv(
        DATA_DIR / "product_category_name_translation.csv"
    )

    products = products.merge(
        translations,
        on="product_category_name",
        how="left",
    )

    # -------------------------
    # Categories
    # -------------------------

    categories = (
        products[
            [
                "product_category_name",
                "product_category_name_english",
            ]
        ]
        .drop_duplicates()
    )

    categories = categories[
        categories["product_category_name"].notna()
    ]

    with conn.cursor() as cur:

        for row in categories.itertuples(index=False):

            cur.execute(
                """
                INSERT INTO analytics.dim_category (
                    category_name,
                    category_name_english
                )
                VALUES (%s, %s)
                ON CONFLICT (category_name)
                DO UPDATE SET
                    category_name_english =
                        EXCLUDED.category_name_english
                """,
                (
                    row.product_category_name,
                    row.product_category_name_english,
                ),
            )

    conn.commit()

    # -------------------------
    # Products
    # -------------------------

    rows = []

    for row in products.itertuples(index=False):

        rows.append(
            (
                row.product_id,
                row.product_category_name,
                row.product_category_name_english,
                None if pd.isna(row.product_name_lenght)
                else int(row.product_name_lenght),
                None if pd.isna(row.product_description_lenght)
                else int(row.product_description_lenght),
                None if pd.isna(row.product_photos_qty)
                else int(row.product_photos_qty),
                None if pd.isna(row.product_weight_g)
                else float(row.product_weight_g),
                None if pd.isna(row.product_length_cm)
                else float(row.product_length_cm),
                None if pd.isna(row.product_height_cm)
                else float(row.product_height_cm),
                None if pd.isna(row.product_width_cm)
                else float(row.product_width_cm),
            )
        )

    with conn.cursor() as cur:

        cur.executemany(
            """
            INSERT INTO analytics.dim_product (
                product_id,
                category_name,
                category_name_english,
                product_name_length,
                product_description_length,
                product_photos_qty,
                product_weight_g,
                product_length_cm,
                product_height_cm,
                product_width_cm
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s
            )
            ON CONFLICT (product_id) DO NOTHING
            """,
            rows,
        )

    conn.commit()

    print(f"   Loaded {len(products):,} products")
    print(f"   Loaded {len(categories):,} categories")


# ============================================================
# 3. SELLERS
# ============================================================

def load_sellers(conn):

    print("\n[3/9] Loading sellers...")

    df = pd.read_csv(
        DATA_DIR / "olist_sellers_dataset.csv"
    )

    rows = [
        (
            row.seller_id,
            row.seller_zip_code_prefix,
            row.seller_city,
            row.seller_state,
        )
        for row in df.itertuples(index=False)
    ]

    with conn.cursor() as cur:

        cur.executemany(
            """
            INSERT INTO analytics.dim_seller (
                seller_id,
                zip_code_prefix,
                city,
                state
            )
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (seller_id) DO NOTHING
            """,
            rows,
        )

    conn.commit()

    print(f"   Loaded {len(df):,} sellers")


# ============================================================
# 4. DATE DIMENSION
# ============================================================

def load_dates(conn):

    print("\n[4/9] Loading date dimension...")

    orders = pd.read_csv(
        DATA_DIR / "olist_orders_dataset.csv",
        usecols=["order_purchase_timestamp"],
    )

    orders["date"] = pd.to_datetime(
        orders["order_purchase_timestamp"]
    ).dt.date

    min_date = orders["date"].min()
    max_date = orders["date"].max()

    current = min_date
    rows = []

    while current <= max_date:

        rows.append(
            (
                int(current.strftime("%Y%m%d")),
                current,
                current.year,
                (current.month - 1) // 3 + 1,
                current.month,
                current.strftime("%B"),
                current.isocalendar().week,
                current.day,
                current.strftime("%A"),
                current.weekday() >= 5,
            )
        )

        current += timedelta(days=1)

    with conn.cursor() as cur:

        cur.executemany(
            """
            INSERT INTO analytics.dim_date (
                date_key,
                full_date,
                year,
                quarter,
                month,
                month_name,
                week,
                day,
                day_name,
                is_weekend
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s
            )
            ON CONFLICT (date_key) DO NOTHING
            """,
            rows,
        )

    conn.commit()

    print(f"   Loaded {len(rows):,} dates")


# ============================================================
# 5. ORDERS
# ============================================================

def load_orders(conn):

    print("\n[5/9] Loading orders...")

    df = pd.read_csv(
        DATA_DIR / "olist_orders_dataset.csv"
    )

    # Convert timestamps
    timestamp_columns = [
        "order_purchase_timestamp",
        "order_approved_at",
        "order_delivered_carrier_date",
        "order_delivered_customer_date",
        "order_estimated_delivery_date",
    ]

    for column in timestamp_columns:

        df[column] = pd.to_datetime(
            df[column],
            errors="coerce",
        )

    # Get customer keys
    customer_map = {}

    with conn.cursor() as cur:

        cur.execute(
            """
            SELECT customer_id, customer_key
            FROM analytics.dim_customer
            """
        )

        customer_map = dict(cur.fetchall())

    rows = []

    for row in df.itertuples(index=False):

        customer_key = customer_map[row.customer_id]

        purchase_date = (
            row.order_purchase_timestamp.date()
            if pd.notna(row.order_purchase_timestamp)
            else None
        )

        date_key = (
            int(purchase_date.strftime("%Y%m%d"))
            if purchase_date
            else None
        )

        rows.append(
            (
                row.order_id,
                customer_key,
                date_key,
                row.order_status,
                row.order_purchase_timestamp,
                row.order_approved_at,
                row.order_delivered_carrier_date,
                row.order_delivered_customer_date,
                row.order_estimated_delivery_date,
            )
        )

    with conn.cursor() as cur:

        cur.executemany(
            """
            INSERT INTO analytics.fact_order (
                order_id,
                customer_key,
                order_date_key,
                order_status,
                order_purchase_timestamp,
                order_approved_at,
                order_delivered_carrier_date,
                order_delivered_customer_date,
                order_estimated_delivery_date
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s
            )
            ON CONFLICT (order_id) DO NOTHING
            """,
            rows,
        )

    conn.commit()

    print(f"   Loaded {len(df):,} orders")


# ============================================================
# 6. ORDER ITEMS
# ============================================================

def load_order_items(conn):

    print("\n[6/9] Loading order items...")

    df = pd.read_csv(
        DATA_DIR / "olist_order_items_dataset.csv"
    )

    with conn.cursor() as cur:

        cur.execute(
            """
            SELECT order_id, order_key
            FROM analytics.fact_order
            """
        )

        order_map = dict(cur.fetchall())

        cur.execute(
            """
            SELECT product_id, product_key
            FROM analytics.dim_product
            """
        )

        product_map = dict(cur.fetchall())

        cur.execute(
            """
            SELECT seller_id, seller_key
            FROM analytics.dim_seller
            """
        )

        seller_map = dict(cur.fetchall())

    df["shipping_limit_date"] = pd.to_datetime(
        df["shipping_limit_date"],
        errors="coerce",
    )

    rows = []

    for row in df.itertuples(index=False):

        rows.append(
            (
                row.order_id,
                order_map[row.order_id],
                product_map[row.product_id],
                seller_map[row.seller_id],
                row.order_item_id,
                row.shipping_limit_date,
                row.price,
                row.freight_value,
            )
        )

    with conn.cursor() as cur:

        cur.executemany(
            """
            INSERT INTO analytics.fact_order_item (
                order_id,
                order_key,
                product_key,
                seller_key,
                order_item_id,
                shipping_limit_date,
                price,
                freight_value
            )
            VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s
            )
            """,
            rows,
        )

    conn.commit()

    print(f"   Loaded {len(df):,} order items")


# ============================================================
# 7. PAYMENTS
# ============================================================

def load_payments(conn):

    print("\n[7/9] Loading payments...")

    df = pd.read_csv(
        DATA_DIR / "olist_order_payments_dataset.csv"
    )

    with conn.cursor() as cur:

        cur.execute(
            """
            SELECT order_id, order_key
            FROM analytics.fact_order
            """
        )

        order_map = dict(cur.fetchall())

    rows = []

    for row in df.itertuples(index=False):

        rows.append(
            (
                row.order_id,
                order_map[row.order_id],
                row.payment_sequential,
                row.payment_type,
                row.payment_installments,
                row.payment_value,
            )
        )

    with conn.cursor() as cur:

        cur.executemany(
            """
            INSERT INTO analytics.fact_payment (
                order_id,
                order_key,
                payment_sequential,
                payment_type,
                payment_installments,
                payment_value
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            rows,
        )

    conn.commit()

    print(f"   Loaded {len(df):,} payments")


# ============================================================
# 8. REVIEWS
# ============================================================

def load_reviews(conn):

    print("\n[8/9] Loading reviews...")

    df = pd.read_csv(
        DATA_DIR / "olist_order_reviews_dataset.csv"
    )

    date_columns = [
        "review_creation_date",
        "review_answer_timestamp",
    ]

    for column in date_columns:

        df[column] = pd.to_datetime(
            df[column],
            errors="coerce",
        )

    with conn.cursor() as cur:

        cur.execute(
            """
            SELECT order_id, order_key
            FROM analytics.fact_order
            """
        )

        order_map = dict(cur.fetchall())

    rows = []

    for row in df.itertuples(index=False):

        rows.append(
            (
                row.review_id,
                row.order_id,
                order_map[row.order_id],
                row.review_score,
                row.review_comment_title,
                row.review_comment_message,
                row.review_creation_date,
                row.review_answer_timestamp,
            )
        )

    with conn.cursor() as cur:

        cur.executemany(
            """
            INSERT INTO analytics.fact_review (
                review_id,
                order_id,
                order_key,
                review_score,
                review_comment_title,
                review_comment_message,
                review_creation_date,
                review_answer_timestamp
            )
            VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s
            )
            """,
            rows,
        )

    conn.commit()

    print(f"   Loaded {len(df):,} reviews")


# ============================================================
# 9. VALIDATION
# ============================================================

def validate(conn):

    print("\n[9/9] VALIDATING DATA")

    tables = [
        "dim_customer",
        "dim_product",
        "dim_category",
        "dim_seller",
        "dim_date",
        "fact_order",
        "fact_order_item",
        "fact_payment",
        "fact_review",
    ]

    with conn.cursor() as cur:

        for table in tables:

            cur.execute(
                f"SELECT COUNT(*) FROM analytics.{table}"
            )

            count = cur.fetchone()[0]

            print(
                f"   {table:<25} {count:>10,} rows"
            )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("OLIST BI COMMAND CENTER - FULL ETL")
    print("=" * 70)

    with get_connection() as conn:

        load_customers(conn)
        load_products(conn)
        load_sellers(conn)
        load_dates(conn)
        load_orders(conn)
        load_order_items(conn)
        load_payments(conn)
        load_reviews(conn)

        validate(conn)

    print("\nETL COMPLETED SUCCESSFULLY.")


if __name__ == "__main__":
    main()