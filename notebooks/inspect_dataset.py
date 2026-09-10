from pathlib import Path

import pandas as pd


DATA_DIR = Path("../data/olist")


csv_files = sorted(DATA_DIR.glob("*.csv"))

print(f"Found {len(csv_files)} CSV files\n")

for file in csv_files:
    df = pd.read_csv(file)

    print("=" * 80)
    print(f"FILE: {file.name}")
    print(f"ROWS: {len(df):,}")
    print(f"COLUMNS: {len(df.columns)}")
    print("\nCOLUMNS:")
    print(list(df.columns))

    print("\nMISSING VALUES:")
    missing = df.isna().sum()
    missing = missing[missing > 0]

    if missing.empty:
        print("None")
    else:
        print(missing.sort_values(ascending=False))

    print()