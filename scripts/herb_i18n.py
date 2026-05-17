"""herb_i18n.py — Chinese herb names → Pinyin and Latin pharmacognostic names.

The pipeline data files keep their original Chinese herb names (the raw
clinical reality). For SCI-style figures we transliterate the Chinese
into Pinyin; for the manuscript text we additionally provide the
standardised Latin pharmacognostic name on first mention. Centralising
the mapping in one module guarantees that every figure, table and
caption uses identical romanisation.

Usage:
    from herb_i18n import pinyin, latin
    pinyin("酸枣仁")  -> "Suan Zao Ren"
    latin("酸枣仁")   -> "Ziziphi Spinosae Semen"
"""
from __future__ import annotations

PINYIN: dict[str, str] = {
    "甘草": "Gan Cao",
    "酸枣仁": "Suan Zao Ren",
    "合欢皮": "He Huan Pi",
    "首乌藤": "Shou Wu Teng",
    "茯神": "Fu Shen",
    "远志": "Yuan Zhi",
    "五味子": "Wu Wei Zi",
    "龙骨": "Long Gu",
    "牡蛎": "Mu Li",
    "茯苓": "Fu Ling",
    "当归": "Dang Gui",
    "白芍": "Bai Shao",
    "柏子仁": "Bai Zi Ren",
    "白术": "Bai Zhu",
    "石菖蒲": "Shi Chang Pu",
    "龙眼肉": "Long Yan Rou",
    "黄芪": "Huang Qi",
    "党参": "Dang Shen",
    "大枣": "Da Zao",
    "木香": "Mu Xiang",
    "人参": "Ren Shen",
    "陈皮": "Chen Pi",
    "生地黄": "Sheng Di Huang",
    "黄柏": "Huang Bai",
    "麦冬": "Mai Dong",
    "北沙参": "Bei Sha Shen",
    "川芎": "Chuan Xiong",
    "半夏": "Ban Xia",
    "竹茹": "Zhu Ru",
    "牡丹皮": "Mu Dan Pi",
    "女贞子": "Nv Zhen Zi",
    "栀子": "Zhi Zi",
    "黄连": "Huang Lian",
    "枳实": "Zhi Shi",
    "厚朴": "Hou Po",
    "黄芩": "Huang Qin",
    "柴胡": "Chai Hu",
    "知母": "Zhi Mu",
    "玉竹": "Yu Zhu",
    "山茱萸": "Shan Zhu Yu",
    "阿胶": "E Jiao",
}

LATIN: dict[str, str] = {
    "甘草": "Glycyrrhizae Radix et Rhizoma",
    "酸枣仁": "Ziziphi Spinosae Semen",
    "合欢皮": "Albiziae Cortex",
    "首乌藤": "Polygoni Multiflori Caulis",
    "茯神": "Poria cum Radice Pini",
    "远志": "Polygalae Radix",
    "五味子": "Schisandrae Chinensis Fructus",
    "龙骨": "Os Draconis",
    "牡蛎": "Ostreae Concha",
    "茯苓": "Poria",
    "当归": "Angelicae Sinensis Radix",
    "白芍": "Paeoniae Radix Alba",
    "柏子仁": "Platycladi Semen",
    "白术": "Atractylodis Macrocephalae Rhizoma",
    "石菖蒲": "Acori Tatarinowii Rhizoma",
    "龙眼肉": "Longan Arillus",
    "黄芪": "Astragali Radix",
    "党参": "Codonopsis Radix",
    "大枣": "Jujubae Fructus",
    "木香": "Aucklandiae Radix",
    "人参": "Ginseng Radix et Rhizoma",
    "陈皮": "Citri Reticulatae Pericarpium",
    "生地黄": "Rehmanniae Radix",
    "黄柏": "Phellodendri Chinensis Cortex",
    "麦冬": "Ophiopogonis Radix",
    "北沙参": "Glehniae Radix",
    "川芎": "Chuanxiong Rhizoma",
    "半夏": "Pinelliae Rhizoma",
    "竹茹": "Bambusae Caulis in Taenias",
    "牡丹皮": "Moutan Cortex",
    "女贞子": "Ligustri Lucidi Fructus",
    "栀子": "Gardeniae Fructus",
    "黄连": "Coptidis Rhizoma",
    "枳实": "Aurantii Fructus Immaturus",
    "厚朴": "Magnoliae Officinalis Cortex",
    "黄芩": "Scutellariae Radix",
    "柴胡": "Bupleuri Radix",
    "知母": "Anemarrhenae Rhizoma",
    "玉竹": "Polygonati Odorati Rhizoma",
    "山茱萸": "Corni Fructus",
    "阿胶": "Asini Corii Colla",
}


def pinyin(name: str) -> str:
    """Return the Pinyin transliteration; falls back to the original string."""
    return PINYIN.get(name, name)


def latin(name: str) -> str:
    """Return the Latin pharmacognostic name; falls back to the original string."""
    return LATIN.get(name, name)


def pinyin_list(names) -> list[str]:
    """Convenience: transliterate an iterable of Chinese names."""
    return [pinyin(n) for n in names]
