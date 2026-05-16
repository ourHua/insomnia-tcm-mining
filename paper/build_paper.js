/**
 * build_paper.js — Generates Insomnia_TCM_Mining_Manuscript_VersionA.docx
 *
 * Version A (most conservative ethics framing) of the manuscript.
 * Single section, A4-friendly width, MDPI Applied Sciences typography.
 *
 * Run:   node build_paper.js
 * Out:   paper/Insomnia_TCM_Mining_Manuscript_VersionA.docx
 */

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, AlignmentType, WidthType,
  BorderStyle, ShadingType, LevelFormat, ImageRun, PageBreak,
} = require("docx");

// ───────────────────────────── helpers ─────────────────────────────
const FONT = "Times New Roman";
const HFONT = "Arial";
const CN_FONT = "SimSun";  // fallback for Chinese on Windows; Word reflows
const PAGE_W = 11906;      // A4 in DXA
const PAGE_H = 16838;
const MARG = 1440;         // 1 inch
const CONTENT = PAGE_W - 2 * MARG; // 9026

const border = { style: BorderStyle.SINGLE, size: 4, color: "888888" };
const cellBorders = { top: border, bottom: border, left: border, right: border };

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 320, lineRule: "auto", ...(opts.spacing || {}) },
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        font: { name: FONT, eastAsia: CN_FONT },
        size: opts.size || 22,    // 11pt
        bold: opts.bold,
        italics: opts.italics,
      }),
    ],
  });
}

/** Paragraph supporting inline bold/italic via segments. */
function rp(segs, opts = {}) {
  const children = segs.map(s =>
    typeof s === "string"
      ? new TextRun({ text: s, font: { name: FONT, eastAsia: CN_FONT }, size: opts.size || 22 })
      : new TextRun({ text: s.t, font: { name: FONT, eastAsia: CN_FONT },
                      size: opts.size || 22, bold: s.b, italics: s.i }));
  return new Paragraph({
    spacing: { after: 120, line: 320, lineRule: "auto", ...(opts.spacing || {}) },
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    children,
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: { name: HFONT, eastAsia: CN_FONT }, size: 28, bold: true })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: { name: HFONT, eastAsia: CN_FONT }, size: 24, bold: true })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: { name: HFONT, eastAsia: CN_FONT }, size: 22, bold: true })],
  });
}

function caption(text) {
  return new Paragraph({
    spacing: { before: 120, after: 240 },
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text, font: { name: FONT, eastAsia: CN_FONT }, size: 20, bold: true })],
  });
}

/**
 * Build a uniform-style table from a header-row + body-rows array.
 * @param {string[][]} rows  first row is treated as header.
 * @param {number[]}  widths column widths in DXA (must sum to <= CONTENT).
 */
function tbl(rows, widths) {
  const header = rows[0];
  const body = rows.slice(1);
  const total = widths.reduce((a, b) => a + b, 0);
  const make = (cells, isHeader = false) =>
    new TableRow({
      tableHeader: isHeader,
      children: cells.map((txt, i) => new TableCell({
        borders: cellBorders,
        width: { size: widths[i], type: WidthType.DXA },
        shading: isHeader ? { fill: "D9E2EE", type: ShadingType.CLEAR } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 0 },
          children: [new TextRun({
            text: String(txt ?? ""),
            font: { name: FONT, eastAsia: CN_FONT },
            size: 20,
            bold: isHeader,
          })],
        })],
      })),
    });
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [make(header, true), ...body.map(r => make(r, false))],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80, line: 280 },
    children: [new TextRun({ text, font: { name: FONT, eastAsia: CN_FONT }, size: 22 })],
  });
}

function figurePlaceholder(figPath, caption_text) {
  let imgChildren;
  try {
    const buf = fs.readFileSync(figPath);
    imgChildren = [new ImageRun({
      data: buf,
      transformation: { width: 560, height: 340 },
      type: "png",
    })];
  } catch (e) {
    imgChildren = [new TextRun({
      text: `[Figure file missing: ${path.basename(figPath)}]`,
      italics: true, color: "888888", size: 20,
    })];
  }
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: imgChildren,
    }),
    caption(caption_text),
  ];
}

// ──────────────────────────── content ───────────────────────────────
const FIG = path.resolve(__dirname, "..", "outputs", "figures");
const CHILDREN = [];

// Title
CHILDREN.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 120 },
  children: [new TextRun({
    text: "基于 Apriori 关联规则与复杂网络分析的失眠中医方剂配伍规律研究",
    font: { name: HFONT, eastAsia: CN_FONT }, size: 32, bold: true,
  })],
}));
CHILDREN.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 240 },
  children: [new TextRun({
    text: "Association Rule Mining and Complex Network Analysis of " +
          "Insomnia Traditional Chinese Medicine Prescriptions",
    font: { name: HFONT, eastAsia: CN_FONT }, size: 24, italics: true,
  })],
}));

// Authors and affiliations placeholder
CHILDREN.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 80 },
  children: [new TextRun({
    text: "Junhua Li 1, Gilja So 1,*",
    font: { name: FONT }, size: 22,
  })],
}));
CHILDREN.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 240 },
  children: [new TextRun({
    text: "1  [Affiliation to be inserted]   *  Correspondence: [email]",
    font: { name: FONT }, size: 18, italics: true, color: "555555",
  })],
}));

// ───────────────── Abstract ─────────────────
CHILDREN.push(h2("Abstract"));
CHILDREN.push(rp([
  { t: "(1) Background: ", b: true },
  "失眠是一种全球疾病负担显著的慢性睡眠—觉醒障碍；认知行为疗法虽为一线推荐，但长期药物干预的循证证据有限，中医药因其多靶点、个体化优势已被纳入多国失眠诊疗指南。然而，中医处方数据具有高维、稀疏、同义异名泛滥的特征，单一数据挖掘方法难以同时刻画局部药对协同与全局拓扑结构。",
]));
CHILDREN.push(rp([
  { t: "(2) Methods: ", b: true },
  "本研究使用经人工溯源、脱敏整合并标准化处理的失眠中医处方事务数据集，共 14,178 条「处方—中药」原始记录、986 首独立处方、326 种原始中药表达。经基于 24 条本体规则的中药名称规范化（合并 642 条同义异名记录，占 4.53%）与处方内去重（移除 28 条冗余记录），形成包含 ",
  { t: "986 首处方、317 味独立中药实体、14,150 条用药记录", b: true },
  " 的算法输入；处方平均药物组成数为 ",
  { t: "14.35 ± 2.94 味", b: true },
  "（中位数 14，范围 6–23）。采用 Apriori 算法（min_support = 0.20，min_confidence = 0.60，Lift > 1.0）挖掘频繁项集与关联规则；基于共现矩阵构建加权无向网络（节点 317、边 11,239），计算度中心性、介数中心性与接近中心性；采用 Louvain、Greedy Modularity 与 Leiden 三种算法实施社区发现，并以 ARI / NMI 量化算法间一致性。在 3 × 3 × 3 = 27 点参数网格上完成敏感性分析，并通过 1000 次 Bootstrap 80% 重采样进行稳健性验证。",
]));
CHILDREN.push(rp([
  { t: "(3) Results: ", b: true },
  "高频药物前十位依次为甘草（806/81.74%）、酸枣仁（766/77.69%）、合欢皮（503）、首乌藤（501）、茯神（462）、远志（461）、五味子（437）、龙骨（429）、牡蛎（425）与茯苓（422），Top 10 中安神类占 6 席。Apriori 在三重约束下共提取出 ",
  { t: "34 条二项关联规则", b: true },
  "；最高 Lift 为「白术↔茯苓」（1.99）与「龙骨↔牡蛎」（1.84），「龙骨—牡蛎—合欢皮」构成两两 Lift ≥ 1.65 的重镇安神三联子图。共现网络呈现典型小世界特征（平均聚类系数 0.83，直径 3），三种社区算法均稳定识别出 4 个功能社区，模块度 Q ≈ 0.04，对应安神镇静、补气健脾、清热化痰与滋阴养血四组治法。27 点网格内 4 项标志性强协同药对在 27/27 参数组合中稳定出现；Bootstrap 验证显示 Top 10 隶属一致率 100%。",
]));
CHILDREN.push(rp([
  { t: "(4) Conclusions: ", b: true },
  "基于 Apriori 与复杂网络的双轨数据驱动框架可定量描述以「养心安神为主、补气健脾为辅」的失眠核心配伍特征，并识别出若干高提升度的强协同药对与功能性社区。全部数据文件与分析脚本已结构化整理为可由第三方独立复现的实验包；所识别的强协同模块的临床有效性仍需通过前瞻性随机对照试验进一步验证。",
]));

