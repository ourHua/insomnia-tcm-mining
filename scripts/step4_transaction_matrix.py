#!/usr/bin/env python3
"""step4_transaction_matrix.py — Build the 986 x 317 Boolean transaction matrix.

Inputs : outputs/intermediates/cleaned_prescriptions.csv
Outputs: outputs/intermediates/transaction_matrix.csv
         outputs/intermediates/transaction_matrix.parquet  (faster reload, optional)
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
INT_DIR = ROOT / "outputs" / "intermediates"
INT_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    df = pd.read_csv(INT_DIR / "cleaned_prescriptions.csv")
    # Sort columns by global frequency descending for downstream readability
    herb_order = df["herb"].value_counts().index.tolist()

    tm = (
        df.assign(value=1)
          .pivot_table(index="prescription_id", columns="herb",
                       values="value", aggfunc="max", fill_value=0)
          .reindex(columns=herb_order)
          .astype("int8")
    )

    csv_path = INT_DIR / "transaction_matrix.csv"
    tm.to_csv(csv_path)
    print(f"[step4] transaction_matrix.csv  -> {csv_path}  shape={tm.shape}")

    try:
        tm.to_parquet(INT_DIR / "transaction_matrix.parquet")
    except Exception as e:  # pragma: no cover
        print(f"[step4] (parquet skipped: {e})")


if __name__ == "__main__":
    main()
