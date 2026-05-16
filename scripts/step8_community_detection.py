#!/usr/bin/env python3
"""step8_community_detection.py — Louvain / Greedy Modularity / Leiden + ARI/NMI.

Inputs : outputs/intermediates/network_edges.csv
         outputs/intermediates/network_nodes.csv
Outputs: outputs/intermediates/community_detection_results.csv
         outputs/intermediates/community_summary.json
         outputs/tables/table5_louvain_communities.csv
         outputs/figures/figure8_community_consistency.png / .pdf
"""
from __future__ import annotations

import json
from pathlib import Path

import community as community_louvain
import igraph as ig
import leidenalg
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import networkx as nx
import pandas as pd
from networkx.algorithms.community import greedy_modularity_communities, modularity
from sklearn.metrics import adjusted_rand_score, normalized_mutual_info_score

ROOT = Path(__file__).resolve().parents[1]
INT_DIR = ROOT / "outputs" / "intermediates"
TBL_DIR = ROOT / "outputs" / "tables"
FIG_DIR = ROOT / "outputs" / "figures"
for d in (TBL_DIR, FIG_DIR):
    d.mkdir(parents=True, exist_ok=True)

from _plot_setup import configure_cjk_font
configure_cjk_font()

SEED = 42


def _greedy_labels(G):
    comms = greedy_modularity_communities(G, weight="weight")
    label = {}
    for ci, c in enumerate(comms):
        for n in c:
            label[n] = ci
    return label


def _leiden_labels(G):
    nodes = list(G.nodes())
    idx = {n: i for i, n in enumerate(nodes)}
    edges = [(idx[u], idx[v]) for u, v in G.edges()]
    weights = [G[u][v].get("weight", 1) for u, v in G.edges()]
    ig_g = ig.Graph(n=len(nodes), edges=edges, directed=False)
    ig_g.es["weight"] = weights
    part = leidenalg.find_partition(
        ig_g, leidenalg.RBConfigurationVertexPartition,
        weights="weight", seed=SEED, resolution_parameter=1.0,
    )
    return {nodes[i]: c for i, c in enumerate(part.membership)}


def main() -> None:
    edges = pd.read_csv(INT_DIR / "network_edges.csv")
    nodes = pd.read_csv(INT_DIR / "network_nodes.csv")

    G = nx.Graph()
    for _, r in nodes.iterrows():
        G.add_node(r["herb"], freq=int(r["freq"]))
    for _, r in edges.iterrows():
        G.add_edge(r["source"], r["target"], weight=int(r["weight"]))

    louvain = community_louvain.best_partition(G, weight="weight", random_state=SEED)
    greedy = _greedy_labels(G)
    leiden = _leiden_labels(G)

    def _Q(part):
        comms = {}
        for n, c in part.items():
            comms.setdefault(c, set()).add(n)
        return modularity(G, comms.values(), weight="weight")

    Q_lou = _Q(louvain)
    Q_grd = _Q(greedy)
    Q_lei = _Q(leiden)

    df_out = pd.DataFrame({
        "herb": list(G.nodes()),
        "frequency": [G.nodes[n]["freq"] for n in G.nodes()],
        "louvain": [louvain[n] for n in G.nodes()],
        "greedy":  [greedy[n] for n in G.nodes()],
        "leiden":  [leiden[n] for n in G.nodes()],
    }).sort_values("frequency", ascending=False).reset_index(drop=True)
    df_out.to_csv(INT_DIR / "community_detection_results.csv", index=False)

    # Top members per Louvain community (Table 5)
    rows = []
    for c in sorted(set(louvain.values())):
        members = df_out[df_out["louvain"] == c].sort_values("frequency", ascending=False)
        top = members.head(10)["herb"].tolist()
        rows.append({
            "module": f"M{c}",
            "size": int(len(members)),
            "top_members_by_freq": " / ".join(top),
        })
    tbl5 = pd.DataFrame(rows).sort_values("size", ascending=False).reset_index(drop=True)
    tbl5.to_csv(TBL_DIR / "table5_louvain_communities.csv", index=False)

    # ARI / NMI 三两两一致性
    nodes_order = list(G.nodes())
    a = [louvain[n] for n in nodes_order]
    b = [greedy[n] for n in nodes_order]
    c = [leiden[n] for n in nodes_order]
    pairs = {
        "Louvain_vs_Greedy": (a, b),
        "Louvain_vs_Leiden": (a, c),
        "Greedy_vs_Leiden":  (b, c),
    }
    cons = {k: {"ARI": round(adjusted_rand_score(x, y), 4),
                "NMI": round(normalized_mutual_info_score(x, y), 4)}
            for k, (x, y) in pairs.items()}

    summary = {
        "n_communities": {
            "louvain": len(set(louvain.values())),
            "greedy":  len(set(greedy.values())),
            "leiden":  len(set(leiden.values())),
        },
        "modularity_Q": {
            "louvain": round(Q_lou, 4),
            "greedy":  round(Q_grd, 4),
            "leiden":  round(Q_lei, 4),
        },
        "consistency": cons,
    }
    (INT_DIR / "community_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2)
    )

    # Figure 8 — ARI / NMI bar
    pair_names = list(pairs.keys())
    ari_vals = [cons[k]["ARI"] for k in pair_names]
    nmi_vals = [cons[k]["NMI"] for k in pair_names]
    fig, ax = plt.subplots(figsize=(8, 4.6), dpi=160)
    x = range(len(pair_names))
    w = 0.36
    ax.bar([i - w/2 for i in x], ari_vals, width=w, label="ARI", color="#4f8fc0", edgecolor="black", linewidth=0.4)
    ax.bar([i + w/2 for i in x], nmi_vals, width=w, label="NMI", color="#e07b5b", edgecolor="black", linewidth=0.4)
    ax.set_xticks(list(x))
    ax.set_xticklabels(pair_names)
    ax.set_ylim(0, 1.05)
    ax.set_ylabel("Agreement score")
    ax.set_title("Figure 8. Community detection consistency (ARI & NMI)", fontsize=12)
    for i, (a_, n_) in enumerate(zip(ari_vals, nmi_vals)):
        ax.text(i - w/2, a_ + 0.02, f"{a_:.2f}", ha="center", fontsize=9)
        ax.text(i + w/2, n_ + 0.02, f"{n_:.2f}", ha="center", fontsize=9)
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    plt.savefig(FIG_DIR / "figure8_community_consistency.png", dpi=300, bbox_inches="tight")
    plt.savefig(FIG_DIR / "figure8_community_consistency.pdf", bbox_inches="tight")
    plt.close()

    print(f"[step8] community_summary: {json.dumps(summary, ensure_ascii=False)}")
    print(f"[step8] community_detection_results.csv -> {INT_DIR}")
    print(f"[step8] table5_louvain_communities.csv  -> {TBL_DIR}")
    print(f"[step8] figure8_community_consistency   -> {FIG_DIR}")


if __name__ == "__main__":
    main()