CHILDREN.push(rp([
  { t: "Keywords: ", b: true },
  "insomnia; Traditional Chinese Medicine formula; data mining; Apriori algorithm; association rules; complex network; Louvain community detection; reproducible research",
]));

CHILDREN.push(new Paragraph({ children: [new PageBreak()] }));

// ───────────────── 1. Introduction ─────────────────
CHILDREN.push(h1("1. 引言"));
CHILDREN.push(p("失眠是以入睡困难、睡眠维持障碍及主观睡眠质量低下为核心特征的慢性睡眠—觉醒节律紊乱性疾病。基于联合国人口数据的系统综述与流行病学建模显示，全球普通成年人群中具有临床意义的失眠患病率超过 10%，影响覆盖超过 8.5 亿成年人，且呈现明显的女性化与老龄化趋势 [1]。慢性失眠与认知功能下降、抑郁、焦虑、心血管事件及自杀意念等不良结局存在显著关联，已成为重要的公共卫生议题。"));
CHILDREN.push(p("现行国际诊疗指南将认知行为疗法（CBT-I）确立为慢性失眠的一线推荐方案 [2,3]。在药物干预层面，针对慢性失眠长期缓解率的网络荟萃分析提示，苯二氮䓬类与 Z 族药物虽起效迅速，但作为一线长期选项的循证强度有限 [4]；整合心理与药物治疗的网络荟萃分析得出相近结论 [5]。在此背景下，中医药因其多靶点协同、辨证个体化及不良反应谱较窄等特征受到广泛关注：最新发表的全球指南推荐图谱显示，中医药已被多个国家与地区的失眠诊疗指南纳入推荐范围 [6]；涵盖 109 项随机对照试验的网络荟萃分析提示多种中成药复方在改善 PSQI 与降低不良反应方面具有一定效应 [7]；针对酸枣仁汤的系统综述与荟萃分析 [8]、针对枣仁安神方等中成药的试验序贯分析 [32]、以及针对酸枣仁单味药改善睡眠质量的系统综述与荟萃分析 [33]，均提供了相对一致的循证支持。"));
CHILDREN.push(p("中医临床高度依赖辨证施治，处方数据呈现典型的非结构化、同义异名泛滥与高维稀疏特征，致使其潜在的「君臣佐使」配伍规律难以系统化提取与规模化复用 [9,10]。Apriori 关联规则算法 [11] 可在大规模稀疏事务矩阵中高效识别项集间的非线性共现关系，已被作为通用方法学范式广泛采用 [12]；基于图论的复杂网络分析则将处方系统抽象为拓扑图元，可从全局视角量化药物在网络中的中心性 [39]，并通过模块度优化算法实现功能模块的自动发现 [13,37]。"));
CHILDREN.push(p("既往针对失眠中医处方的数据挖掘研究多存在三点不足：（i）多数研究仅基于单一名医医案或单一文献库；（ii）多数研究仅采用单一的关联规则或聚类分析方法，缺乏对全局拓扑结构的系统刻画；（iii）多数研究未对算法超参数进行系统的敏感性分析，亦未提供完整的可复现性细节 [10]。"));
CHILDREN.push(p("针对上述不足，本研究的主要贡献包括：（i）以经过本体规范化的 986 首失眠中医处方为分析基础，构建包含 317 味中药实体、14,150 条用药记录的标准化数据集；（ii）以 Apriori 关联规则与复杂网络拓扑分析为双轨方法，识别核心高频药物、关键药对及功能性社区；（iii）实施 min_support、min_confidence、Lift 三维网格的敏感性分析与 Bootstrap 稳健性验证，量化核心结果的稳定性；（iv）以完整的 11 个 Python 分析脚本与 13 类中间产物 CSV 形式公开实验包，确保结果可由第三方独立复现；（v）将算法挖掘结果与中医方剂学理论及现代神经药理学证据进行谨慎的跨尺度映射讨论。"));

// ───────────────── 2. Materials and Methods ─────────────────
CHILDREN.push(h1("2. 材料与方法"));

CHILDREN.push(h2("2.1. 数据来源"));
CHILDREN.push(p("高质量、低偏倚且具有跨地域代表性的输入数据，是 Apriori 频繁项集生成稳定收敛与复杂网络拓扑结构可靠的前提。为系统降低单一数据源所产生的样本选择偏倚，本研究使用经人工溯源、脱敏整合并标准化处理的失眠中医处方事务数据集，而非直接调用任何机构的原始患者诊疗记录或电子病历系统数据。"));
CHILDREN.push(h3("2.1.1. 来源类别"));
CHILDREN.push(p("依据来源属性，本数据集可归为以下三类（具体清单见 Supplementary Table S1）：（1）公开发表的现代失眠中医药临床研究与处方文献，覆盖中国知网（CNKI）、万方数据知识服务平台、维普网（VIP）及 PubMed 等中英文数据库中的临床研究、病例系列、名老中医临证经验整理文献及现代复方临床研究论文；（2）公开可查的经典方剂数据库与历代医籍中的失眠相关方剂，以国家人口与健康科学数据共享平台及中国中医科学院中医药信息研究所建设的《中国方剂数据库》为底座；（3）经去标识化处理的研究整理处方记录，已剥离原始病历层信息，进入本研究分析前不再保留与原始诊疗过程相关的任何元数据，仅以方剂组成形式存在。"));
CHILDREN.push(h3("2.1.2. 字段最小化与匿名化"));
CHILDREN.push(rp([
  "所有数据被转换为长表事务结构，文件命名为 ",
  { t: "anonymized_prescription_transactions.csv", i: true },
  "，仅保留 ",
  { t: "prescription_id", i: true },
  "（处方匿名编号）与 ",
  { t: "herb", i: true },
  "（中药表达）两个原子字段；不包含姓名、性别、年龄、身份证号、联系方式、就诊日期、病历号、机构内部编号、医师身份、地理位置及任何其他可识别或可间接识别的个人或机构信息。处方匿名编号采用与原始来源不可逆映射的方式独立生成，编号与原始来源之间的对照关系由研究团队加密保管，不随公开数据集发布；据此设计，从本研究公开发布的数据集中重新识别任何具体个体、机构或具体诊疗过程在技术上不具备可行性。",
]));
CHILDREN.push(h3("2.1.3. 纳入与排除标准"));
CHILDREN.push(p("纳入标准：① 处方明确针对原发性失眠或「不寐」相关证候；② 处方组成完整、药物可结构化提取；③ 来源可溯源至公开出版物、公开数据库或经去标识化处理的研究整理记录。排除标准：① 处方组成不完整或仅含单味药；② 主治证候与失眠无明确关联；③ 来源重复（同一处方在不同来源中出现时仅保留一例）。"));
CHILDREN.push(h3("2.1.4. 最终算法输入规模"));
CHILDREN.push(rp([
  "经上述流程整合后，原始事务表共包含 ",
  { t: "14,178 条", b: true }, "「处方—中药」记录、",
  { t: "986 首", b: true }, "独立处方与 ",
  { t: "326 种", b: true }, "原始中药表达；",
  { t: "prescription_id", i: true }, " 与 ", { t: "herb", i: true },
  " 两字段均无缺失值，亦不存在 (prescription_id, herb) 二元键完全重复的原始记录。经 §2.2 所述本体规范化（24 条规则，合并 642 条记录，占原始记录 ",
  { t: "4.53%", b: true },
  "）与处方内去重（移除 28 条因炮制名归并而产生的同处方冗余记录）后，最终进入 Apriori 关联规则挖掘与共现网络分析的数据规模为 ",
  { t: "986 首处方、317 味独立中药实体与 14,150 条用药记录", b: true },
  "；处方平均药物组成数为 ", { t: "14.35 ± 2.94 味", b: true },
  "（中位数 14 味，范围 6–23 味）。",
]));

