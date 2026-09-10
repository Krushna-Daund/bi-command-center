from pathlib import Path

import pandas as pd


DATA_DIR = Path("../data/olist")


def load(name):
    return pd.read_csv(DATA_DIR / name)


customers = load("olist_customers_dataset.csv")
orders = load("olist_orders_dataset.csv")
order_items = load("olist_order_items_dataset.csv")
payments = load("olist_order_payments_dataset.csv")
reviews = load("olist_order_reviews_dataset.csv")
products = load("olist_products_dataset.csv")
sellers = load("olist_sellers_dataset.csv")


checks = {
    "orders → customers": (
        orders["customer_id"].isin(customers["customer_id"]).mean()
    ),
    "order_items → orders": (
        order_items["order_id"].isin(orders["order_id"]).mean()
    ),
    "order_items → products": (
        order_items["product_id"].isin(products["product_id"]).mean()
    ),
    "order_items → sellers": (
        order_items["seller_id"].isin(sellers["seller_id"]).mean()
    ),
    "payments → orders": (
        payments["order_id"].isin(orders["order_id"]).mean()
    ),
    "reviews → orders": (
        reviews["order_id"].isin(orders["order_id"]).mean()
    ),
}


print("\nFOREIGN KEY COVERAGE")
print("=" * 60)

for relationship, coverage in checks.items():
    print(f"{relationship:<30} {coverage:.2%}")