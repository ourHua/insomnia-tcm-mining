#!/usr/bin/env python3
"""step9_lift_heatmap.py — Top 15 pairwise Lift heatmap.

Inputs : outputs/intermediates/herb_frequency.csv
         outputs/intermediates/network_edges.csv
Outputs: outputs/intermediates/lift_matrix.csv
         outputs/figures/figure6_lift_heatmap.png / .pdf
"""
from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
INT_DIR = ROOT / "outputs" / "intermediates"
FIG_DIR = ROOT / "outputs" / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

from _plot_setup import configure_cjk_font
from herb_i18n import pinyin_list
configure_cjk_font()


def main() -> None:
    freq = pd.read_csv(INT_DIR / "herb_frequency.csv")
    edges = pd.read_csv(INT_DIR / "network_edges.csv")

    top15 = freq.head(15)["herb"].tolist()
    pos = {h: i for i, h in enumerate(top15)}
    M = np.full((15, 15), np.nan)

    for _, r in edges.iterrows():
        if r["source"] in pos and r["target"] in pos:
            i, j = pos[r["source"]], pos[r["target"]]
            M[i, j] = M[j, i] = r["lift"]

    df = pd.DataFrame(M, index=top15, columns=top15)
    df.to_csv(INT_DIR / "lift_matrix.csv")

    fig, ax = plt.subplots(figsize=(9, 8), dpi=160)
    masked = np.ma.masked_invalid(M)
    cmap = plt.get_cmap("RdBu_r").copy()
    cmap.set_bad(color="#eeeeee")
    im = ax.imshow(masked, cmap=cmap, vmin=0.6, vmax=2.1)
    plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04, label="Lift")
    ax.set_xticks(range(15))
    ax.set_yticks(range(15))
    ax.set_xticklabels(pinyin_list(top15), rotation=45, ha="right", fontsize=9)
    ax.set_yticklabels(pinyin_list(top15), fontsize=9)
    # annotate values & highlight Lift >= 1.40
    for i in range(15):
        for j in range(15):
            if np.isfinite(M[i, j]):
                txt = f"{M[i,j]:.2f}"
                ax.text(j, i, txt, ha="center", va="center",
                        color="black" if 0.9 < M[i,j] < 1.5 else "white",
                        fontsize=7)
                if M[i, j] >= 1.40 and i != j:
                    rect = mpatches.Rectangle((j-0.5, i-0.5), 1, 1,
                                              fill=False, edgecolor="black", linewidth=1.4)
                    ax.add_patch(rect)
    ax.set_title("Figure 6. Pairwise Lift heatmap for the 15 most frequent herbs (Lift ≥ 1.40 outlined)", fontsize=12)
    plt.tight_layout()
    plt.savefig(FIG_DIR / "figure6_lift_heatmap.png", dpi=300, bbox_inches="tight")
    plt.savefig(FIG_DIR / "figure6_lift_heatmap.pdf", bbox_inches="tight")
    plt.close()

    # Quick listing of strong pairs
    strong = []
    seen = set()
    for i, a in enumerate(top15):
        for j, b in enumerate(top15):
            if i < j and np.isfinite(M[i, j]) and M[i, j] >= 1.40:
                strong.append((a, b, round(float(M[i, j]), 2)))
    strong.sort(key=lambda x: -x[2])
    print("[step9] Strong pairs (Top 15, Lift >= 1.40):")
    for s in strong:
        print(f"    {s[0]} — {s[1]}: Lift = {s[2]}")
    print(f"[step9] lift_matrix.csv     -> {INT_DIR / 'lift_matrix.csv'}")
    print(f"[step9] figure6_lift_heatmap -> {FIG_DIR}")


if __name__ == "__main__":
    main()