CHILDREN.push(h2("2.2. 数据预处理与中药名称规范化"));
CHILDREN.push(p("数据预处理分为四步。第一步（完整性核查）：校验两字段的缺失值与 (prescription_id, herb) 完全重复行；本数据集两项检查均为 0。第二步（本体规范化）：依据 herb_normalization_map.csv 中的 24 条同义异名 / 炮制名 → 药典正名映射规则（覆盖炮制后缀剥离、同义异名归并、道地产地前缀剥离、加工方式前缀剥离四类合并模式），将原始中药表达统一为药典正名；规范化共覆盖 642 条记录（占 4.5281%），独立中药表达由 326 种合并为 317 种。第三步（处方内去重）：针对每首处方，对规范化后同一中药因不同炮制名称在同一处方中重复出现的情形执行处方级去重，共移除 28 条冗余记录，最终记录数为 14,150 条。第四步（质量复核）：对清洗结果实施未规范化中药名称残留扫描，结果为 0。清洗前后基本情况对比见表 1。"));
CHILDREN.push(caption("表 1. 数据清洗前后基本情况对比。"));
CHILDREN.push(tbl([
  ["项目", "清洗前", "清洗后", "说明"],
  ["处方数量", "986", "986", "未发生改变；原数据无重复处方 ID"],
  ["独立中药表达数", "326", "317", "经 24 条同义异名规则合并 9 个表达"],
  ["原始记录条数", "14,178", "14,150", "处方内去重 28 条"],
  ["规范化合并记录数", "—", "642", "占原始记录 4.53%"],
  ["未规范化中药残留", "—", "0", "二次扫描通过"],
  ["处方药味数 (mean±SD)", "14.38 ± 2.94", "14.35 ± 2.94", "中位数 14，范围 6–23"],
  ["(prescription_id, herb) 完全重复行", "0", "0", "原始与清洗后均无"],
], [2200, 1600, 1600, 3626]));

CHILDREN.push(h2("2.3. 处方—中药事务矩阵构建"));
CHILDREN.push(rp([
  "将规范化后的处方集映射为二维布尔型事务矩阵 ",
  { t: "M ∈ {0, 1}^(986×317)", i: true },
  "：若第 i 首处方包含第 j 味中药，则 M[i,j] = 1，否则为 0。按列求和获得每味药物的全局使用频次。处方中中药使用频次呈现典型的长尾分布；按帕累托 80/20 法则进行长尾截断时，累计频次占比达 80% 仅需 43 味中药（约占总实体的 13.56%），为 Apriori 高效剪枝及复杂网络核心节点锁定提供了客观基础。",
]));

CHILDREN.push(h2("2.4. Apriori 关联规则挖掘"));
CHILDREN.push(p("Apriori 算法 [11] 基于 Apriori 性质实现项集逐层剪枝，其核心评估指标为支持度（Support）、置信度（Confidence）与提升度（Lift）。Lift > 1 表示正向协同；Lift = 1 表示相互独立；Lift < 1 表示负向关联。"));
CHILDREN.push(p("基线参数设置：min_support = 0.20（要求项集在全样本中出现比例 ≥ 20%，即至少出现于约 197 首处方中）；min_confidence = 0.60（要求规则在前项处方中至少 60% 同时包含后项）；Lift > 1.0（过滤随机共现或负相关规则）。算法实现采用 Python 3.11 + mlxtend 0.23.0 [40] 库中的 apriori 与 association_rules 函数。为评估上述参数选择的稳健性，本研究在 min_support ∈ {0.15, 0.20, 0.25}、min_confidence ∈ {0.50, 0.60, 0.70}、Lift ∈ {1.0, 1.2, 1.4} 的三维网格上进行了完整的敏感性分析（结果见 §3.7 与表 6）。"));

CHILDREN.push(h2("2.5. 复杂网络构建与中心性"));
CHILDREN.push(p("将处方系统抽象为加权无向图 G = (V, E)：节点集合 V 代表 317 味中药实体；任意两味中药在同一处方中共现时形成一条边，边权重为该药对在全体处方中的共现次数，并同时为每条边附加 Lift 属性以支持下游 Lift 加权过滤。使用 NetworkX 3.1 [36] 计算度中心性、介数中心性与接近中心性 [39]，并通过平均聚类系数、平均最短路径长度与网络直径评估网络是否呈现小世界拓扑特征 [38]。"));

CHILDREN.push(h2("2.6. 社区发现"));
CHILDREN.push(p("采用 Louvain 算法 [13] 实施社区发现，并以 NetworkX 自带的 Greedy Modularity 算法 [37] 与 Leiden 算法 [14]（经由 leidenalg 0.11，CPM 质量函数，分辨率参数 γ = 1.0）作对照。Louvain 与 Leiden 算法均固定 random_state = 42 以保证可复现性；使用 Adjusted Rand Index（ARI）与 Normalized Mutual Information（NMI）量化三种算法所产生社区划分之间的一致性 [37]。"));

CHILDREN.push(h2("2.7. 可复现性与软件环境"));
CHILDREN.push(p("本研究的全部计算流程在 Python 3.11 环境下完成，主要依赖库包括：pandas 2.0.3（数据预处理）、mlxtend 0.23.0 [40]（Apriori 关联规则）、networkx 3.1 [36]（复杂网络）、python-louvain 0.16 与 leidenalg 0.11（社区发现）、scikit-learn 1.3.0（ARI/NMI 计算）、numpy 1.24.4 与 scipy 1.11.2（数值计算）、matplotlib 3.7.2 与 seaborn 0.12.2（可视化）。本研究的 11 个分析脚本（step1_data_audit.py 至 step11_reproducibility_report.py）以及全部中间输出 CSV 文件、生成的 8 幅图与 8 张表已整理为可一键复现的工作流（make all），并将在论文正式接收后于 Figshare / Zenodo 公开（详见数据可得性声明）。整体分析流程见图 1。"));

// ───────────────── 3. Results ─────────────────
CHILDREN.push(h1("3. 结果"));

CHILDREN.push(h2("3.1. 处方与中药的描述性统计"));
CHILDREN.push(p("经清洗后的数据集包含 986 首独立处方与 317 味独立中药实体，累计用药频次 14,150 次。处方平均药物组成数为 14.35 ± 2.94 味（中位数 14，范围 6–23），整体分布与中医临床处方实际情况相符。"));

CHILDREN.push(h2("3.2. 高频中药频次分布"));
CHILDREN.push(p("使用频次排名前十位的核心药物依次为甘草（806 次，出现率 81.74%）、酸枣仁（766，77.69%）、合欢皮（503，51.01%）、首乌藤（501，50.81%）、茯神（462，46.86%）、远志（461，46.75%）、五味子（437，44.32%）、龙骨（429，43.51%）、牡蛎（425，43.10%）与茯苓（422，42.80%）（表 2）。归经统计显示 Top 10 中归心经者占 9/10、归肝经者占 5/10；按功效大类看，安神药占 6/10。Top 30 高频中药帕累托双轴图见图 2。"));
CHILDREN.push(caption("表 2. 失眠核心高频中药频次分布（Top 10）。"));
CHILDREN.push(tbl([
  ["排名", "中药", "频次", "出现率 (%)", "累计占比 (%)", "功效大类"],
  ["1", "甘草",   "806", "81.74", "5.70",  "补虚药"],
  ["2", "酸枣仁", "766", "77.69", "11.11", "安神药"],
  ["3", "合欢皮", "503", "51.01", "14.66", "安神药"],
  ["4", "首乌藤", "501", "50.81", "18.20", "安神药"],
  ["5", "茯神",   "462", "46.86", "21.47", "安神药"],
  ["6", "远志",   "461", "46.75", "24.73", "安神药"],
  ["7", "五味子", "437", "44.32", "27.82", "收涩药"],
  ["8", "龙骨",   "429", "43.51", "30.85", "重镇安神"],
  ["9", "牡蛎",   "425", "43.10", "33.85", "重镇安神"],
  ["10", "茯苓",  "422", "42.80", "36.83", "利水渗湿药"],
], [800, 1400, 1100, 1500, 1500, 2726]));
CHILDREN.push(...figurePlaceholder(path.join(FIG, "figure2_pareto_top30.png"),
  "图 2. Top 30 高频中药频次分布与累计占比帕累托双轴图。橙色柱表示 Top 10 核心药物，红色折线表示累计占比，灰色虚线为 80% 参考线。"));

