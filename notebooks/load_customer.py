from pathlib import Path

import pandas as pd
from psycopg import connect
from dotenv import load_dotenv
import os


load_dotenv(Path("../backend/.env"))


DATA_FILE = Path("../data/olist/olist_customers_dataset.csv")


df = pd.read_csv(DATA_FILE)


with connect(
    host=os.getenv("DATABASE_HOST"),
    port=os.getenv("DATABASE_PORT"),
    dbname=os.getenv("DATABASE_NAME"),
    user=os.getenv("DATABASE_USER"),
    password=os.getenv("DATABASE_PASSWORD"),
) as conn:

    with conn.cursor() as cur:

        for row in df.itertuples(index=False):

            cur.execute(
                """
                INSERT INTO analytics.dim_customer (
                    customer_id,
                    customer_unique_id,
                    zip_code_prefix,
                    city,
                    state
                )
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (customer_id) DO NOTHING;
                """,
                (
                    row.customer_id,
                    row.customer_unique_id,
                    row.customer_zip_code_prefix,
                    row.customer_city,
                    row.customer_state,
                ),
            )

    conn.commit()


print(f"Loaded {len(df):,} customers.")