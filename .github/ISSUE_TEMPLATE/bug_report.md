---
name: Bug report
about: Report a defect or a reproducibility failure
title: "[bug] "
labels: bug
---

**What did you run?**
The exact command(s):

```
make all
```

**What happened?**
Paste the failing log or the first failing line of
`outputs/reproducibility_report.html` here.

**Environment**
- OS:
- Python version (`python3 --version`):
- Key library versions (`pip freeze | grep -Ei "mlxtend|networkx|pandas|leiden|louvain|igraph"`):

**Reproducibility report status**
- [ ] `outputs/reproducibility_report.html` reports ALL CHECKS PASSED
- [ ] Some checks failed (paste the failing rows)

**Additional context**
Anything else that may be relevant (custom dataset, modified script,
non-default parameters, etc.).
