#!/usr/bin/env python3
"""step6_network_construction.py — Build weighted herb co-occurrence network.

For every prescription, all C(k,2) intra-prescription pairs contribute weight 1
to the corresponding edge. The Lift attribute is also attached to every edge
for downstream Lift-weighted filtering.

Inputs : outputs/intermediates/cleaned_prescriptions.csv
         outputs/intermediates/herb_frequency.csv
Outputs: outputs/intermediates/network_edges.csv
         outputs/intermediates/network_nodes.csv
         outputs/intermediates/network_summary.json
         outputs/figures/figure4_core_network.png / .pdf
"""
from __future__ import annotations

import itertools
import json
from collections import Counter
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import networkx as nx
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
INT_DIR = ROOT / "outputs" / "intermediates"
FIG_DIR = ROOT / "outputs" / "figures"
INT_DIR.mkdir(parents=True, exist_ok=True)
FIG_DIR.mkdir(parents=True, exist_ok=True)

from _plot_setup import configure_cjk_font
CJK_FONT = configure_cjk_font()


def main() -> None:
    df = pd.read_csv(INT_DIR / "cleaned_prescriptions.csv")
    n_rx = df["prescription_id"].nunique()
    freq = pd.read_csv(INT_DIR / "herb_frequency.csv")
    freq_map = dict(zip(freq["herb"], freq["frequency"]))

    pair_counter: Counter = Counter()
    for _, grp in df.groupby("prescription_id"):
        herbs = sorted(grp["herb"].unique())
        for a, b in itertools.combinations(herbs, 2):
            pair_counter[(a, b)] += 1

    edges = []
    for (a, b), w in pair_counter.items():
        sa, sb = freq_map[a], freq_map[b]
        # P(a)=sa/n_rx, P(b)=sb/n_rx, P(a,b)=w/n_rx
        # Lift = (w/n_rx) / ((sa/n_rx)*(sb/n_rx)) = w*n_rx / (sa*sb)
        lift = (w * n_rx) / (sa * sb)
        edges.append((a, b, w, round(lift, 4)))
    edges_df = pd.DataFrame(edges, columns=["source", "target", "weight", "lift"])
    edges_df.to_csv(INT_DIR / "network_edges.csv", index=False)

    G = nx.Graph()
    for h, f in freq_map.items():
        G.add_node(h, freq=int(f))
    for _, r in edges_df.iterrows():
        G.add_edge(r["source"], r["target"], weight=r["weight"], lift=r["lift"])

    nodes_df = pd.DataFrame({
        "herb": list(G.nodes()),
        "freq": [G.nodes[n]["freq"] for n in G.nodes()],
        "degree": [G.degree(n) for n in G.nodes()],
        "weighted_degree": [sum(d["weight"] for _, _, d in G.edges(n, data=True)) for n in G.nodes()],
    })
    nodes_df = nodes_df.sort_values("freq", ascending=False).reset_index(drop=True)
    nodes_df.to_csv(INT_DIR / "network_nodes.csv", index=False)

    summary = {
        "n_nodes": G.number_of_nodes(),
        "n_edges": G.number_of_edges(),
        "avg_degree": round(sum(dict(G.degree()).values()) / G.number_of_nodes(), 4),
        "avg_clustering": round(nx.average_clustering(G), 4),
        "density": round(nx.density(G), 4),
        "diameter": int(nx.diameter(G)) if nx.is_connected(G) else None,
        "is_connected": bool(nx.is_connected(G)),
    }
    (INT_DIR / "network_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2)
    )

    # Figure 4 — Top 30 core subnetwork, Lift >= 1.05 edges only
    top30 = nodes_df.head(30)["herb"].tolist()
    H = G.subgraph(top30).copy()
    H_filtered = nx.Graph()
    H_filtered.add_nodes_from(H.nodes(data=True))
    for u, v, d in H.edges(data=True):
        if d["lift"] >= 1.05:
            H_filtered.add_edge(u, v, **d)

    pos = nx.spring_layout(H_filtered, seed=42, k=0.9)
    fig, ax = plt.subplots(figsize=(10, 8), dpi=160)
    sizes = [G.nodes[n]["freq"] * 1.6 for n in H_filtered.nodes()]
    edge_w = [H_filtered[u][v]["weight"] * 0.025 for u, v in H_filtered.edges()]
    nx.draw_networkx_edges(H_filtered, pos, width=edge_w, alpha=0.45, edge_color="#888")
    nx.draw_networkx_nodes(H_filtered, pos, node_size=sizes, node_color="#4f8fc0",
                            edgecolors="black", linewidths=0.6, alpha=0.9)
    nx.draw_networkx_labels(H_filtered, pos, font_size=10, font_family=CJK_FONT)
    plt.title("Figure 4. Core co-occurrence network (Top 30 herbs, Lift ≥ 1.05)", fontsize=12)
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "figure4_core_network.png", dpi=300, bbox_inches="tight")
    plt.savefig(FIG_DIR / "figure4_core_network.pdf", bbox_inches="tight")
    plt.close()

    print(f"[step6] network_edges.csv  -> {INT_DIR / 'network_edges.csv'}  ({len(edges_df)} edges)")
    print(f"[step6] network_nodes.csv  -> {INT_DIR / 'network_nodes.csv'}  ({len(nodes_df)} nodes)")
    print(f"[step6] network_summary    -> {summary}")


if __name__ == "__main__":
    main()
