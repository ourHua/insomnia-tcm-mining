#!/usr/bin/env python3
"""step10_sensitivity_analysis.py — 27-point parameter grid + Bootstrap robustness.

* Grid: min_support ∈ {0.15, 0.20, 0.25} × min_confidence ∈ {0.50, 0.60, 0.70}
        × Lift ∈ {1.0, 1.2, 1.4}
* Bootstrap: B re-samples (default 200; for the manuscript figure set B=1000 via
  the --bootstrap flag) drawing 80% prescriptions per replicate; tracks Top-10
  herb concordance and whether the four flagship strong pairs persist.

Inputs : outputs/intermediates/cleaned_prescriptions.csv
         outputs/intermediates/transaction_matrix.csv
Outputs: outputs/intermediates/sensitivity_analysis_results.csv
         outputs/intermediates/bootstrap_summary.json
         outputs/tables/table6_sensitivity_summary.csv
         outputs/figures/figure7_sensitivity.png / .pdf
"""
from __future__ import annotations

import argparse
import itertools
import json
import time
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules

ROOT = Path(__file__).resolve().parents[1]
INT_DIR = ROOT / "outputs" / "intermediates"
TBL_DIR = ROOT / "outputs" / "tables"
FIG_DIR = ROOT / "outputs" / "figures"
for d in (TBL_DIR, FIG_DIR):
    d.mkdir(parents=True, exist_ok=True)

from _plot_setup import configure_cjk_font
configure_cjk_font()

# Flagship strong-Lift pairs the manuscript foregrounds
FLAGSHIP_PAIRS = {
    frozenset({"白术", "茯苓"}),
    frozenset({"龙骨", "牡蛎"}),
    frozenset({"合欢皮", "牡蛎"}),
    frozenset({"合欢皮", "龙骨"}),
}
SECONDARY_PAIRS = {
    frozenset({"柏子仁", "远志"}),
    frozenset({"合欢皮", "首乌藤"}),
}

GRID_SUPPORT = [0.15, 0.20, 0.25]
GRID_CONFIDENCE = [0.50, 0.60, 0.70]
GRID_LIFT = [1.0, 1.2, 1.4]


def _binary_rules(tm: pd.DataFrame, sup: float, conf: float, lift: float):
    fi = apriori(tm, min_support=sup, use_colnames=True, max_len=2)
    if fi.empty:
        return pd.DataFrame()
    rules = association_rules(fi, metric="confidence", min_threshold=conf)
    if rules.empty:
        return rules
    rules = rules[rules["lift"] > lift].copy()
    rules["n_lhs"] = rules["antecedents"].apply(len)
    rules["n_rhs"] = rules["consequents"].apply(len)
    return rules[(rules["n_lhs"] == 1) & (rules["n_rhs"] == 1)]


def _top10(tm: pd.DataFrame) -> list[str]:
    return tm.sum(axis=0).sort_values(ascending=False).head(10).index.tolist()


def _pair_set(rules: pd.DataFrame) -> set[frozenset]:
    out = set()
    if rules.empty:
        return out
    for _, r in rules.iterrows():
        a = next(iter(r["antecedents"]))
        b = next(iter(r["consequents"]))
        out.add(frozenset({a, b}))
    return out


def run_grid(tm: pd.DataFrame) -> pd.DataFrame:
    base_top10 = _top10(tm)
    rows = []
    for sup, conf, lift in itertools.product(GRID_SUPPORT, GRID_CONFIDENCE, GRID_LIFT):
        t0 = time.time()
        binary = _binary_rules(tm, sup, conf, lift)
        pairs_set = _pair_set(binary)
        n_flag = sum(1 for p in FLAGSHIP_PAIRS if p in pairs_set)
        n_sec = sum(1 for p in SECONDARY_PAIRS if p in pairs_set)
        rows.append({
            "min_support": sup,
            "min_confidence": conf,
            "lift_threshold": lift,
            "n_binary_rules": int(len(binary)),
            "flagship_pairs_present": f"{n_flag}/4",
            "secondary_pairs_present": f"{n_sec}/2",
            "top10_concordance_with_baseline": "consistent",  # by construction
            "runtime_sec": round(time.time() - t0, 2),
        })
    return pd.DataFrame(rows)


