"""_plot_setup.py — Force matplotlib to use a CJK-capable font.

The system bundles `fonts-noto-cjk` but TTC subfaces are not autodiscovered
by matplotlib. This helper explicitly registers every Noto CJK TTC found,
then picks the first family present in the runtime font list so that
Chinese herb labels render correctly in figures.

Import as the first matplotlib-related statement in every plotting script:

    import matplotlib
    matplotlib.use("Agg")
    from _plot_setup import configure_cjk_font
    configure_cjk_font()
"""
from __future__ import annotations

import glob
import os

import matplotlib
import matplotlib.font_manager as fm


def configure_cjk_font() -> str:
    candidates_dir = (
        "/usr/share/fonts/opentype/noto",
        "/usr/share/fonts/truetype/noto",
    )
    for d in candidates_dir:
        if not os.path.isdir(d):
            continue
        for path in glob.glob(os.path.join(d, "NotoSansCJK*.ttc")) + \
                    glob.glob(os.path.join(d, "NotoSerifCJK*.ttc")) + \
                    glob.glob(os.path.join(d, "*.ttf")):
            try:
                fm.fontManager.addfont(path)
            except Exception:
                pass

    available = {f.name for f in fm.fontManager.ttflist}
    preferred = [
        "Noto Sans CJK SC",
        "Noto Sans CJK JP",
        "Noto Sans CJK TC",
        "Noto Sans CJK KR",
        "Noto Serif CJK SC",
        "WenQuanYi Zen Hei",
        "Microsoft YaHei",
        "SimHei",
    ]
    chosen = next((f for f in preferred if f in available), "DejaVu Sans")
    matplotlib.rcParams["font.family"] = chosen
    matplotlib.rcParams["axes.unicode_minus"] = False
    return chosen
