#!/usr/bin/env python3
"""step11_reproducibility_report.py — Assert key numbers & render HTML report.

Asserts that the pipeline reproduces the headline values stated in the
manuscript. Writes a self-contained HTML report and a JSON of assertion
results.

Inputs : outputs/intermediates/*.json, *.csv (from prior steps)
Outputs: outputs/reproducibility_report.html
         outputs/intermediates/assertions_passed.json
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
INT_DIR = ROOT / "outputs" / "intermediates"
OUT = ROOT / "outputs"

EXPECTED = {
    "n_records_raw": 14178,
    "n_prescriptions": 986,
    "n_herb_expressions_raw": 326,
    "n_normalization_rules": 24,
    "n_records_normalized_by_map": 642,
    "pct_records_normalized": 4.5281,
    "n_records_removed_by_intra_rx_dedup": 28,
    "n_records_clean": 14150,
    "n_herb_entities_after_normalization": 317,
    "herb_per_rx_mean": 14.35,
    "herb_per_rx_std": 2.94,
    "herb_per_rx_median": 14,
    "herb_per_rx_min": 6,
    "herb_per_rx_max": 23,
    "top10": ["甘草", "酸枣仁", "合欢皮", "首乌藤", "茯神",
              "远志", "五味子", "龙骨", "牡蛎", "茯苓"],
    "top10_freq": [806, 766, 503, 501, 462, 461, 437, 429, 425, 422],
}


def _check(actual, expected, tol=0.0):
    if isinstance(expected, list):
        return list(actual) == list(expected)
    if isinstance(expected, float):
        return abs(float(actual) - float(expected)) <= tol
    return actual == expected


def main() -> None:
    norm = json.loads((INT_DIR / "normalization_summary.json").read_text())
    freq = pd.read_csv(INT_DIR / "herb_frequency.csv")
    top10_actual = freq.head(10)["herb"].tolist()
    top10_freq_actual = freq.head(10)["frequency"].tolist()

    assertions = []

    def add(name, actual, expected, tol=0.0):
        ok = _check(actual, expected, tol=tol)
        assertions.append({
            "check": name, "actual": actual, "expected": expected, "pass": bool(ok),
        })

    add("n_records_raw", norm["n_records_raw"], EXPECTED["n_records_raw"])
    add("n_prescriptions", norm["n_prescriptions"], EXPECTED["n_prescriptions"])
    add("n_herb_expressions_raw", norm["n_herb_expressions_raw"],
        EXPECTED["n_herb_expressions_raw"])
    add("n_normalization_rules", norm["n_normalization_rules"],
        EXPECTED["n_normalization_rules"])
    add("n_records_normalized_by_map", norm["n_records_normalized_by_map"],
        EXPECTED["n_records_normalized_by_map"])
    add("pct_records_normalized", norm["pct_records_normalized"],
        EXPECTED["pct_records_normalized"], tol=0.01)
    add("n_records_removed_by_intra_rx_dedup",
        norm["n_records_removed_by_intra_rx_dedup"],
        EXPECTED["n_records_removed_by_intra_rx_dedup"])
    add("n_records_clean", norm["n_records_clean"], EXPECTED["n_records_clean"])
    add("n_herb_entities_after_normalization",
        norm["n_herb_entities_after_normalization"],
        EXPECTED["n_herb_entities_after_normalization"])

    hpr = norm["herb_per_prescription_after_clean"]
    add("herb_per_rx_mean", round(hpr["mean"], 2), EXPECTED["herb_per_rx_mean"], tol=0.01)
    add("herb_per_rx_std",  round(hpr["std"], 2),  EXPECTED["herb_per_rx_std"],  tol=0.01)
    add("herb_per_rx_median", hpr["median"], EXPECTED["herb_per_rx_median"])
    add("herb_per_rx_min", hpr["min"], EXPECTED["herb_per_rx_min"])
    add("herb_per_rx_max", hpr["max"], EXPECTED["herb_per_rx_max"])
    add("top10_membership", top10_actual, EXPECTED["top10"])
    add("top10_frequencies", top10_freq_actual, EXPECTED["top10_freq"])

    all_pass = all(a["pass"] for a in assertions)
    (INT_DIR / "assertions_passed.json").write_text(json.dumps(
        {"all_pass": all_pass, "checks": assertions},
        ensure_ascii=False, indent=2,
    ))

    # Render minimal self-contained HTML
    rows_html = "\n".join(
        f"<tr><td>{a['check']}</td><td>{a['expected']}</td>"
        f"<td>{a['actual']}</td>"
        f"<td style='color:{'green' if a['pass'] else 'red'}'>"
        f"{'PASS' if a['pass'] else 'FAIL'}</td></tr>"
        for a in assertions
    )
    html = f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>Reproducibility Report — Insomnia TCM Mining</title>
<style>
  body {{ font-family: Arial, sans-serif; max-width: 980px; margin: 40px auto; padding: 0 20px; color: #222; }}
  h1 {{ color: #2c3e50; }}
  h2 {{ color: #34495e; border-bottom: 1px solid #ddd; padding-bottom: 4px; }}
  table {{ border-collapse: collapse; width: 100%; margin: 12px 0; }}
  th, td {{ border: 1px solid #ccc; padding: 6px 10px; font-size: 13px; }}
  th {{ background: #f3f6fb; }}
  .ok {{ color: green; font-weight: bold; }}
  .fail {{ color: red; font-weight: bold; }}
  code {{ background: #f4f4f4; padding: 1px 4px; border-radius: 3px; }}
</style>
</head>
<body>
  <h1>Reproducibility Report</h1>
  <p><b>Project:</b> Insomnia TCM Prescription Mining (Apriori + Complex Network)</p>
  <p><b>Generated:</b> {dt.datetime.now().isoformat(timespec='seconds')}</p>
  <p><b>Overall:</b>
     <span class="{'ok' if all_pass else 'fail'}">
       {'ALL CHECKS PASSED' if all_pass else 'SOME CHECKS FAILED — investigate below'}
     </span>
  </p>

  <h2>Headline number assertions</h2>
  <table>
    <thead>
      <tr><th>Check</th><th>Expected</th><th>Actual</th><th>Status</th></tr>
    </thead>
    <tbody>
      {rows_html}
    </tbody>
  </table>

  <h2>Pipeline artifacts</h2>
  <ul>
    <li><code>outputs/intermediates/cleaned_prescriptions.csv</code></li>
    <li><code>outputs/intermediates/herb_frequency.csv</code></li>
    <li><code>outputs/intermediates/transaction_matrix.csv</code></li>
    <li><code>outputs/intermediates/apriori_rules_binary.csv</code></li>
    <li><code>outputs/intermediates/network_edges.csv</code></li>
    <li><code>outputs/intermediates/network_nodes.csv</code></li>
    <li><code>outputs/intermediates/centrality_results.csv</code></li>
    <li><code>outputs/intermediates/community_detection_results.csv</code></li>
    <li><code>outputs/intermediates/lift_matrix.csv</code></li>
    <li><code>outputs/intermediates/sensitivity_analysis_results.csv</code></li>
    <li><code>outputs/tables/*.csv</code></li>
    <li><code>outputs/figures/*.png|*.pdf</code></li>
  </ul>

  <p style="color:#999; font-size:12px; margin-top:32px;">
    This report is auto-generated by <code>step11_reproducibility_report.py</code>.
    It is intended to give reviewers a one-page verification that the pipeline
    actually produces the headline numbers reported in the manuscript.
  </p>
</body>
</html>"""

    (OUT / "reproducibility_report.html").write_text(html, encoding="utf-8")
    print(f"[step11] Overall: {'PASS' if all_pass else 'FAIL'}")
    for a in assertions:
        flag = "OK " if a["pass"] else "X  "
        print(f"  [{flag}] {a['check']}: expected={a['expected']}  actual={a['actual']}")
    print(f"[step11] HTML report -> {OUT / 'reproducibility_report.html'}")


if __name__ == "__main__":
    main()
