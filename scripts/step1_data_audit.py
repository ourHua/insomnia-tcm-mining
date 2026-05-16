#!/usr/bin/env python3
"""step1_data_audit.py — Data completeness & integrity audit.

Reads the raw prescription transaction file and the herb normalization
ontology. Reports:
  * shape, dtypes, null check
  * (prescription_id, herb) duplicate scan
  * per-prescription herb count distribution
  * unique prescription / herb counts

Inputs : data/anonymized_prescription_transactions.csv
         data/herb_normalization_map.csv
Outputs: outputs/intermediates/audit_report.json
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = ROOT / "outputs" / "intermediates"
OUT.mkdir(parents=True, exist_ok=True)


def main() -> None:
    df = pd.read_csv(DATA / "anonymized_prescription_transactions.csv")
    mp = pd.read_csv(DATA / "herb_normalization_map.csv")

    herb_per_rx = df.groupby("prescription_id").size()

    report = {
        "raw_transactions": {
            "n_records": int(len(df)),
            "n_unique_prescriptions": int(df["prescription_id"].nunique()),
            "n_unique_herb_expressions": int(df["herb"].nunique()),
            "columns": df.columns.tolist(),
            "dtypes": {c: str(df[c].dtype) for c in df.columns},
            "n_missing_prescription_id": int(df["prescription_id"].isna().sum()),
            "n_missing_herb": int(df["herb"].isna().sum()),
            "n_fully_duplicated_rows": int(df.duplicated().sum()),
            "n_intra_prescription_dup_combinations": int(
                (df.groupby(["prescription_id", "herb"]).size() > 1).sum()
            ),
            "herb_per_prescription": {
                "mean": float(round(herb_per_rx.mean(), 4)),
                "std": float(round(herb_per_rx.std(ddof=1), 4)),
                "median": float(herb_per_rx.median()),
                "min": int(herb_per_rx.min()),
                "max": int(herb_per_rx.max()),
            },
        },
        "normalization_map": {
            "n_rules": int(len(mp)),
            "n_unique_raw_names": int(mp["raw_name"].nunique()),
            "n_unique_canonical_names": int(mp["canonical_name"].nunique()),
        },
    }

    out_path = OUT / "audit_report.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"[step1] audit_report.json written -> {out_path}")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
