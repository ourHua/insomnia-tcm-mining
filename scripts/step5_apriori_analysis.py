#!/usr/bin/env python3
"""step5_apriori_analysis.py — Apriori frequent itemsets + association rules.

Baseline triple constraint:
    min_support     = 0.20
    min_confidence  = 0.60
    Lift            > 1.0

Inputs : outputs/intermediates/transaction_matrix.csv
Outputs: outputs/intermediates/frequent_itemsets.csv
         outputs/intermediates/apriori_rules_all.csv
         outputs/intermediates/apriori_rules_binary.csv
         outputs/tables/table3_apriori_binary_rules.csv
         outputs/figures/figure3_apriori_bubble.png / .pdf
"""
from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules

ROOT = Path(__file__).resolve().parents[1]
INT_DIR = ROOT / "outputs" / "intermediates"
TBL_DIR = ROOT / "outputs" / "tables"
FIG_DIR = ROOT / "outputs" / "figures"
for d in (INT_DIR, TBL_DIR, FIG_DIR):
    d.mkdir(parents=True, exist_ok=True)

from _plot_setup import configure_cjk_font
from herb_i18n import pinyin
configure_cjk_font()

MIN_SUPPORT = 0.20
MIN_CONFIDENCE = 0.60
MIN_LIFT = 1.0


def _fmt_set(s) -> str:
    return ", ".join(sorted(list(s)))


def main() -> None:
    tm = pd.read_csv(INT_DIR / "transaction_matrix.csv", index_col=0).astype(bool)

    fi = apriori(tm, min_support=MIN_SUPPORT, use_colnames=True, max_len=4)
    fi["k"] = fi["itemsets"].apply(len)
    fi["itemset_str"] = fi["itemsets"].apply(_fmt_set)
    fi_out = fi[["itemset_str", "support", "k"]].rename(columns={"itemset_str": "itemset"})
    fi_out.to_csv(INT_DIR / "frequent_itemsets.csv", index=False)

    rules = association_rules(fi, metric="confidence", min_threshold=MIN_CONFIDENCE)
    rules = rules[rules["lift"] > MIN_LIFT].copy()
    rules["antecedents_str"] = rules["antecedents"].apply(_fmt_set)
    rules["consequents_str"] = rules["consequents"].apply(_fmt_set)
    rules["n_lhs"] = rules["antecedents"].apply(len)
    rules["n_rhs"] = rules["consequents"].apply(len)

    keep_cols = [
        "antecedents_str", "consequents_str", "n_lhs", "n_rhs",
        "support", "confidence", "lift", "leverage", "conviction",
    ]
    rules_all = rules[keep_cols].copy()
    rules_all.columns = [
        "LHS", "RHS", "n_LHS", "n_RHS",
        "support", "confidence", "lift", "leverage", "conviction",
    ]
    rules_all = rules_all.sort_values(["support", "lift"], ascending=False).reset_index(drop=True)
    rules_all.to_csv(INT_DIR / "apriori_rules_all.csv", index=False)

    binary = rules_all[(rules_all["n_LHS"] == 1) & (rules_all["n_RHS"] == 1)].copy()
    binary = binary.drop(columns=["n_LHS", "n_RHS"])
    binary["support_pct"] = (binary["support"] * 100).round(2)
    binary["confidence_pct"] = (binary["confidence"] * 100).round(2)
    binary["lift"] = binary["lift"].round(2)
    binary = binary.sort_values(["support_pct", "lift"], ascending=False).reset_index(drop=True)
    binary.to_csv(INT_DIR / "apriori_rules_binary.csv", index=False)

    # Table 3 — investor-ready columns
    table3 = binary[["LHS", "RHS", "support_pct", "confidence_pct", "lift"]].copy()
    table3.columns = ["LHS (前项)", "RHS (后项)",
                      "Support (%)", "Confidence (%)", "Lift"]
    table3.to_csv(TBL_DIR / "table3_apriori_binary_rules.csv", index=False)

    # Figure 3 — bubble: support vs confidence, size & color = lift
    fig, ax = plt.subplots(figsize=(9.5, 6.2), dpi=160)
    sc = ax.scatter(
        binary["support_pct"], binary["confidence_pct"],
        s=(binary["lift"] ** 4) * 8,
        c=binary["lift"], cmap="viridis",
        edgecolor="black", linewidth=0.4, alpha=0.85,
    )
    cb = plt.colorbar(sc, ax=ax)
    cb.set_label("Lift", fontsize=11)
    for _, r in binary.iterrows():
        if r["lift"] >= 1.40:
            ax.annotate(
                f"{pinyin(r['LHS'])} → {pinyin(r['RHS'])}\nLift={r['lift']:.2f}",
                (r["support_pct"], r["confidence_pct"]),
                xytext=(6, 6), textcoords="offset points", fontsize=8,
            )
    ax.set_xlabel("Support (%)", fontsize=11)
    ax.set_ylabel("Confidence (%)", fontsize=11)
    ax.set_title("Figure 3. Apriori binary association rules in the support–confidence–lift space", fontsize=12)
    ax.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(FIG_DIR / "figure3_apriori_bubble.png", dpi=300, bbox_inches="tight")
    plt.savefig(FIG_DIR / "figure3_apriori_bubble.pdf", bbox_inches="tight")
    plt.close()

    print(f"[step5] frequent itemsets   : {len(fi)} (k=1:{sum(fi['k']==1)}, "
          f"k=2:{sum(fi['k']==2)}, k=3:{sum(fi['k']==3)}, k=4:{sum(fi['k']==4)})")
    print(f"[step5] rules (all sizes)   : {len(rules_all)}")
    print(f"[step5] binary rules (1->1) : {len(binary)}")
    print(f"[step5] outputs             -> {INT_DIR}, {TBL_DIR}, {FIG_DIR}")


if __name__ == "__main__":
    main()
