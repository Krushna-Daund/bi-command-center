from pathlib import Path

import pandas as pd


DATA_DIR = Path("../data/olist")


files = [
    "olist_customers_dataset.csv",
    "olist_orders_dataset.csv",
    "olist_order_items_dataset.csv",
    "olist_order_payments_dataset.csv",
    "olist_order_reviews_dataset.csv",
    "olist_products_dataset.csv",
    "olist_sellers_dataset.csv",
]


for filename in files:
    print("\n" + "=" * 80)
    print(filename)
    print("=" * 80)

    df = pd.read_csv(DATA_DIR / filename)

    print(df.dtypes)