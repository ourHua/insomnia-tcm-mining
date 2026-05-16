#!/usr/bin/env python3
"""step2_normalization.py — Apply 24 ontology rules + intra-prescription dedupe.

Inputs : data/anonymized_prescription_transactions.csv
         data/herb_normalization_map.csv
Outputs: outputs/intermediates/cleaned_prescriptions.csv
         outputs/intermediates/normalization_summary.json
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
    mapping = dict(zip(mp["raw_name"], mp["canonical_name"]))

    n_records_raw = len(df)
    n_herbs_raw = df["herb"].nunique()
    n_rules = len(mp)

    df["herb_canonical"] = df["herb"].replace(mapping)
    n_normalized = int((df["herb"] != df["herb_canonical"]).sum())

    n_herbs_after_norm = df["herb_canonical"].nunique()

    cleaned = df[["prescription_id", "herb_canonical"]].drop_duplicates()
    cleaned = cleaned.rename(columns={"herb_canonical": "herb"})
    n_intra_rx_dedup_removed = int(len(df) - len(cleaned))
    n_records_clean = len(cleaned)

    herb_per_rx = cleaned.groupby("prescription_id").size()

    cleaned_path = OUT / "cleaned_prescriptions.csv"
    cleaned.to_csv(cleaned_path, index=False)

    summary = {
        "n_records_raw": n_records_raw,
        "n_prescriptions": int(cleaned["prescription_id"].nunique()),
        "n_herb_expressions_raw": int(n_herbs_raw),
        "n_normalization_rules": int(n_rules),
        "n_records_normalized_by_map": n_normalized,
        "pct_records_normalized": round(n_normalized / n_records_raw * 100, 4),
        "n_herb_entities_after_normalization": int(n_herbs_after_norm),
        "n_records_removed_by_intra_rx_dedup": n_intra_rx_dedup_removed,
        "n_records_clean": n_records_clean,
        "herb_per_prescription_after_clean": {
            "mean": round(float(herb_per_rx.mean()), 4),
            "std": round(float(herb_per_rx.std(ddof=1)), 4),
            "median": float(herb_per_rx.median()),
            "min": int(herb_per_rx.min()),
            "max": int(herb_per_rx.max()),
        },
    }

    summary_path = OUT / "normalization_summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2))

    print(f"[step2] cleaned_prescriptions.csv  -> {cleaned_path}  ({n_records_clean} rows)")
    print(f"[step2] normalization_summary.json -> {summary_path}")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
