from pathlib import Path
import os

import pandas as pd
from dotenv import load_dotenv
from psycopg import connect


PROJECT_ROOT = Path(__file__).resolve().parents[1]

load_dotenv(
    PROJECT_ROOT / "backend" / ".env"
)

DATA_FILE = (
    PROJECT_ROOT
    / "data"
    / "olist"
    / "olist_order_reviews_dataset.csv"
)


df = pd.read_csv(DATA_FILE)

df["review_creation_date"] = pd.to_datetime(
    df["review_creation_date"],
    errors="coerce"
)

df["review_answer_timestamp"] = pd.to_datetime(
    df["review_answer_timestamp"],
    errors="coerce"
)


with connect(
    host=os.getenv("DATABASE_HOST"),
    port=os.getenv("DATABASE_PORT"),
    dbname=os.getenv("DATABASE_NAME"),
    user=os.getenv("DATABASE_USER"),
    password=os.getenv("DATABASE_PASSWORD"),
) as conn:

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
            rows
        )

    conn.commit()


print(f"Loaded {len(rows):,} reviews.")