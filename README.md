# Insomnia TCM Mining — Reproducible Experiment Package

[![CI: reproducibility](https://github.com/lijunhua/insomnia-tcm-mining/actions/workflows/ci.yml/badge.svg)](https://github.com/lijunhua/insomnia-tcm-mining/actions/workflows/ci.yml)
[![Reproducible](https://img.shields.io/badge/reproducible-make%20all-green.svg)](#tldr--one-command-reproduction)
[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Data: CC--BY--4.0](https://img.shields.io/badge/data-CC--BY--4.0-orange.svg)](LICENSE)

This repository holds the analysis pipeline behind the manuscript:

> *基于 Apriori 关联规则与复杂网络分析的失眠中医方剂配伍规律研究*
> (Association Rule Mining and Complex Network Analysis of Insomnia
>  Traditional Chinese Medicine Prescriptions)

Eleven Python scripts (`step1_...` to `step11_...`) transform the two
de-identified input CSVs into all numerical results, eight figures and
eight tables referenced in the manuscript, and produce a one-page
HTML reproducibility report that asserts every headline number.

## TL;DR — one-command reproduction

```bash
git clone <repo-url> && cd insomnia-tcm-mining

# Option A: pip
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
make all

# Option B: conda
conda env create -f environment.yml
conda activate insomnia-tcm
make all
```

Wall-clock time on a modest Linux x86_64 machine: ≈ 5–8 minutes for
`make all` (B = 200 bootstrap), or ≈ 25–35 minutes for the full
`make bootstrap1000` run used in the manuscript.

After `make all` the file `outputs/reproducibility_report.html` will
state **ALL CHECKS PASSED**, with every headline number (14,178 →
14,150 records, 986 prescriptions, 317 herb entities, 14.35 ± 2.94
herbs/prescription, Top 10 frequencies, etc.) re-derived from the
data.

## Layout

```
insomnia-tcm-mining/
├── data/
│   ├── anonymized_prescription_transactions.csv   # 14,178 × 2; prescription_id, herb
│   └── herb_normalization_map.csv                  # 24 × 2;   raw_name, canonical_name
├── scripts/                                        # 11 ordered analysis scripts
├── outputs/                                        # generated; safe to delete
│   ├── intermediates/                              # 13+ intermediate CSV/JSON
│   ├── tables/                                     # 6 manuscript tables (CSV)
│   ├── figures/                                    # 8 manuscript figures (PNG + PDF)
│   └── reproducibility_report.html                 # auto-generated audit page
├── Makefile
├── requirements.txt
├── environment.yml
├── README.md
└── LICENSE
```

## Inputs — minimum-necessary data

The pipeline consumes only two files in `data/`:

* `anonymized_prescription_transactions.csv` — 14,178 rows × **2 columns**:
  `prescription_id` (anonymous prescription id) and `herb` (raw Chinese herb
  expression). **No** patient name, identification number, contact info, visit
  date, physician identity, or institution-internal record number is present
  in the file by design. Re-identification of any individual patient,
  physician, or institution from this file is not feasible.
* `herb_normalization_map.csv` — 24 ontology rules mapping processing-method
  variants and synonyms to canonical pharmacopoeia names.

## What the eleven scripts do

| Step | Script | What it produces |
| :--- | :----- | :--------------- |
| 1 | `step1_data_audit.py`            | `audit_report.json` (shape, nulls, duplicates) |
| 2 | `step2_normalization.py`         | `cleaned_prescriptions.csv` + `normalization_summary.json` |
| 3 | `step3_frequency_analysis.py`    | `herb_frequency.csv`, Table 2, Figure 2 |
| 4 | `step4_transaction_matrix.py`    | `transaction_matrix.csv` (986 × 317) |
| 5 | `step5_apriori_analysis.py`      | `apriori_rules_binary.csv`, Table 3, Figure 3 |
| 6 | `step6_network_construction.py`  | `network_edges.csv`, `network_nodes.csv`, Figure 4 |
| 7 | `step7_centrality_analysis.py`   | `centrality_results.csv`, Table 4, Figure 5 |
| 8 | `step8_community_detection.py`   | `community_detection_results.csv`, Table 5, Figure 8 |
| 9 | `step9_lift_heatmap.py`          | `lift_matrix.csv`, Figure 6 |
| 10 | `step10_sensitivity_analysis.py` | `sensitivity_analysis_results.csv`, Table 6, Figure 7 |
| 11 | `step11_reproducibility_report.py` | `reproducibility_report.html` + assertion JSON |

## Algorithm parameters at a glance

* **Apriori** baseline: `min_support = 0.20`, `min_confidence = 0.60`,
  `lift > 1.0`, `max_len = 4`.
* **Network**: 317 nodes, 11,239 edges; co-occurrence weight = number of
  prescriptions in which the pair co-appears; Lift attribute attached
  to every edge.
* **Community detection**: Louvain (`python-louvain`, `random_state = 42`,
  weighted), Greedy Modularity (`networkx`), Leiden (`leidenalg`, CPM,
  `resolution_parameter = 1.0`, `seed = 42`).
* **Sensitivity grid**: 3 × 3 × 3 = 27 parameter points.
* **Bootstrap**: B = 200 by default (configurable), 80% prescription
  re-sampling without replacement, fixed RNG seed 42.

## Filename note

The file `anonymized_prescription_transactions.csv` was previously named
`simulated_prescriptions.csv` in earlier internal iterations. The token
"simulated" referred only to the internal experimental management
naming convention; the data are **not** computer-generated. The current
filename better reflects the dataset's actual nature (a de-identified,
two-field transactional dataset).

## Citation

If you use this code or data in academic work, please cite this repository.
The `CITATION.cff` file in the project root provides the canonical
citation block; GitHub renders an APA/BibTeX preview from it via the
"Cite this repository" button in the sidebar.

A permanent Zenodo archive will be minted from the next tagged release;
the DOI will be added to this README and to `CITATION.cff` once it is
available.

## License

* **Code**: MIT
* **Data and tables**: CC-BY 4.0

See `LICENSE` for the full text of both licenses.
