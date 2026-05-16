# Contributing

Thank you for your interest in this project. This repository accompanies a
peer-reviewed manuscript and is intended to support reproducibility,
methodological review and downstream re-use. Contributions of all sizes
are welcome — bug reports, documentation improvements, additional tests,
performance optimizations, and methodological extensions.

## Quick start

```bash
git clone https://github.com/<your-github-user>/insomnia-tcm-mining.git
cd insomnia-tcm-mining
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
make all
# open outputs/reproducibility_report.html and verify "ALL CHECKS PASSED"
```

## Reporting bugs

Open an issue using the **Bug report** template. Please include:

- The exact command you ran.
- The full traceback or assertion failure.
- The output of `python3 --version` and `pip freeze | grep -Ei "mlxtend|networkx|pandas|leiden|louvain"`.
- The first failing item in `outputs/reproducibility_report.html`, if any.

## Proposing a methodological change

Open an issue using the **Methodological discussion** template
*before* submitting a pull request. Changes that affect any
headline number reported in the manuscript require:

1. A clearly stated rationale and a literature reference.
2. A diff in `outputs/reproducibility_report.html`
   (the CI workflow will block any PR that breaks a headline assertion
   unless `step11_reproducibility_report.py` is also updated to reflect
   the intentional change).
3. A note in `CHANGELOG.md` under an `[Unreleased]` heading.

## Pull-request checklist

- [ ] `make all` runs end-to-end without errors on a clean checkout.
- [ ] `outputs/reproducibility_report.html` reports
      **ALL CHECKS PASSED** (or, if intentionally changed, the new
      expected values are committed alongside the PR with rationale).
- [ ] Any new dependency is added to *both* `requirements.txt` and
      `environment.yml`, with a pinned upper bound.
- [ ] Public functions, scripts and major commits use full English
      sentences in the description.
- [ ] If figures or tables are added, they are produced by a script
      under `scripts/` and not committed as static binaries unless
      strictly necessary.

## Style

- Python ≥ 3.11.
- One script per analysis step, kept under ~250 lines where possible.
- Docstrings in English; user-facing report text may be Chinese.
- No silent dependencies on environment state: every script must be
  runnable from a clean checkout via `make stepN`.

## License

By submitting a contribution you agree that your contribution will be
licensed under the same terms as the rest of the project (MIT for code,
CC BY 4.0 for data and figures).
