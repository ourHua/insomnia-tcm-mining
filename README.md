# Insomnia TCM Mining — Reproducible Experiment Package

[![CI: reproducibility](https://github.com/ourHua/insomnia-tcm-mining/actions/workflows/ci.yml/badge.svg)](https://github.com/ourHua/insomnia-tcm-mining/actions/workflows/ci.yml)
[![Reproducible](https://img.shields.io/badge/reproducible-make%20all-green.svg)](#one-command-reproduction)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.20267587.svg)](https://doi.org/10.5281/zenodo.20267587)
[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Data: CC--BY--4.0](https://img.shields.io/badge/data-CC--BY--4.0-orange.svg)](LICENSE)

This repository accompanies the manuscript

> *基于 Apriori 关联规则与复杂网络分析的失眠中医方剂配伍规律研究*
> *Association Rule Mining and Complex Network Analysis of Insomnia
>  Traditional Chinese Medicine Prescriptions*

and provides the complete analysis pipeline behind it. Eleven Python
scripts (`step1_…` through `step11_…`) take two de-identified CSV inputs
and regenerate **every numerical result, eight figures, and six tables**
cited in the manuscript, together with a self-auditing HTML
reproducibility report that asserts each headline number against the
manuscript.

A single command — `make all` — runs the entire pipeline end-to-end on
a clean machine.

---

## One-command reproduction

> ### ⚠️ Read this first — the `cd` step is mandatory
>
> `git clone` creates a sub-directory called `insomnia-tcm-mining/`
> in your current working directory. **Every subsequent command must be
> run from inside that sub-directory.** Forgetting to `cd` into it is
> the single most frequent cause of failure reported by first-time
> users, and it produces misleading errors such as
>
> - `ERROR: Could not open requirements file: 'requirements.txt'`
> - `make: *** No rule to make target 'all'.  Stop.`
>
> The pipeline itself is not broken in those cases; the commands are
> simply executing in the wrong folder. Always `cd insomnia-tcm-mining`
> before running anything else.

### Option A — pip + venv (Linux, macOS, WSL)

```bash
git clone https://github.com/ourHua/insomnia-tcm-mining.git
cd insomnia-tcm-mining                 # ← do not skip
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
make all
```

### Option B — conda (recommended on macOS and Windows)

The conda-forge channel ships pre-built binary wheels for
`python-igraph` and `leidenalg`, eliminating the C-compiler step that
sometimes trips up pip on macOS and Windows.

```bash
git clone https://github.com/ourHua/insomnia-tcm-mining.git
cd insomnia-tcm-mining                 # ← do not skip
conda env create -f environment.yml
conda activate insomnia-tcm
make all
```

### Wall-clock budget

| Command | Bootstrap iterations | Typical runtime (x86_64) |
| :------ | :------------------- | :----------------------- |
| `make all`           | B = 200  (default)  | 5 – 8 minutes  |
| `make bootstrap1000` | B = 1000 (manuscript) | 25 – 35 minutes |

### What success looks like

When the pipeline finishes, `step11` prints the verdict to the terminal
and writes a one-page HTML report. The expected closing lines are:

```
[step11] Overall: PASS
  [OK ] n_records_raw: expected=14178  actual=14178
  [OK ] n_prescriptions: expected=986  actual=986
  [OK ] n_herb_entities_after_normalization: expected=317  actual=317
  [OK ] herb_per_rx_mean: expected=14.35  actual=14.35
  …  (16 / 16 checks)
[step11] HTML report -> outputs/reproducibility_report.html

===============================================================
  Pipeline finished. See outputs/reproducibility_report.html
===============================================================
```

Open `outputs/reproducibility_report.html` in any browser to see the
human-readable report with **ALL CHECKS PASSED** at the top.

---

## Verified reproductions

The pipeline has been independently re-executed from a clean checkout
on the following platforms. Each entry reports 16 / 16 PASS in
`outputs/reproducibility_report.html`.

| Platform | Python | Install path | Result |
| :------- | :----- | :----------- | :----- |
| macOS x86_64                | 3.11 | pip + venv | 16 / 16 PASS |
| Ubuntu 24.04 x86_64         | 3.12 | pip        | 16 / 16 PASS |
| GitHub Actions (Ubuntu)     | 3.11 | pip        | 16 / 16 PASS (see CI badge) |

If you successfully reproduce on a platform not in this table, an
issue or pull request adding the row is welcome.

---

## Project layout

```
insomnia-tcm-mining/
├── data/
│   ├── anonymized_prescription_transactions.csv   # 14,178 × 2; prescription_id, herb
│   └── herb_normalization_map.csv                 # 24 × 2;     raw_name, canonical_name
├── scripts/                                       # 11 ordered analysis scripts + helpers
├── outputs/                                       # generated; safe to delete
│   ├── intermediates/                             # 13+ intermediate CSV / JSON
│   ├── tables/                                    # 6 manuscript tables (CSV)
│   ├── figures/                                   # 8 manuscript figures (PNG + PDF)
│   └── reproducibility_report.html                # auto-generated audit page
├── .github/workflows/ci.yml                       # CI that re-runs `make all` on every push
├── Makefile
├── requirements.txt
├── environment.yml
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CITATION.cff
├── README.md
└── LICENSE
```

The `outputs/` tree is regenerated from scratch by `make all`; deleting
it is safe and is in fact the recommended way to start a clean
re-verification (`make clean && make all`).

---

## Inputs — minimum-necessary data

The pipeline consumes only two files in `data/`:

- **`anonymized_prescription_transactions.csv`** — 14,178 rows × **2
  columns**: `prescription_id` (anonymous prescription identifier) and
  `herb` (raw Chinese herb expression). **No** patient name, national
  identification number, contact information, visit date, physician
  identity, or institution-internal record number is present in this
  file by design. Re-identification of any individual patient,
  physician, or institution from this file is not feasible.
- **`herb_normalization_map.csv`** — 24 ontology rules mapping
  processing-method variants and synonyms to canonical pharmacopoeia
  names (e.g., `炒酸枣仁 → 酸枣仁`, `生龙骨 → 龙骨`).

These are the only two artefacts the pipeline reads from disk; every
other file under `outputs/` is generated.

---

## What the eleven scripts do

| Step | Script | Outputs |
| :--- | :----- | :------ |
| 1  | `step1_data_audit.py`              | `audit_report.json` (shape, nulls, duplicates) |
| 2  | `step2_normalization.py`           | `cleaned_prescriptions.csv` + `normalization_summary.json` |
| 3  | `step3_frequency_analysis.py`      | `herb_frequency.csv`, Table 2, Figure 2 |
| 4  | `step4_transaction_matrix.py`      | `transaction_matrix.csv` (986 × 317) |
| 5  | `step5_apriori_analysis.py`        | `apriori_rules_binary.csv`, Table 3, Figure 3 |
| 6  | `step6_network_construction.py`    | `network_edges.csv`, `network_nodes.csv`, Figure 4 |
| 7  | `step7_centrality_analysis.py`     | `centrality_results.csv`, Table 4, Figure 5 |
| 8  | `step8_community_detection.py`     | `community_detection_results.csv`, Table 5, Figure 8 |
| 9  | `step9_lift_heatmap.py`            | `lift_matrix.csv`, Figure 6 |
| 10 | `step10_sensitivity_analysis.py`   | `sensitivity_analysis_results.csv`, Table 6, Figure 7 |
| 11 | `step11_reproducibility_report.py` | `reproducibility_report.html` + assertion JSON |

Two helper modules (`scripts/_plot_setup.py`, `scripts/herb_i18n.py`)
provide shared figure styling and the Chinese-to-Pinyin / Latin
pharmacognostic naming map used in English-labelled figures.

Individual steps can be re-executed via `make stepN` (e.g.
`make step5`); see the `Makefile` for the dependency graph.

---

## Algorithm parameters at a glance

- **Apriori** baseline: `min_support = 0.20`, `min_confidence = 0.60`,
  `lift > 1.0`, `max_len = 4`.
- **Co-occurrence network**: 317 nodes, 11,239 edges; edge weight =
  number of prescriptions in which the pair co-appears; Lift attached
  to every edge as a secondary attribute.
- **Community detection**: Louvain (`python-louvain`, weighted,
  `random_state = 42`), Greedy Modularity (`networkx`), Leiden
  (`leidenalg`, CPM, `resolution_parameter = 1.0`, `seed = 42`). All
  three independently recover 4 functional modules with modularity
  Q ≈ 0.04.
- **Sensitivity grid**: 3 × 3 × 3 = 27 parameter points (support ∈
  {0.15, 0.20, 0.25}, confidence ∈ {0.5, 0.6, 0.7}, lift ∈
  {1.0, 1.2, 1.4}).
- **Bootstrap robustness**: B = 200 by default (configurable via
  `--bootstrap`), 80 % prescription resampling without replacement,
  fixed RNG seed 42.

The four flagship strong herb pairs (Lift ≥ 1.40) — 合欢皮–牡蛎,
龙骨–牡蛎, 白术–茯苓, 合欢皮–龙骨 — persist in **27 / 27** sensitivity
grid points and in **100 %** of bootstrap re-samples.

---

## Re-running with different parameters

```bash
# Full bootstrap (manuscript setting, slower)
make bootstrap1000

# Single step only (e.g. re-do Apriori after changing min_support)
make step5

# Clean rebuild from scratch
make clean && make all
```

Any change to a hard-coded headline number in `step11` should be
recorded in `CHANGELOG.md`; see `CONTRIBUTING.md` for the policy.

---

## Troubleshooting

These are the failure modes most frequently reported by users
attempting to reproduce the pipeline on a fresh machine. Each one has
a one-line fix.

| Symptom | Root cause | Fix |
| :------ | :--------- | :-- |
| `ERROR: Could not open requirements file: 'requirements.txt'` | You are not inside the project directory. | `cd insomnia-tcm-mining` before running `pip install`. |
| `make: *** No rule to make target 'all'.` | Same as above — `make` cannot find the `Makefile`. | `cd insomnia-tcm-mining` first. |
| `make: command not found` (Windows) | `make` is a Unix tool, not bundled with Windows. | `conda install -c conda-forge make`, or run the eleven `python scripts/stepN_*.py` commands manually in order. |
| `error: externally-managed-environment` (Debian / Ubuntu ≥ 23) | PEP 668 blocks `pip` from writing to system Python. | Always use a venv (`python3 -m venv .venv && source .venv/bin/activate`). Do not use `--break-system-packages` for a real reproduction run. |
| `ERROR: Failed building wheel for leidenalg` (or `python-igraph`) | No C compiler available, and no pre-built wheel for your platform. | Switch to Option B (conda). The conda-forge channel ships pre-compiled binaries. |
| `parquet skipped: Unable to find a usable engine` (during step 4) | Optional `pyarrow` is not installed. | **Safe to ignore** — informational, not an error. CSV outputs are written normally and every downstream step still passes. To silence, `pip install pyarrow`. |
| `UnicodeDecodeError` reading CSVs (Windows CP936 terminal) | OS default encoding is not UTF-8. | Run `chcp 65001` before `make all`, or use the conda environment (which sets `PYTHONUTF8=1`). |
| `(.venv) (base)` appears in your prompt and `python` resolves to the wrong interpreter | A conda `base` environment was auto-activated and is shadowing your venv. | `conda deactivate` once, then `source .venv/bin/activate` again. |

If `step11` reports any `[FAIL]` line, please open an issue and
include:

1. The full terminal output of `make all`.
2. The contents of `outputs/reproducibility_report.html`.
3. The output of `python3 --version` and `pip freeze`.
4. Your OS, architecture, and install path (pip / conda).

---

## Filename note

The file `anonymized_prescription_transactions.csv` was previously
named `simulated_prescriptions.csv` in earlier internal iterations.
The token "simulated" referred only to the internal experimental
management naming convention; the data are **not** computer-generated.
The current filename better reflects the dataset's actual nature: a
de-identified, two-field transactional dataset.

---

## Citation

If you use this code or data in academic work, please cite both the
manuscript and this software archive. The `CITATION.cff` file in the
project root provides the canonical citation block; GitHub renders an
APA / BibTeX preview from it via the "Cite this repository" button in
the sidebar.

A permanent code archive is deposited on Zenodo:

> DOI **[10.5281/zenodo.20267587](https://doi.org/10.5281/zenodo.20267587)**

---

## Contributing

Issues, pull requests, and methodological discussions are welcome.
See `CONTRIBUTING.md` for the pull-request checklist and the policy on
changes that affect any headline number — in short, any PR that
intentionally alters a headline assertion must update
`step11_reproducibility_report.py` and `CHANGELOG.md` in the same
commit, and must keep the CI green.

---

## License

- **Code** — MIT
- **Data, tables, and figures** — CC-BY 4.0

See `LICENSE` for the full text of both licenses.