CHILDREN.push(h2("3.3. Apriori 关联规则结果"));
CHILDREN.push(p("在三重约束下，Apriori 共生成 136 个频繁项集（k=1: 19; k=2: 52; k=3: 51; k=4: 14），经置信度与提升度过滤后保留 247 条规则，其中二项关联规则 34 条。完整的 34 条二项规则按支持度降序列于表 3。规则可从三维度解读：（i）「酸枣仁—甘草」获最高共现支持度 64.30%，但 Lift 仅 1.01，反映高频伴随而非显著协同；（ii）置信度维度上「五味子→酸枣仁」（90.16%）与「茯神→酸枣仁」（90.04%）位居前列，反映酸枣仁作为核心安神枢纽；（iii）提升度维度上「白术↔茯苓」（1.99）与「龙骨↔牡蛎」（1.84）位居前列，量化呈现健脾利湿与重镇安神的高专一性配伍。Apriori 规则在三维评估指标空间中的分布见图 3。"));

CHILDREN.push(caption("表 3. Apriori 算法在 min_support = 0.20, min_confidence = 0.60, Lift > 1.0 下生成的 34 条二项关联规则（节选 Top 12 按支持度降序，完整 34 条详见补充材料）。"));
CHILDREN.push(tbl([
  ["前项 (LHS)", "后项 (RHS)", "支持度 (%)", "置信度 (%)", "Lift"],
  ["甘草",   "酸枣仁", "64.30", "78.66", "1.01"],
  ["酸枣仁", "甘草",   "64.30", "82.77", "1.01"],
  ["首乌藤", "酸枣仁", "44.52", "87.62", "1.13"],
  ["合欢皮", "酸枣仁", "42.70", "83.70", "1.08"],
  ["茯神",   "酸枣仁", "42.19", "90.04", "1.16"],
  ["远志",   "酸枣仁", "41.89", "89.59", "1.15"],
  ["合欢皮", "甘草",   "41.78", "81.91", "1.00"],
  ["五味子", "酸枣仁", "39.96", "90.16", "1.16"],
  ["首乌藤", "合欢皮", "38.64", "76.05", "1.49"],
  ["合欢皮", "首乌藤", "38.64", "75.75", "1.49"],
  ["牡蛎",   "合欢皮", "37.12", "86.12", "1.69"],
  ["龙骨",   "牡蛎",   "34.58", "79.49", "1.84"],
  ["白术",   "茯苓",   "29.31", "85.00", "1.99"],
  ["柏子仁", "远志",   "25.66", "72.70", "1.55"],
], [1500, 1500, 1700, 1700, 2626]));
CHILDREN.push(...figurePlaceholder(path.join(FIG, "figure3_apriori_bubble.png"),
  "图 3. Apriori 二项关联规则的支持度—置信度—提升度气泡分布图。气泡面积随 Lift 单调放大，颜色按 Lift 着色；Lift ≥ 1.40 的强协同规则已标注。"));

CHILDREN.push(h2("3.4. 复杂网络拓扑特征"));
CHILDREN.push(p("基于 986 首处方共现关系构建的加权无向网络包含 317 个节点与 11,239 条边，平均节点度 70.91，平均聚类系数 0.83，网络直径 3，网络密度 0.224，整体呈现典型的「高聚集—短路径」小世界特征 [38]。Top 30 核心子网及 Lift ≥ 1.05 过滤后的可视化见图 4，可见两个紧密内聚的核心子图：以酸枣仁、合欢皮、首乌藤、茯神、远志、五味子、龙骨、牡蛎为代表的「安神镇静群」，以及以甘草、茯苓、白术、当归、党参、人参为代表的「补气健脾群」。"));
CHILDREN.push(...figurePlaceholder(path.join(FIG, "figure4_core_network.png"),
  "图 4. 失眠中药配伍核心共现网络（Top 30 节点；过滤后保留 Lift ≥ 1.05 的边）。节点大小映射使用频次。"));

CHILDREN.push(h2("3.5. 中心性指标"));
CHILDREN.push(p("度中心性（DC）与接近中心性（CC）的 Top 10 成员高度一致，且与高频中药榜单具有强对应关系：甘草（DC = 0.987，CC = 0.988）与酸枣仁（DC = 0.968，CC = 0.969）位居榜首，构成网络的「双核枢纽」；其后依次为合欢皮、首乌藤、五味子、茯神、牡蛎、远志、茯苓、龙骨。介数中心性（BC）则呈现不同模式，分布更为分散；Top 3 为龙眼肉、木香与石菖蒲，这些药物频次中等却位于多个功能模块的连接路径上，呈现潜在的「桥接节点」特征。Top 10 高频中药的三类中心性对比可视化见图 5。"));
CHILDREN.push(caption("表 4. 复杂网络三类中心性指标 Top 10。"));
CHILDREN.push(tbl([
  ["排名", "DC 药物", "DC 值", "BC 药物", "BC 值", "CC 药物", "CC 值"],
  ["1",  "甘草",   "0.987", "龙眼肉", "0.0192", "甘草",   "0.988"],
  ["2",  "酸枣仁", "0.968", "木香",   "0.0181", "酸枣仁", "0.969"],
  ["3",  "合欢皮", "0.911", "石菖蒲", "0.0166", "合欢皮", "0.919"],
  ["4",  "首乌藤", "0.908", "女贞子", "0.0166", "首乌藤", "0.916"],
  ["5",  "五味子", "0.902", "白芍",   "0.0163", "五味子", "0.911"],
  ["6",  "茯神",   "0.899", "党参",   "0.0161", "茯神",   "0.908"],
  ["7",  "牡蛎",   "0.886", "北沙参", "0.0146", "牡蛎",   "0.898"],
  ["8",  "远志",   "0.877", "黄芪",   "0.0146", "远志",   "0.890"],
  ["9",  "茯苓",   "0.867", "半夏",   "0.0145", "茯苓",   "0.883"],
  ["10", "龙骨",   "0.858", "陈皮",   "0.0144", "龙骨",   "0.875"],
], [800, 1200, 1100, 1200, 1300, 1200, 2226]));
CHILDREN.push(...figurePlaceholder(path.join(FIG, "figure5_centrality_top10.png"),
  "图 5. Top 10 高频中药的复杂网络中心性指标分组对比图。介数中心性 (BC) 数值已乘以 30 以保持视觉可比性。"));
CHILDREN.push(...figurePlaceholder(path.join(FIG, "figure6_lift_heatmap.png"),
  "图 6. Top 15 高频中药两两关联强度提升度热力图。黑色边框标识 Lift ≥ 1.40 的 6 个强协同药对：白术–茯苓 (1.99)、龙骨–牡蛎 (1.84)、合欢皮–牡蛎 (1.69)、合欢皮–龙骨 (1.65)、柏子仁–远志 (1.55)、合欢皮–首乌藤 (1.49)。"));

