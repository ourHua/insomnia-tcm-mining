#!/usr/bin/env python3
"""step7_centrality_analysis.py — Degree / Betweenness / Closeness centralities.

Inputs : outputs/intermediates/network_edges.csv
         outputs/intermediates/network_nodes.csv
Outputs: outputs/intermediates/centrality_results.csv
         outputs/tables/table4_centrality_top10.csv
         outputs/figures/figure5_centrality_top10.png / .pdf
"""
from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
INT_DIR = ROOT / "outputs" / "intermediates"
TBL_DIR = ROOT / "outputs" / "tables"
FIG_DIR = ROOT / "outputs" / "figures"
for d in (TBL_DIR, FIG_DIR):
    d.mkdir(parents=True, exist_ok=True)

from _plot_setup import configure_cjk_font
from herb_i18n import pinyin_list
configure_cjk_font()


def main() -> None:
    edges = pd.read_csv(INT_DIR / "network_edges.csv")
    nodes = pd.read_csv(INT_DIR / "network_nodes.csv")

    G = nx.Graph()
    for _, r in nodes.iterrows():
        G.add_node(r["herb"], freq=int(r["freq"]))
    for _, r in edges.iterrows():
        G.add_edge(r["source"], r["target"], weight=int(r["weight"]))

    dc = nx.degree_centrality(G)
    bc = nx.betweenness_centrality(G, normalized=True, weight=None)
    cc = nx.closeness_centrality(G)

    out = pd.DataFrame({
        "herb": list(G.nodes()),
        "frequency": [G.nodes[n]["freq"] for n in G.nodes()],
        "DC": [round(dc[n], 4) for n in G.nodes()],
        "BC": [round(bc[n], 4) for n in G.nodes()],
        "CC": [round(cc[n], 4) for n in G.nodes()],
    }).sort_values("DC", ascending=False).reset_index(drop=True)
    out.to_csv(INT_DIR / "centrality_results.csv", index=False)

    # Table 4 — Top 10 for each centrality
    dc_top = out.nlargest(10, "DC")[["herb", "DC"]].reset_index(drop=True)
    bc_top = out.nlargest(10, "BC")[["herb", "BC"]].reset_index(drop=True)
    cc_top = out.nlargest(10, "CC")[["herb", "CC"]].reset_index(drop=True)
    tbl4 = pd.DataFrame({
        "rank": range(1, 11),
        "DC_herb": dc_top["herb"], "DC_value": dc_top["DC"],
        "BC_herb": bc_top["herb"], "BC_value": bc_top["BC"],
        "CC_herb": cc_top["herb"], "CC_value": cc_top["CC"],
    })
    tbl4.to_csv(TBL_DIR / "table4_centrality_top10.csv", index=False)

    # Figure 5 — Grouped bar for Top 10 frequency herbs
    top10_freq = nodes.head(10)["herb"].tolist()
    sub = out[out["herb"].isin(top10_freq)].set_index("herb").reindex(top10_freq)
    bc_scaled = sub["BC"] * 30  # the paper text scales BC ×30 for visual parity

    x = np.arange(len(top10_freq))
    width = 0.26
    fig, ax = plt.subplots(figsize=(11, 5.2), dpi=160)
    ax.bar(x - width, sub["DC"], width, label="DC", color="#4f8fc0", edgecolor="black", linewidth=0.4)
    ax.bar(x,         bc_scaled, width, label="BC × 30", color="#e07b5b", edgecolor="black", linewidth=0.4)
    ax.bar(x + width, sub["CC"], width, label="CC", color="#7aae6b", edgecolor="black", linewidth=0.4)
    ax.set_xticks(x)
    ax.set_xticklabels(pinyin_list(top10_freq), rotation=30, ha="right", fontsize=10)
    ax.set_ylabel("Centrality value", fontsize=11)
    ax.set_title("Figure 5. Degree, betweenness and closeness centrality for the 10 most frequent herbs", fontsize=12)
    ax.legend(loc="upper right")
    ax.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    plt.savefig(FIG_DIR / "figure5_centrality_top10.png", dpi=300, bbox_inches="tight")
    plt.savefig(FIG_DIR / "figure5_centrality_top10.pdf", bbox_inches="tight")
    plt.close()

    print(f"[step7] centrality_results.csv -> {INT_DIR / 'centrality_results.csv'}")
    print(f"[step7] table4_centrality_top10.csv -> {TBL_DIR / 'table4_centrality_top10.csv'}")
    print("[step7] Top 10 DC:")
    print(dc_top.to_string(index=False))


if __name__ == "__main__":
    main()