def run_bootstrap(df_clean: pd.DataFrame, tm_full: pd.DataFrame, B: int = 200) -> dict:
    rng = np.random.default_rng(42)
    rx_ids = df_clean["prescription_id"].unique().tolist()
    n_sample = int(round(0.8 * len(rx_ids)))

    base_top10 = _top10(tm_full)
    flag_hits = {fp: 0 for fp in FLAGSHIP_PAIRS}
    sec_hits = {sp: 0 for sp in SECONDARY_PAIRS}
    top10_membership_match = 0
    runtimes = []

    for b in range(B):
        t0 = time.time()
        sampled = rng.choice(rx_ids, size=n_sample, replace=False)
        tm_b = tm_full.loc[sampled]
        # Drop all-zero columns
        tm_b = tm_b.loc[:, tm_b.sum(axis=0) > 0].astype(bool)
        binary = _binary_rules(tm_b, sup=0.20, conf=0.60, lift=1.40)
        pairs = _pair_set(binary)
        for fp in FLAGSHIP_PAIRS:
            if fp in pairs:
                flag_hits[fp] += 1
        for sp in SECONDARY_PAIRS:
            if sp in pairs:
                sec_hits[sp] += 1
        top10_b = _top10(tm_b)
        if set(top10_b) == set(base_top10):
            top10_membership_match += 1
        runtimes.append(time.time() - t0)

    summary = {
        "B": B,
        "fraction_resampled": 0.8,
        "top10_membership_match_pct": round(top10_membership_match / B * 100, 2),
        "flagship_pair_persistence": {
            " — ".join(sorted(list(fp))): round(flag_hits[fp] / B * 100, 2)
            for fp in FLAGSHIP_PAIRS
        },
        "secondary_pair_persistence": {
            " — ".join(sorted(list(sp))): round(sec_hits[sp] / B * 100, 2)
            for sp in SECONDARY_PAIRS
        },
        "mean_runtime_sec_per_bootstrap": round(float(np.mean(runtimes)), 2),
    }
    return summary


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bootstrap", type=int, default=200,
                        help="Number of bootstrap resamples (manuscript uses 1000).")
    args = parser.parse_args()

    df_clean = pd.read_csv(INT_DIR / "cleaned_prescriptions.csv")
    tm = pd.read_csv(INT_DIR / "transaction_matrix.csv", index_col=0).astype(bool)

    print("[step10] Running 27-point parameter grid...")
    grid = run_grid(tm)
    grid.to_csv(INT_DIR / "sensitivity_analysis_results.csv", index=False)
    grid.to_csv(TBL_DIR / "table6_sensitivity_summary.csv", index=False)

    print("[step10] Running Bootstrap robustness check (B = "
          f"{args.bootstrap})...")
    boot = run_bootstrap(df_clean, tm, B=args.bootstrap)
    (INT_DIR / "bootstrap_summary.json").write_text(
        json.dumps(boot, ensure_ascii=False, indent=2)
    )

    # Figure 7 — sensitivity curve
    fig, ax = plt.subplots(figsize=(9, 5), dpi=160)
    markers = {1.0: "o", 1.2: "s", 1.4: "^"}
    colors = {0.50: "#7aae6b", 0.60: "#4f8fc0", 0.70: "#e07b5b"}
    for conf, color in colors.items():
        for lift, mk in markers.items():
            sub = grid[(grid["min_confidence"] == conf) & (grid["lift_threshold"] == lift)]
            ax.plot(sub["min_support"], sub["n_binary_rules"],
                    color=color, marker=mk, linewidth=1.4, markersize=8 + 4 * (lift - 1.0),
                    label=f"conf={conf}, lift>{lift}")
    ax.set_xlabel("min_support", fontsize=11)
    ax.set_ylabel("# binary rules", fontsize=11)
    ax.set_title("Figure 7. Apriori parameter sensitivity (27-point grid)", fontsize=12)
    ax.grid(alpha=0.3)
    ax.legend(fontsize=7, ncol=3, loc="upper right")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "figure7_sensitivity.png", dpi=300, bbox_inches="tight")
    plt.savefig(FIG_DIR / "figure7_sensitivity.pdf", bbox_inches="tight")
    plt.close()

    print("[step10] Grid head:")
    print(grid.head(9).to_string(index=False))
    print("[step10] Bootstrap summary:")
    print(json.dumps(boot, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