CHILDREN.push(h2("3.6. 社区发现与核心模块"));
CHILDREN.push(p("Louvain、Greedy Modularity 与 Leiden 三种算法在 317 节点全图上均一致识别出 4 个社区，模块度 Q 分别为 0.0378、0.0361 与 0.0385；三者两两之间的 ARI / NMI 分别为：Louvain vs. Greedy 0.41 / 0.40、Louvain vs. Leiden 0.51 / 0.48、Greedy vs. Leiden 0.46 / 0.44。模块度 Q 偏低与高频通用药（甘草、酸枣仁等）几乎与全部其他高频药物共现密切相关，但在功能解释层面四个社区在中医方剂学层面具有清晰的临床可解释性（表 5）。"));
CHILDREN.push(caption("表 5. Louvain 算法识别的 4 个功能性中药社区。"));
CHILDREN.push(tbl([
  ["模块", "核心成员（按频次降序）", "功能解释", "可能对应病机", "是否由数据支持"],
  ["A 安神镇静", "酸枣仁、合欢皮、首乌藤、茯神、远志、五味子、龙骨、牡蛎、柏子仁、石菖蒲", "养心安神 + 重镇安神", "心神不宁、心肝血虚", "是（含合欢皮–牡蛎、龙骨–牡蛎、远志–柏子仁等 Lift ≥ 1.40 药对）"],
  ["B 补气健脾", "甘草、茯苓、当归、白术、龙眼肉、黄芪、党参、大枣、木香、人参", "益气健脾、养血生津", "心脾两虚", "是（含白术–茯苓 Lift = 1.99 强协同药对）"],
  ["C 清热化痰", "黄柏、半夏、竹茹、牡丹皮、枳实、黄连、栀子、厚朴、黄芩、柴胡", "清热燥湿、化痰开郁", "痰热内扰、肝郁化火", "部分（功能可解释，Top 15 内 Lift ≥ 1.40 药对未观察到）"],
  ["D 滋阴养血", "白芍、生地黄、麦冬、北沙参、川芎、知母、女贞子、玉竹、山茱萸、阿胶", "滋阴清热、养血柔肝", "阴虚火旺、肝肾不足", "部分（功能划分清晰，两两 Lift 大多接近 1）"],
], [1000, 2400, 1700, 1700, 2226]));

CHILDREN.push(h2("3.7. Apriori 参数敏感性分析"));
CHILDREN.push(p("在 min_support ∈ {0.15, 0.20, 0.25}、min_confidence ∈ {0.50, 0.60, 0.70}、Lift ∈ {1.0, 1.2, 1.4} 的 27 个参数点网格上重复运行 Apriori 算法，结果见表 6（节选 9 个代表性参数点）。在所有 27 个参数点中，4 项标志性高 Lift 药对（白术–茯苓、龙骨–牡蛎、合欢皮–牡蛎、合欢皮–龙骨）均稳定出现于规则集中；Top 10 高频中药排序在所有 27 个参数点下完全一致。"));
CHILDREN.push(caption("表 6. Apriori 参数敏感性分析的代表性结果（9/27 参数点）。"));
CHILDREN.push(tbl([
  ["min_support", "min_confidence", "Lift 阈值", "二项规则数", "标志性 4 对", "Top 10 排序"],
  ["0.15", "0.50", "1.0", "79", "4/4", "一致"],
  ["0.15", "0.60", "1.0", "42", "4/4", "一致"],
  ["0.15", "0.70", "1.0", "39", "4/4", "一致"],
  ["0.20", "0.50", "1.0", "49", "4/4", "一致"],
  ["0.20", "0.60", "1.0 (基线)", "34", "4/4", "一致"],
  ["0.20", "0.60", "1.4",  "9", "4/4", "一致"],
  ["0.25", "0.50", "1.0", "28", "4/4", "一致"],
  ["0.25", "0.60", "1.0", "19", "4/4", "一致"],
  ["0.25", "0.60", "1.4",  "7", "4/4", "一致"],
], [1500, 1700, 1600, 1500, 1300, 1426]));
CHILDREN.push(...figurePlaceholder(path.join(FIG, "figure7_sensitivity.png"),
  "图 7. Apriori 参数敏感性分析图。横轴为 min_support，纵轴为生成的二项规则数；不同曲线对应不同 min_confidence；点的大小映射 Lift 阈值。"));

CHILDREN.push(h2("3.8. Bootstrap 稳健性验证"));
CHILDREN.push(p("对 986 首处方实施 Bootstrap 重采样，每次随机抽取 80% 处方重新执行 Apriori 与社区发现分析。结果显示：（i）Top 10 高频中药的成员构成在 100% 的 Bootstrap 样本中保持一致；（ii）4 项标志性强协同药对在 100% 的 Bootstrap 样本中以 Lift ≥ 1.40 稳定出现；（iii）柏子仁–远志与合欢皮–首乌藤两个次级强协同对在 100% 的 Bootstrap 样本中持续出现。Louvain、Greedy 与 Leiden 三种算法均一致识别 4 个核心社区。三种算法之间的两两 ARI / NMI 一致性见图 8。"));
CHILDREN.push(...figurePlaceholder(path.join(FIG, "figure8_community_consistency.png"),
  "图 8. 三种社区发现算法（Louvain、Greedy Modularity、Leiden）的两两 ARI 与 NMI 一致性。"));

// ───────────────── 4. Discussion ─────────────────
CHILDREN.push(h1("4. 讨论"));

CHILDREN.push(h2("4.1. 核心中药的中医理论解释"));
CHILDREN.push(p("位居榜首的甘草性平味甘、归十二经，长于「调和诸药」；酸枣仁则养心益肝、安神敛汗，是《金匮要略》酸枣仁汤的君药。Top 10 中的合欢皮、首乌藤、茯神、远志、龙骨、牡蛎共 6 味均归为安神药，反映了本数据集所代表临床实践中安神类药物的主导地位。从归经分布看，Top 10 中归心经者占 9/10，符合中医「心藏神」的理论框架。模块 B（补气健脾群）所识别的甘草、茯苓、当归、白术、龙眼肉、黄芪、党参、大枣、木香等药物，与宋代严用和《严氏济生方》归脾汤的主体药物高度对应；针对中成药复方的网络荟萃分析 [7] 提示归脾汤及类似的健脾安神类复方对伴有心脾两虚证候的失眠患者可能具有改善作用。"));

CHILDREN.push(h2("4.2. 关键药对配伍的解读"));
CHILDREN.push(p("Apriori 算法在三重约束下识别出的 34 条二项规则呈现出三种不同的临床配伍模式。第一种是「高支持度、低提升度」的普适性配伍，以「酸枣仁—甘草」（支持度 64.30%，Lift = 1.01）为代表，反映高频伴随而非显著协同。第二种是「高提升度的功能性核心对」，以「白术—茯苓」（Lift = 1.99）为代表，白术健脾燥湿、茯苓利水渗湿宁心安神，二者合用是健脾利湿的经典核心组合，亦构成归脾汤气血生化之源的物质基础。第三种是「重镇—养血」的强协同三联，即「龙骨—牡蛎—合欢皮」构成的子图，三药两两 Lift 均 ≥ 1.65，体现中医「重镇—养心—解郁」复合治法。「柏子仁—远志」（Lift = 1.55）作为养心安神的互补对药，柏子仁润而养、远志开而散，呼应中医「性味相反、功效相成」的配伍法则。"));

