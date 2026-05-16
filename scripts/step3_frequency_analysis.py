#!/usr/bin/env python3
"""step3_frequency_analysis.py — Herb frequency table + Pareto figure.

Inputs : outputs/intermediates/cleaned_prescriptions.csv
Outputs: outputs/intermediates/herb_frequency.csv
         outputs/tables/table2_top10_herbs.csv
         outputs/figures/figure2_pareto_top30.png / .pdf
"""
from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
INT_DIR = ROOT / "outputs" / "intermediates"
TBL_DIR = ROOT / "outputs" / "tables"
FIG_DIR = ROOT / "outputs" / "figures"
for d in (TBL_DIR, FIG_DIR):
    d.mkdir(parents=True, exist_ok=True)

# Try to use a CJK-capable font so Chinese herb labels render.
from _plot_setup import configure_cjk_font
configure_cjk_font()


def main() -> None:
    df = pd.read_csv(INT_DIR / "cleaned_prescriptions.csv")
    n_rx = df["prescription_id"].nunique()
    total = len(df)

    freq = (
        df["herb"].value_counts()
        .rename_axis("herb")
        .reset_index(name="frequency")
    )
    freq["prevalence_pct"] = (freq["frequency"] / n_rx * 100).round(4)
    freq["cum_pct_of_total_usage"] = (freq["frequency"].cumsum() / total * 100).round(4)
    freq.to_csv(INT_DIR / "herb_frequency.csv", index=False)

    # Table 2 — Top 10
    top10 = freq.head(10).copy()
    top10.insert(0, "rank", range(1, 11))
    top10.to_csv(TBL_DIR / "table2_top10_herbs.csv", index=False)

    # Figure 2 — Pareto Top 30
    top30 = freq.head(30).copy()
    fig, ax1 = plt.subplots(figsize=(11, 5.2), dpi=160)
    bar_colors = ["#E08B3C" if i < 10 else "#9CA8B5" for i in range(len(top30))]
    ax1.bar(range(len(top30)), top30["frequency"], color=bar_colors, edgecolor="black", linewidth=0.4)
    ax1.set_xticks(range(len(top30)))
    ax1.set_xticklabels(top30["herb"], rotation=45, ha="right", fontsize=9)
    ax1.set_ylabel("Frequency", fontsize=11)
    ax1.set_xlabel("Herb (Top 30)", fontsize=11)

    ax2 = ax1.twinx()
    ax2.plot(range(len(top30)), top30["cum_pct_of_total_usage"],
             color="#B22222", marker="o", linewidth=1.5)
    ax2.axhline(80, color="grey", linestyle="--", linewidth=0.8)
    ax2.set_ylabel("Cumulative share of total herb usage (%)", fontsize=11)
    ax2.set_ylim(0, 100)

    plt.title("Figure 2. Pareto distribution of Top 30 high-frequency herbs", fontsize=12)
    plt.tight_layout()
    plt.savefig(FIG_DIR / "figure2_pareto_top30.png", dpi=300, bbox_inches="tight")
    plt.savefig(FIG_DIR / "figure2_pareto_top30.pdf", bbox_inches="tight")
    plt.close()

    # Quick console preview
    print("[step3] Top 10 herbs:")
    print(top10.to_string(index=False))
    print(f"[step3] herb_frequency.csv          -> {INT_DIR / 'herb_frequency.csv'}")
    print(f"[step3] table2_top10_herbs.csv      -> {TBL_DIR / 'table2_top10_herbs.csv'}")
    print(f"[step3] figure2_pareto_top30        -> {FIG_DIR}")
    n_to_80 = int((freq["cum_pct_of_total_usage"] < 80).sum()) + 1
    print(f"[step3] Herbs needed to cover 80%   = {n_to_80} ({n_to_80/len(freq)*100:.2f}% of all entities)")


if __name__ == "__main__":
    main()