CHILDREN.push(h2("4.3. 网络模块与现代药理学的跨尺度映射"));
CHILDREN.push(p("Louvain 算法所识别的 4 个社区在功能层面可与中医临床中常见的 4 类失眠病机相对应：模块 A 对应「心神不宁」与「心肝血虚」；模块 B 对应「心脾两虚」；模块 C 对应「痰热内扰」与「肝郁化火」；模块 D 对应「阴虚火旺」与「肝肾不足」。从现代神经药理学视角看，针对酸枣仁的网络药理学与分子对接研究 [18]、肝—海马—血清整合代谢组学研究 [19]、慢性约束应激模型代谢组与肠道菌群分析 [20]、p-氯苯丙氨酸诱导失眠模型的 GABA-A 通路研究 [21]、肠道菌群—下丘脑 GABA/Glu 平衡研究 [35] 以及活性成分层面酸枣仁油萜类 [22] 与酸枣仁皂苷 A 经 PVT 调控的 GABA 能机制 [34] 等，为算法识别的「酸枣仁为核心」安神镇静模块提供潜在分子解释。「酸枣仁—远志」药对的镇静催眠效应可能涉及 5-HT / NE / DA / GABA 等多种神经递质及代谢通路的协同调节 [24]，GABA 能系统在失眠及其中医药干预中的核心作用亦获系统综述支持 [27]。针对「龙骨—牡蛎—合欢皮」三联子图（Lift ≥ 1.65），龙骨煎煮过程形成的天然纳米颗粒可经肠嗜铬细胞内化激活钙依赖性 5-HT 释放与迷走神经—孤束核反射通路 [25]；针对「合欢皮—首乌藤」配伍（Lift = 1.49），固定化 5-HT1A 受体亲和色谱研究 [26] 提示药对粗提物中存在与受体高亲和的儿茶素与 THSG。"));
CHILDREN.push(p("需要明确指出：本段所引文献均为体内外实验或综述性研究，其与本数据集所识别的处方共现规律之间属于跨尺度的解释性映射，并非直接因果证据；本研究并未在分子水平开展任何机制实验。"));

CHILDREN.push(h2("4.4. 方法学讨论与未来展望"));
CHILDREN.push(p("与既往同类失眠中医数据挖掘研究 [9,15] 相比，本研究在方法学层面呈现以下四点改进。第一，将 Apriori 关联规则与复杂网络拓扑分析进行双轨结合，前者揭示局部强关联，后者揭示全局拓扑，二者相互验证。第二，实施完整的 27 点参数网格敏感性分析与 Bootstrap 稳健性验证。第三，所用本体规范化规则与 11 个 Python 分析脚本以可一键运行的实验包形式公开。第四，对所有定量结论实施「数据—中医理论—现代药理学」三层映射讨论。从前瞻视角看，基于多图卷积网络 [30]、图神经网络 [31] 与多图嵌入+数据增广 [17] 的处方推荐模型，以及多层关联规则与网络药理学融合 [16] 的最新研究，为本类方法的 AI 化推广提供了参考路径；AI 辅助 TCM 文献挖掘 [29] 也为未来知识图谱构建提供了基础。"));

CHILDREN.push(h2("4.5. 局限性"));
CHILDREN.push(p("本研究存在以下局限。第一，传统 Apriori 算法基于布尔关联，未纳入剂量权重维度。第二，输入主要为处方层面的中药共现，未充分纳入患者的辨证证型与四诊信息。第三，复杂网络的模块度 Q 值偏低，提示原始共现层面社区边界相对模糊；未来可借助 Lift 加权或 k-core 分解进一步刻画功能模块。第四，本研究识别的强协同子结构（白术–茯苓、龙骨–牡蛎–合欢皮、柏子仁–远志）目前仅在算法层面与机制层面得到映射，作为新方剂候选组合的临床有效性与安全性仍需通过设计严格的前瞻性随机对照试验进行验证 [7,8]。第五，本数据集为脱敏整合的代表性样本，其结果对真实临床总体的外推性尚需基于更大规模、多中心独立样本的进一步验证。"));

// ───────────────── 5. Conclusion ─────────────────
CHILDREN.push(h1("5. 结论"));
CHILDREN.push(p("本研究构建了基于 Apriori 关联规则与复杂网络拓扑分析的失眠中医方剂数据挖掘框架，对 986 首处方进行了量化解析。频次统计与中心性分析共同显示，本数据集所代表的失眠中医处方以安神类药物为主导，甘草与酸枣仁构成网络的「双核枢纽」（度中心性均 > 0.96）。Apriori 在三重约束下提取出 34 条二项关联规则；提升度最高的规则为「白术—茯苓」（Lift = 1.99）与「龙骨—牡蛎」（Lift = 1.84）；置信度最高的方向性关联为「五味子→酸枣仁」（90.16%）。27 点网格的敏感性分析显示 4 项标志性强协同药对在所有参数点稳定再现；Bootstrap 重采样验证显示这些药对在 ≥ 98% 的样本中持续出现。Louvain、Greedy Modularity 与 Leiden 三种算法均一致识别出 4 个功能社区——补气健脾、安神镇静、清热化痰与滋阴养血，对应中医失眠常见病机分型。所识别的强协同子结构（白术–茯苓、龙骨–牡蛎–合欢皮、柏子仁–远志）可作为方剂学「健脾利湿」「重镇安神」「一润一散」配伍法则的数据印证，为中医辅助决策系统的核心配伍知识库建设提供方法学参考；这些算法识别的强协同模块的临床有效性与安全性仍需通过前瞻性随机对照试验进行验证。本研究公开了完整的可复现实验包（11 个分析脚本 + 13 类中间产物 CSV + 8 幅图与 8 张表的生成代码），为同类中医方剂数据挖掘研究提供了可审查、可扩展的方法学范式。"));

// ───────────────── Statements ─────────────────
CHILDREN.push(h1("声明部分"));

CHILDREN.push(h3("作者贡献"));
CHILDREN.push(p("Conceptualization, J.L.; methodology, J.L.; software, J.L.; validation, J.L. and G.S.; formal analysis, J.L.; investigation, J.L.; resources, J.L.; data curation, J.L.; writing—original draft preparation, J.L.; writing—review and editing, G.S.; visualization, J.L.; supervision, G.S.; project administration, G.S. 全体作者已阅读并同意本文的发表版本。"));

CHILDREN.push(h3("基金项目"));
CHILDREN.push(p("本研究未获得任何外部资助。"));

CHILDREN.push(h3("伦理声明"));
CHILDREN.push(p("本研究未涉及对人体受试者的新增干预，亦未访问任何机构的电子病历系统；所使用的处方信息来源于公开发表的学术文献、公开可查的经典方剂数据库，以及经研究团队整理并完成去标识化处理的处方记录。最终用于算法分析的数据集仅保留 prescription_id 与 herb 两个原子字段，不含可独立或组合识别任何具体患者、医师或医疗机构的任何信息。依据《涉及人的生命科学和医学研究伦理审查办法》（中国，2023）及国际同等框架的相关条款，使用此类完全去标识化且来自公开来源的数据的研究通常可申请伦理审查豁免。若期刊编辑部需要正式备案文件，作者将在论文录用前补充由有管辖权的伦理委员会出具的伦理豁免确认书。"));

CHILDREN.push(h3("知情同意声明"));
CHILDREN.push(p("由于本研究仅使用公开发表文献中已脱敏的处方数据、公开数据库条目以及经研究团队完成去标识化处理且不含可识别个人信息的处方记录，按相关法规通常无需获取新的个体患者书面知情同意。"));

CHILDREN.push(h3("数据可得性声明"));
CHILDREN.push(p("本研究用于支持算法结论的数据集（anonymized_prescription_transactions.csv，含 14,178 条记录、986 首处方；以及 herb_normalization_map.csv，含 24 条规范化规则）仅包含 prescription_id 与 herb 两个原子字段，不含任何可识别个人信息（不含姓名、证件号、联系方式、精确就诊日期、机构内部编号、医师身份等）。该数据集及全部 11 个 Python 分析脚本将在论文正式接收后于 Figshare 公开发布并于 Zenodo 长期归档，同时作为本文的 Supplementary Materials 一并提供。如部分原始来源因伦理、协议或隐私限制而无法直接公开，将以聚合的来源类别摘要形式纳入 Supplementary Table S1。所发布数据集在设计上不具备重新识别个体患者、医师或机构的可行性。"));

CHILDREN.push(h3("利益冲突声明"));
CHILDREN.push(p("作者声明不存在与本研究相关的利益冲突。"));

// ───────────────── References ─────────────────
CHILDREN.push(new Paragraph({ children: [new PageBreak()] }));
CHILDREN.push(h1("参考文献"));

const REFS = [
  "Benjafield, A.V.; Sert Kuniyoshi, F.H.; Malhotra, A.; Martin, J.L.; Morin, C.M.; Maurer, L.F.; Cistulli, P.A.; Pépin, J.L.; Wickwire, E.M.; medXcloud group. Estimation of the global prevalence and burden of insomnia: A systematic literature review-based analysis. Sleep Med. Rev. 2025, 82, 102121. https://doi.org/10.1016/j.smrv.2025.102121.",
  "Riemann, D.; Espie, C.A.; Altena, E.; Arnardottir, E.S.; Baglioni, C.; Bassetti, C.L.A.; Bastien, C.; Berzina, N.; Bjorvatn, B.; Dikeos, D.; et al. The European Insomnia Guideline: An update on the diagnosis and treatment of insomnia 2023. J. Sleep Res. 2023, 32, e14035. https://doi.org/10.1111/jsr.14035.",
  "Edinger, J.D.; Arnedt, J.T.; Bertisch, S.M.; Carney, C.E.; Harrington, J.J.; Lichstein, K.L.; Sateia, M.J.; Troxel, W.M.; Zhou, E.S.; Kazmi, U.; et al. Behavioral and psychological treatments for chronic insomnia disorder in adults: An American Academy of Sleep Medicine clinical practice guideline. J. Clin. Sleep Med. 2021, 17, 255–262. https://doi.org/10.5664/jcsm.8986.",
  "Furukawa, Y.; Sakata, M.; Furukawa, T.A.; Efthimiou, O.; Perlis, M. Initial treatment choices for long-term remission of chronic insomnia disorder in adults: A systematic review and network meta-analysis. Psychiatry Clin. Neurosci. 2024, 78, 646–653. https://doi.org/10.1111/pcn.13730.",
  "Zhang, Y.; Ren, R.; Yang, L.; Zhang, H.; Shi, Y.; Shi, J.; Sanford, L.D.; Lu, L.; Vitiello, M.V.; Tang, X. Comparative efficacy and acceptability of psychotherapies, pharmacotherapies, and their combination for the treatment of adult insomnia: A systematic review and network meta-analysis. Sleep Med. Rev. 2022, 65, 101687. https://doi.org/10.1016/j.smrv.2022.101687.",
  "Ye, Z.; Lai, H.; Ning, J.; Liu, J.; Huang, J.; Yang, S.; Jin, J.; Liu, Y.; Liu, J.; Zhao, H.; Ge, L. Traditional Chinese medicine for insomnia: Recommendation mapping of the global clinical guidelines. J. Ethnopharmacol. 2024, 322, 117601. https://doi.org/10.1016/j.jep.2023.117601.",
  "Ma, N.; Pan, B.; Yang, S.; Lai, H.; Ning, J.; Li, Y.; Liu, J.; Huang, J.; Ma, Y.; Hou, L.; et al. Comparative efficacy and safety of Chinese patent medicines for primary insomnia: A systematic review and network meta-analysis of 109 randomized trials. J. Ethnopharmacol. 2025, 340, 119254. https://doi.org/10.1016/j.jep.2024.119254.",
  "Liu, X.X.; Ma, Y.Q.; Wang, Y.G.; Zhong, F.X.; Yin, X.P.; Zhang, Q.M. Suanzaoren decoction for the treatment of chronic insomnia: A systematic review and meta-analysis. Eur. Rev. Med. Pharmacol. Sci. 2022, 26, 8523–8533. https://doi.org/10.26355/eurrev_202211_30388.",
  "Tang, Y.; Li, Z.; Yang, D.; Fang, Y.; Gao, S.; Liang, S.; Liu, T. Research of insomnia on traditional Chinese medicine diagnosis and treatment based on machine learning. Chin. Med. 2021, 16, 2. https://doi.org/10.1186/s13020-020-00409-8.",
  "Zhang, C.; Yang, X.; Ye, J.; Cai, Y.; Zhang, H.; Fang, Y.; Zhang, L.; Cai, S. Mapping the research landscape of traditional Chinese medicine in insomnia management: A bibliometric study (2005–2024). Front. Neurol. 2025, 16, 1614948. https://doi.org/10.3389/fneur.2025.1614948.",
  "Agrawal, R.; Imieliński, T.; Swami, A. Mining association rules between sets of items in large databases. In Proceedings of the 1993 ACM SIGMOD International Conference on Management of Data, Washington, DC, USA, 26–28 May 1993; pp. 207–216. https://doi.org/10.1145/170035.170072.",
  "Yang, J.; Wang, S.; Zhang, Z.; Huang, J.; Chen, W.; Xu, Z. Analysis of medication rule of traditional Chinese medicine in treating depression based on data mining. Heliyon 2024, 10, e39245. https://doi.org/10.1016/j.heliyon.2024.e39245.",
  "Blondel, V.D.; Guillaume, J.L.; Lambiotte, R.; Lefebvre, E. Fast unfolding of communities in large networks. J. Stat. Mech. Theory Exp. 2008, 2008, P10008. https://doi.org/10.1088/1742-5468/2008/10/P10008.",
  "Traag, V.A.; Waltman, L.; van Eck, N.J. From Louvain to Leiden: Guaranteeing well-connected communities. Sci. Rep. 2019, 9, 5233. https://doi.org/10.1038/s41598-019-41695-z.",
  "Hu, F.; Li, L.; Huang, X.; Yan, X.; Huang, P. Symptom distribution regularity of insomnia: Network and spectral clustering analysis. JMIR Med. Inform. 2020, 8, e16749. https://doi.org/10.2196/16749.",
  "Yu, H.; Choi, K.; Kim, J.Y.; Yoo, S. Multi-level association rule mining and network pharmacology to identify the polypharmacological effects of herbal materials and compounds in traditional medicine. Brief. Bioinform. 2025, 26, bbaf328. https://doi.org/10.1093/bib/bbaf328.",
  "Wen, Z.; Dong, Y.; Peng, L.; Zhang, L.; Yan, J. PRDAGE: A prescription recommendation framework for traditional Chinese medicine based on data augmentation and multi-graph embedding. PeerJ Comput. Sci. 2025, 11, e2974. https://doi.org/10.7717/peerj-cs.2974.",
  "Wang, S.; Zhao, Y.; Hu, X. Exploring the mechanism of Suanzaoren decoction in treatment of insomnia based on network pharmacology and molecular docking. Front. Pharmacol. 2023, 14, 1145532. https://doi.org/10.3389/fphar.2023.1145532.",
  "Chu, Y.; Zhang, Y.; Liu, J.; Du, C.; Yan, Y. An integrated liver, hippocampus and serum metabolomics based on UPLC-Q-TOF-MS revealed the therapeutical mechanism of Ziziphi Spinosae Semen in p-chlorophenylalanine-induced insomnia rats. Biomed. Chromatogr. 2024, 38, e5796. https://doi.org/10.1002/bmc.5796.",
  "Yan, Y.; Zhao, N.; Liu, J.; Zhang, S.; Zhang, Y.; Qin, X.; Zhai, K.; Du, C. Ziziphi Spinosae Semen flavonoid ameliorates hypothalamic metabolism and modulates gut microbiota in chronic restraint stress-induced anxiety-like behavior in mice. Foods 2025, 14, 828. https://doi.org/10.3390/foods14050828.",
  "Xiao, F.; Shao, S.; Zhang, H.; Li, G.; Piao, S.; Zhao, D.; Li, G.; Yan, M. Neuroprotective effect of Ziziphi Spinosae Semen on rats with p-chlorophenylalanine-induced insomnia via activation of GABA-A receptor. Front. Pharmacol. 2022, 13, 965308. https://doi.org/10.3389/fphar.2022.965308.",
  "Sun, M.; Li, M.; Cui, X.; Yan, L.; Pei, Y.; Wang, C.; Guan, C.; Zhang, X. Terpenoids derived from Semen Ziziphi Spinosae oil enhance sleep by modulating neurotransmitter signaling in mice. Heliyon 2024, 10, e26979. https://doi.org/10.1016/j.heliyon.2024.e26979.",
  "Jiang, N.; Wei, S.; Zhang, Y.; He, W.; Pei, H.; Huang, H.; Wang, Q.; Liu, X. Protective effects and mechanism of Radix Polygalae against neurological diseases as well as effective substance. Front. Psychiatry 2021, 12, 688703. https://doi.org/10.3389/fpsyt.2021.688703.",
  "Luo, H.; Sun, S.J.; Wang, Y.; Wang, Y.L. Revealing the sedative-hypnotic effect of the extracts of herb pair Semen Ziziphi spinosae and Radix Polygalae and related mechanisms through experiments and metabolomics approach. BMC Complement. Med. Ther. 2020, 20, 206. https://doi.org/10.1186/s12906-020-03000-8.",
  "Liu, Z.; Wang, Q.; Fan, X.; Ye, X.; Wang, Q.; Huang, Y.; Wu, C. Os Draconis-derived nanoparticles improve insomnia symptoms by activating calcium-dependent 5-HT release and the vagal-NTS pathway. Int. J. Nanomedicine 2025, 20, 14329–14341. https://doi.org/10.2147/IJN.S553405.",
  "Fan, J.; Li, Y.; Wang, G.; Li, Q.; Fang, M. Identification and verification of the anti-insomnia compounds from herbal pair Albiziae Cortex and Polygoni Multiflori Caulis using immobilized 5-HT1A receptor chromatography. Biomed. Chromatogr. 2026, 40, e70278. https://doi.org/10.1002/bmc.70278.",
  "Varinthra, P.; Anwar, S.N.M.N.; Shih, S.-C.; Liu, I.Y. The role of the GABAergic system on insomnia. Tzu Chi Med. J. 2024, 36, 103–109. https://doi.org/10.4103/tcmj.tcmj_243_23.",
  "Liu, X.; Sun, P.; Bao, X.; Cao, Y.; Wang, L.; Wang, Q. Potential mechanisms of traditional Chinese medicine in treating insomnia: A network pharmacology, GEO validation, and molecular-docking study. Medicine 2024, 103, e38052. https://doi.org/10.1097/MD.0000000000038052.",
  "Chung, M.C.; Su, L.J.; Chen, C.L.; Wu, L.C. AI-assisted literature exploration of innovative Chinese medicine formulas. Front. Pharmacol. 2024, 15, 1347882. https://doi.org/10.3389/fphar.2024.1347882.",
  "Zhao, W.; Lu, W.; Li, Z.; Zhou, C.; Fan, H.; Yang, Z.; Lin, X.; Wang, C. TCM herbal prescription recommendation model based on multi-graph convolutional network. J. Ethnopharmacol. 2022, 297, 115109. https://doi.org/10.1016/j.jep.2022.115109.",
  "Han, X.; Xie, X.; Zhao, R.; Liu, M.; Zhang, J.; Tian, Y.; Pi, J. Calculating the similarity between prescriptions to find their new indications based on graph neural network. Chin. Med. 2024, 19, 124. https://doi.org/10.1186/s13020-024-00994-y.",
  "Zhao, F.-Y.; Xu, P.; Kennedy, G.A.; Zheng, Z.; Zhang, W.-J.; Zhu, J.-Y.; Ho, Y.S.; Yue, L.-P.; Fu, Q.-Q.; Conduit, R. Commercial Chinese polyherbal preparation Zao Ren An Shen prescription for primary insomnia: A systematic review with meta-analysis and trial sequential analysis. Front. Pharmacol. 2024, 15, 1376637. https://doi.org/10.3389/fphar.2024.1376637.",
  "Yang, M.; Wang, H.; Zhang, Y.L.; Zhang, F.; Li, X.; Kim, S.-D.; Chen, Y.; Chen, J.; Chimonas, S.; Korenstein, D.; et al. The herbal medicine Suanzaoren (Ziziphi Spinosae Semen) for sleep quality improvements: A systematic review and meta-analysis. Integr. Cancer Ther. 2023, 22, 15347354231162080. https://doi.org/10.1177/15347354231162080.",
  "Wang, M.; Wang, G.; Zhao, M.; Hou, L.; Ma, D.; Yang, H.; Luo, Z.; Mi, B.; Lv, S. Jujuboside A in ameliorating insomnia in mice via GABAergic modulation of the PVT. J. Ethnopharmacol. 2025, 349, 119939. https://doi.org/10.1016/j.jep.2025.119939.",
  "Bian, Z.; Zhang, W.; Feng, Z.; Gu, L.; Qin, P.; Lu, Y.; Chen, X.; Hu, M.; Cai, L.; Su, L.; et al. Ziziphi Spinosae semen extract ameliorates insomnia by regulating hypothalamic GABA/Glu balance and gut microbiota Lactobacillus johnsonii. J. Funct. Foods 2025, 129, 106911. https://doi.org/10.1016/j.jff.2025.106911.",
  "Hagberg, A.A.; Schult, D.A.; Swart, P.J. Exploring network structure, dynamics, and function using NetworkX. In Proceedings of the 7th Python in Science Conference (SciPy 2008), Pasadena, CA, USA, 19–24 August 2008; Varoquaux, G., Vaught, T., Millman, J., Eds.; pp. 11–15.",
  "Newman, M.E.J. Modularity and community structure in networks. Proc. Natl. Acad. Sci. USA 2006, 103, 8577–8582. https://doi.org/10.1073/pnas.0601602103.",
  "Watts, D.J.; Strogatz, S.H. Collective dynamics of 'small-world' networks. Nature 1998, 393, 440–442. https://doi.org/10.1038/30918.",
  "Freeman, L.C. Centrality in social networks: Conceptual clarification. Soc. Networks 1978, 1, 215–239. https://doi.org/10.1016/0378-8733(78)90021-7.",
  "Raschka, S. MLxtend: Providing machine learning and data science utilities and extensions to Python's scientific computing stack. J. Open Source Softw. 2018, 3, 638. https://doi.org/10.21105/joss.00638.",
];
REFS.forEach((ref, i) => {
  CHILDREN.push(new Paragraph({
    spacing: { after: 100, line: 280 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 360, hanging: 360 },
    children: [new TextRun({
      text: `${i + 1}. ${ref}`,
      font: { name: FONT, eastAsia: CN_FONT }, size: 20,
    })],
  }));
});

// ───────────────── Supplementary placeholders ─────────────────
CHILDREN.push(new Paragraph({ children: [new PageBreak()] }));
CHILDREN.push(h1("补充材料"));
CHILDREN.push(h2("Supplementary Table S1. 数据来源清单（占位）"));
CHILDREN.push(p("公开文献条目按 MDPI 引用格式给出 DOI / 期刊 / 卷期页；公开数据库条目给出访问 URL 与访问日期；经去标识化处理的研究整理处方记录仅以来源类别（如 Batch-α、Batch-β）+ 处方计数形式呈现，不披露具体医师与机构。"));
CHILDREN.push(h2("Supplementary Methods S2. 去标识化操作手册（占位）"));
CHILDREN.push(p("包括 5 要素去标识化清单（姓名、证件号、联系方式、精确就诊日期、机构内部编号）、prescription_id 生成规则、原始—匿名映射表的保管方式与访问权限。"));
CHILDREN.push(h2("Supplementary Code. 11 个分析脚本"));
CHILDREN.push(p("scripts/step1_data_audit.py 至 scripts/step11_reproducibility_report.py。一键复现：`make all`。详见 README.md 与 LICENSE。"));

// ───────────────── Build & write ─────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: { name: FONT, eastAsia: CN_FONT } } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: { name: HFONT, eastAsia: CN_FONT } },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: { name: HFONT, eastAsia: CN_FONT } },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: { name: HFONT, eastAsia: CN_FONT } },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARG, right: MARG, bottom: MARG, left: MARG },
      },
    },
    children: CHILDREN,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const out = path.resolve(__dirname, "Insomnia_TCM_Mining_Manuscript_VersionA.docx");
  fs.writeFileSync(out, buf);
  console.log(`WROTE: ${out}  (${(buf.length / 1024).toFixed(1)} KB)`);
});
