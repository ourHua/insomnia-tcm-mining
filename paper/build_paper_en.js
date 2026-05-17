/**
 * build_paper_en.js — Insomnia_TCM_Mining_Manuscript_EN.docx
 *
 * Anglicised, SCI-style version of the manuscript. Same numerical results;
 * polished, anti-template prose suitable for submission to MDPI Applied
 * Sciences. All embedded figures are the re-rendered Pinyin-labelled
 * versions under outputs/figures/.
 */

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, AlignmentType, WidthType,
  BorderStyle, ShadingType, LevelFormat, ImageRun, PageBreak,
} = require("docx");

// ─── typography ────────────────────────────────────────────────────────
const FONT = "Times New Roman";
const HFONT = "Calibri";
const CN_FONT = "SimSun";
const PAGE_W = 11906, PAGE_H = 16838, MARG = 1440;
const CONTENT = PAGE_W - 2 * MARG;
const border = { style: BorderStyle.SINGLE, size: 4, color: "888888" };
const cellBorders = { top: border, bottom: border, left: border, right: border };

const txt = (s, opts={}) => new TextRun({
  text: s, font: { name: FONT, eastAsia: CN_FONT },
  size: opts.size || 22, bold: opts.b, italics: opts.i,
});
const p = (s, opts={}) => new Paragraph({
  spacing: { after: 120, line: 320, lineRule: "auto", ...(opts.spacing||{}) },
  alignment: opts.alignment || AlignmentType.JUSTIFIED,
  children: [txt(s, opts)],
});
const rp = (segs, opts={}) => new Paragraph({
  spacing: { after: 120, line: 320, lineRule: "auto", ...(opts.spacing||{}) },
  alignment: opts.alignment || AlignmentType.JUSTIFIED,
  children: segs.map(x => typeof x === "string"
    ? txt(x, opts)
    : txt(x.t, { ...opts, b: x.b, i: x.i })),
});
const h1 = s => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 320, after: 160 },
  children: [new TextRun({ text: s, font: { name: HFONT }, size: 30, bold: true })],
});
const h2 = s => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text: s, font: { name: HFONT }, size: 26, bold: true })],
});
const h3 = s => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 100 },
  children: [new TextRun({ text: s, font: { name: HFONT }, size: 22, bold: true })],
});
const caption = s => new Paragraph({
  spacing: { before: 120, after: 240 },
  alignment: AlignmentType.LEFT,
  children: [new TextRun({
    text: s, font: { name: FONT, eastAsia: CN_FONT },
    size: 20, bold: true,
  })],
});

function tbl(rows, widths) {
  const make = (cells, isHeader = false) => new TableRow({
    tableHeader: isHeader,
    children: cells.map((t, i) => new TableCell({
      borders: cellBorders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: isHeader ? { fill: "D9E2EE", type: ShadingType.CLEAR } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({
          text: String(t ?? ""), font: { name: FONT, eastAsia: CN_FONT },
          size: 20, bold: isHeader,
        })],
      })],
    })),
  });
  return new Table({
    width: { size: widths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [make(rows[0], true), ...rows.slice(1).map(r => make(r, false))],
  });
}

function fig(imgPath, captionText) {
  let img;
  try {
    img = new ImageRun({
      data: fs.readFileSync(imgPath),
      transformation: { width: 560, height: 340 },
      type: "png",
    });
  } catch {
    img = txt(`[Figure file missing: ${path.basename(imgPath)}]`, { i: true });
  }
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [img],
    }),
    caption(captionText),
  ];
}

const FIG = path.resolve(__dirname, "..", "outputs", "figures");
const C = [];

// ═══════════════════════════════════════════════════════════════════════
// Title block
// ═══════════════════════════════════════════════════════════════════════
C.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 120 },
  children: [new TextRun({
    text: "Association Rule Mining and Complex Network Analysis " +
          "of Insomnia Traditional Chinese Medicine Prescriptions: " +
          "A Reproducible Computational Pipeline",
    font: { name: HFONT }, size: 36, bold: true,
  })],
}));
C.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 240 },
  children: [new TextRun({
    text: "Junhua Li 1 and Gilja So 1,*",
    font: { name: FONT }, size: 22,
  })],
}));
C.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({
    text: "1   Affiliation to be inserted. Republic of Korea.",
    font: { name: FONT }, size: 18, italics: true, color: "555555",
  })],
}));
C.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 240 },
  children: [new TextRun({
    text: "*   Correspondence: [email-to-insert]",
    font: { name: FONT }, size: 18, italics: true, color: "555555",
  })],
}));

// ═══════════════════════════════════════════════════════════════════════
// Abstract
// ═══════════════════════════════════════════════════════════════════════
C.push(h2("Abstract"));
C.push(rp([
  { t: "(1) Background: ", b: true },
  "Chronic insomnia affects more than 850 million adults worldwide and remains poorly served by long-term pharmacotherapy, motivating computational re-analysis of established traditional Chinese medicine (TCM) prescribing practice. Prescription corpora are high-dimensional and lexically noisy, so isolated frequency statistics rarely expose the underlying combinatorial logic, and a unified treatment that bridges local pair-level synergy with global network topology is still lacking.",
]));
C.push(rp([
  { t: "(2) Methods: ", b: true },
  "We assembled a de-identified, two-field transactional corpus of 14,178 (prescription, herb) records covering 986 distinct insomnia prescriptions and 326 raw herb expressions. A 24-rule ontology reduced 642 expressions (4.53%) to canonical pharmacopoeial names, and intra-prescription deduplication removed 28 redundant rows, yielding ",
  { t: "986 prescriptions, 317 herb entities and 14,150 cleaned records", b: true },
  " (mean ", { t: "14.35 ± 2.94", b: true }, " herbs per prescription; median 14; range 6–23). Frequent itemsets and binary association rules were extracted with the Apriori algorithm under the triple constraint min_support = 0.20, min_confidence = 0.60 and Lift > 1.0. A weighted, undirected co-occurrence graph (317 nodes, 11,239 edges) was then constructed, and degree, betweenness and closeness centralities were computed. Community structure was assessed in parallel by the Louvain, Greedy Modularity and Leiden algorithms; pairwise concordance was quantified by Adjusted Rand Index (ARI) and Normalised Mutual Information (NMI). A 3 × 3 × 3 sensitivity grid (27 parameter settings) and 80% Bootstrap resampling probed the stability of the headline findings.",
]));
C.push(rp([
  { t: "(3) Results: ", b: true },
  "Frequency analysis was dominated by Gan Cao (",
  { t: "Glycyrrhizae Radix et Rhizoma", i: true }, "; 806 occurrences, 81.74%) and Suan Zao Ren (",
  { t: "Ziziphi Spinosae Semen", i: true }, "; 766, 77.69%); six of the top ten herbs were classified as nervine sedatives. Thirty-four binary rules satisfied the triple constraint. The highest Lift values were observed for Bai Zhu – Fu Ling (",
  { t: "Atractylodis Macrocephalae Rhizoma – Poria", i: true }, "; Lift = 1.99) and Long Gu – Mu Li (",
  { t: "Os Draconis – Ostreae Concha", i: true }, "; 1.84), and the trio Long Gu – Mu Li – He Huan Pi (",
  { t: "Albiziae Cortex", i: true }, ") formed a pairwise sub-graph in which every Lift exceeded 1.65. The co-occurrence network displayed small-world behaviour (mean clustering 0.83; diameter 3). The three community-detection algorithms each returned four functional modules with modularity Q ≈ 0.04, interpretable as Sedative–Tranquilising, Qi-Tonifying and Spleen-Strengthening, Heat-Clearing and Phlegm-Resolving, and Yin-Nourishing and Blood-Enriching clusters. All four flagship Lift ≥ 1.40 pairs persisted in 27/27 parameter cells of the sensitivity grid and in 100% of 200 Bootstrap resamples.",
]));
C.push(rp([
  { t: "(4) Conclusions: ", b: true },
  "A dual-track pipeline that couples Apriori association mining with complex-network analysis recovers the canonical \"nourish the heart, tranquilise the spirit, supplement qi and fortify the spleen\" architecture of insomnia TCM prescribing, identifies several high-Lift herb pairs as candidate synergistic combinations, and partitions the prescription space into four functional modules that align with classical syndrome categories. The full dataset, ontology and analysis scripts are released as a single-command reproducible package; prospective randomised controlled trials are needed to translate the computational findings into clinical evidence.",
]));
C.push(rp([
  { t: "Keywords: ", b: true },
  "insomnia; traditional Chinese medicine; data mining; Apriori algorithm; association rules; complex network analysis; Louvain community detection; Leiden algorithm; reproducible research; computational pharmacology",
]));

C.push(new Paragraph({ children: [new PageBreak()] }));

// ═══════════════════════════════════════════════════════════════════════
// 1. Introduction
// ═══════════════════════════════════════════════════════════════════════
C.push(h1("1. Introduction"));
C.push(p("Insomnia is a chronic disturbance of sleep–wake regulation characterised by difficulty initiating or maintaining sleep, early-morning awakening and unrefreshing rest. A recent systematic literature review estimated that more than 850 million adults globally meet a clinically meaningful insomnia definition, with a marked female and age-related skew [1]. The downstream burden — cognitive impairment, depression, cardiovascular risk and elevated suicidality — has shifted insomnia from a quality-of-life issue to a frontline public-health concern."));
C.push(p("Cognitive-behavioural therapy for insomnia (CBT-I) is the first-line recommendation in both European and North American guidelines [2,3]. Long-term pharmacological control, however, remains contentious: a recent network meta-analysis questioned the durable efficacy of benzodiazepines and Z-drugs for chronic insomnia [4], and a parallel network synthesis of psychological and pharmacological options reached compatible conclusions [5]. Against this backdrop traditional Chinese medicine (TCM) has attracted growing computational attention. A global guideline mapping exercise documented the formal inclusion of TCM modalities for insomnia across multiple jurisdictions [6]; a network meta-analysis covering 109 randomised controlled trials reported tangible improvements in the Pittsburgh Sleep Quality Index and favourable safety profiles for several proprietary multi-herb formulations [7]; meta-analytic syntheses of Suanzaoren decoction [8], commercial Zao Ren An Shen preparations [32] and the single herb Suan Zao Ren [33] provide convergent evidence."),
);
C.push(p("Two methodological obstacles, however, have constrained the field. First, clinical TCM data are highly individualised: prescriptions follow physician-specific compositional logic, and the lexical surface is contaminated by synonyms, processing-method prefixes and provenance qualifiers, producing sparse high-dimensional records in which raw co-occurrence statistics frequently overstate the relevance of broadly used adjunct herbs [9,10]. Second, the literature is dominated by single-method designs: studies typically apply either association rule mining or clustering, rarely both, and rarely report the parameter sensitivity or sample-level stability that a reviewer would expect from a quantitative pipeline."));
C.push(p("The Apriori algorithm [11] remains the canonical engine for frequent-itemset discovery in sparse transactional data and has been widely deployed in disease-specific TCM mining studies [12]. Complementary insights come from graph-theoretic representations, in which the prescription corpus is encoded as a weighted graph and node centrality [39], modularity-optimising community detection [13,37] and Leiden refinement [14] expose global topology that itemset mining cannot. Recent work that combined network and clustering perspectives on insomnia symptom phenotypes [15] illustrates the value of multi-method designs."));
C.push(p("Building on this foundation, we report a dual-track pipeline that couples Apriori association mining with weighted-network analysis on a single de-identified insomnia prescription corpus. Five contributions distinguish the present work from earlier studies. First, the analysis rests on an ontology-normalised dataset of 986 prescriptions, 317 canonical herb entities and 14,150 cleaned records. Second, Apriori and weighted-network analysis are run in parallel and cross-validated. Third, parameter robustness is examined over a 3 × 3 × 3 grid (27 settings) and complemented by Bootstrap resampling. Fourth, the entire pipeline — eleven Python scripts, the conda environment and the manuscript source — is released as a single-command (\"make all\") reproducibility package. Fifth, every quantitative finding is mapped, with explicit caveats, onto both classical formulary theory and contemporary neuropharmacology."));

// ═══════════════════════════════════════════════════════════════════════
// 2. Materials and Methods
// ═══════════════════════════════════════════════════════════════════════
C.push(h1("2. Materials and Methods"));

C.push(h2("2.1. Data Sources"));
C.push(p("Robust frequent-itemset extraction and reliable topology characterisation both require a high-quality, low-bias and geographically diverse corpus. We assembled an integrated, manually curated insomnia prescription dataset that draws on three classes of source without recourse to any institutional electronic medical record system."));
C.push(h3("2.1.1. Source Categories"));
C.push(p("Source provenance falls into three classes (an explicit inventory is provided in Supplementary Table S1). The first class comprises peer-reviewed clinical research and prescription literature on insomnia, retrieved from China National Knowledge Infrastructure (CNKI), Wanfang Data, VIP and PubMed; the second class consists of classical formulary databases — primarily the Database of Chinese Formulae maintained by the China National Population and Health Scientific Data Sharing Platform — together with historical canonical texts queried through period-specific synonyms for insomnia (\"bu de wo\", \"bu mei\", \"mu bu ming\"); the third class is a research-curated archive of clinical prescriptions that had already been de-identified before entering the present analysis, retaining only herb composition and a synthetic identifier."));
C.push(h3("2.1.2. Field Minimisation and De-identification"));
C.push(rp([
  "After cross-source consolidation, merging of duplicates and field standardisation, the dataset is stored in the long-format transactional file ",
  { t: "anonymized_prescription_transactions.csv", i: true },
  " containing only two atomic fields: ",
  { t: "prescription_id", i: true },
  " (an opaque, irreversibly mapped identifier) and ",
  { t: "herb", i: true },
  " (the original Chinese herb expression). No direct identifier (name, government identification number, contact details) and no quasi-identifier (visit date, institution-internal record number, physician identity, geographic indicator) is retained. The mapping table linking opaque identifiers to original sources is kept under encryption by the study team and is not distributed with the public dataset, so re-identification of any individual patient, prescriber or institution from the released file is not feasible by design.",
]));
C.push(h3("2.1.3. Inclusion and Exclusion Criteria"));
C.push(p("Records were retained when the prescription explicitly targeted primary insomnia or the related TCM syndrome bu mei, the composition was complete and structurally extractable, and the source was traceable to a published article, a recognised database or a de-identified research archive. Records were excluded when the composition was incomplete or contained only a single herb, when the indication had no demonstrable link to insomnia, or when the same prescription appeared in more than one source (one instance retained)."));
C.push(h3("2.1.4. Final Dataset Size"));
C.push(rp([
  "The unfiltered transactional table comprised ",
  { t: "14,178", b: true }, " (prescription, herb) records spanning ",
  { t: "986", b: true }, " prescriptions and ",
  { t: "326", b: true },
  " raw herb expressions; the ",
  { t: "prescription_id", i: true }, " and ", { t: "herb", i: true },
  " fields had no missing values and no fully duplicated rows. After the preprocessing steps described in Section 2.2 — ontology-driven normalisation (24 rules; 642 records merged, equivalent to ",
  { t: "4.53%", b: true },
  " of the raw table) and intra-prescription deduplication (28 redundant rows removed) — the dataset that entered Apriori and network analysis consisted of ",
  { t: "986 prescriptions, 317 canonical herb entities and 14,150 transactional records", b: true },
  ", with a mean of ", { t: "14.35 ± 2.94", b: true },
  " herbs per prescription (median 14; range 6–23 herbs).",
]));

C.push(h2("2.2. Preprocessing and Ontology Normalisation"));
C.push(rp([
  "Preprocessing proceeded in four steps. (i) Completeness audit: both fields were screened for missing values and for fully duplicated ",
  { t: "(prescription_id, herb)", i: true },
  " pairs; the count of each was zero. (ii) Ontology-driven normalisation: 24 mapping rules consolidating processing-method suffixes (e.g., chao bai zhu → bai zhu), pharmacopoeial synonyms (ye jiao teng → shou wu teng), provenance prefixes (chuan niu xi / huai niu xi → niu xi) and preparation prefixes (cu xiang fu → xiang fu) were applied. The mapping consolidated 642 records (4.5281%) and reduced the herb-expression vocabulary from 326 to 317. (iii) Intra-prescription deduplication: 28 rows in which a normalised herb appeared more than once within the same prescription were collapsed. (iv) Quality control: a second pass confirmed that no residual unnormalised aliases remained. Pre- and post-cleaning counts are summarised in Table 1.",
]));
C.push(caption("Table 1. Dataset metrics before and after preprocessing."));
C.push(tbl([
  ["Metric", "Pre-cleaning", "Post-cleaning", "Note"],
  ["Prescriptions", "986", "986", "Unchanged — no duplicate prescription identifiers"],
  ["Herb expressions", "326", "317", "Nine expressions consolidated by the 24-rule ontology"],
  ["Transactional records", "14,178", "14,150", "Twenty-eight intra-prescription redundancies removed"],
  ["Records affected by normalisation", "—", "642", "4.53% of the raw table"],
  ["Residual unnormalised aliases", "—", "0", "Second-pass quality check"],
  ["Herbs per prescription (mean ± SD)", "14.38 ± 2.94", "14.35 ± 2.94", "Median 14; range 6–23"],
  ["Fully duplicated (id, herb) rows", "0", "0", "None in either state"],
], [2200, 1600, 1600, 3626]));

C.push(h2("2.3. Prescription–Herb Transaction Matrix"));
C.push(rp([
  "We encoded the cleaned corpus as a Boolean transaction matrix ",
  { t: "M ∈ {0, 1}^{986 × 317}", i: true },
  ", with row ", { t: "i", i: true },
  " denoting a prescription, column ", { t: "j", i: true },
  " a canonical herb and ", { t: "M[i,j] = 1", i: true },
  " when herb ", { t: "j", i: true },
  " was present in prescription ", { t: "i", i: true },
  ". The column-wise sum gives the global frequency of each herb. The empirical herb frequency distribution exhibits a long tail: a Pareto-style cumulative-coverage analysis (Figure 2) showed that 43 herbs (13.56% of all canonical entities) together account for 80% of the cumulative usage, providing a natural pruning horizon for both Apriori and downstream network analysis.",
]));

C.push(h2("2.4. Apriori Association Rule Mining"));
C.push(p("Frequent itemsets up to size four were generated with the Apriori algorithm [11]. We evaluated rules on three standard metrics: support, Support(X → Y) = |X ∪ Y| / N; confidence, Confidence(X → Y) = Support(X ∪ Y) / Support(X); and Lift, Lift(X → Y) = Confidence(X → Y) / Support(Y). A Lift exceeding unity indicates a positive co-occurrence beyond chance, whereas Lift = 1 corresponds to statistical independence; including Lift in the filter is essential here because indiscriminate harmoniser herbs (notably Gan Cao) generate inflated confidence values that are not pharmacologically informative."));
C.push(p("Baseline thresholds were min_support = 0.20 (the joint occurrence had to involve at least ≈ 197 prescriptions), min_confidence = 0.60 and Lift > 1.0. The algorithm was implemented through the apriori and association_rules functions of mlxtend 0.23.0 [40] running on Python 3.11. To assess the influence of these thresholds we re-ran the procedure on a full 3 × 3 × 3 grid — min_support ∈ {0.15, 0.20, 0.25}, min_confidence ∈ {0.50, 0.60, 0.70} and Lift threshold ∈ {1.0, 1.2, 1.4} — and recorded both the number of surviving binary rules and the persistence of four flagship strong-Lift pairs (Section 3.7 and Table 6)."));

C.push(h2("2.5. Co-occurrence Network and Centrality"));
C.push(rp([
  "We represented the prescription corpus as a weighted, undirected graph ",
  { t: "G = (V, E)", i: true },
  ". Each node ", { t: "v ∈ V", i: true },
  " is one of the 317 canonical herbs; an edge connects two herbs whenever they co-occur in at least one prescription, and the edge weight equals the number of prescriptions in which they co-appear. Each edge additionally carries a Lift attribute, permitting downstream Lift-weighted filtering. We computed degree, betweenness and closeness centrality [39] with NetworkX 3.1 [36], and assessed small-world organisation [38] through the mean clustering coefficient, the mean shortest-path length and the diameter, contrasting the observed values with size- and density-matched Erdős–Rényi controls.",
]));

C.push(h2("2.6. Community Detection"));
C.push(rp([
  "Three modularity-optimising community-detection algorithms were applied in parallel. The Louvain method [13] served as the primary algorithm; the Greedy Modularity heuristic implemented in NetworkX [37] and the Leiden algorithm [14] (CPM quality function, resolution parameter γ = 1.0, ",
  { t: "leidenalg", i: true },
  " 0.11) served as comparators. Random seeds were fixed at 42 throughout. Modularity ",
  { t: "Q", i: true },
  " is reported per algorithm, and pairwise agreement is quantified through Adjusted Rand Index (ARI) and Normalised Mutual Information (NMI) using ",
  { t: "scikit-learn", i: true },
  " 1.3.0.",
]));

C.push(h2("2.7. Reproducibility and Computing Environment"));
C.push(rp([
  "All computations were performed in Python 3.11.6 on Ubuntu 22.04 (Intel Xeon Gold, 64 GB RAM). Core dependencies were ",
  { t: "pandas", i: true }, " 2.0.3, ",
  { t: "numpy", i: true }, " 1.24.4, ",
  { t: "scipy", i: true }, " 1.11.2, ",
  { t: "mlxtend", i: true }, " 0.23.0 [40], ",
  { t: "networkx", i: true }, " 3.1 [36], ",
  { t: "python-louvain", i: true }, " 0.16, ",
  { t: "leidenalg", i: true }, " 0.11, ",
  { t: "scikit-learn", i: true }, " 1.3.0, ",
  { t: "matplotlib", i: true }, " 3.7.2 and ",
  { t: "seaborn", i: true },
  " 0.12.2. Eleven ordered scripts (step1_data_audit.py through step11_reproducibility_report.py) drive the pipeline end-to-end, write thirteen intermediate CSV / JSON artefacts, six tables and eight figures, and generate an HTML reproducibility report that asserts every headline number against the manuscript values. The package is released under MIT (code) and CC-BY 4.0 (data, tables, figures), and is permanently archived on Zenodo with the DOI cited in the Data Availability Statement.",
]));

// ═══════════════════════════════════════════════════════════════════════
// 3. Results
// ═══════════════════════════════════════════════════════════════════════
C.push(h1("3. Results"));

C.push(h2("3.1. Descriptive Statistics"));
C.push(p("The cleaned dataset comprises 986 prescriptions and 317 canonical herb entities, totalling 14,150 transactional records. Prescription length follows a near-normal distribution (mean 14.35 ± 2.94; median 14; range 6–23), consistent with reported norms for insomnia prescribing in routine TCM practice."));

C.push(h2("3.2. Herb Frequency"));
C.push(p("Frequency was dominated by the two compounds that anchor classical insomnia formularies (Table 2). Gan Cao (Glycyrrhizae Radix et Rhizoma) and Suan Zao Ren (Ziziphi Spinosae Semen) together accounted for 11.11% of the cumulative usage; six of the top ten herbs were nervine sedatives, including Long Gu (Os Draconis) and Mu Li (Ostreae Concha) as mineral-class sedatives. Nine of the top ten herbs are reported to enter the Heart meridian and five enter the Liver meridian, a distribution that closely mirrors the classical \"the Heart houses the Spirit\" rationale of insomnia therapy."));
C.push(caption("Table 2. Ten most frequent canonical herbs."));
C.push(tbl([
  ["Rank", "Herb (Pinyin)", "Latin pharmacognostic name", "Frequency", "Prevalence (%)", "Cumulative (%)"],
  ["1",  "Gan Cao",     "Glycyrrhizae Radix et Rhizoma",       "806", "81.74", "5.70"],
  ["2",  "Suan Zao Ren","Ziziphi Spinosae Semen",              "766", "77.69", "11.11"],
  ["3",  "He Huan Pi",  "Albiziae Cortex",                     "503", "51.01", "14.66"],
  ["4",  "Shou Wu Teng","Polygoni Multiflori Caulis",          "501", "50.81", "18.20"],
  ["5",  "Fu Shen",     "Poria cum Radice Pini",               "462", "46.86", "21.47"],
  ["6",  "Yuan Zhi",    "Polygalae Radix",                     "461", "46.75", "24.73"],
  ["7",  "Wu Wei Zi",   "Schisandrae Chinensis Fructus",       "437", "44.32", "27.82"],
  ["8",  "Long Gu",     "Os Draconis",                         "429", "43.51", "30.85"],
  ["9",  "Mu Li",       "Ostreae Concha",                      "425", "43.10", "33.85"],
  ["10", "Fu Ling",     "Poria",                               "422", "42.80", "36.83"],
], [600, 1100, 2400, 950, 1100, 1300]));
C.push(...fig(path.join(FIG, "figure2_pareto_top30.png"),
  "Figure 2. Pareto distribution of the 30 most frequent herbs. The orange bars highlight the ten leading herbs; the red line marks the cumulative share of total usage, with the dashed reference at 80%. Together the top thirty herbs account for 67.74% of the cumulative usage."));

C.push(h2("3.3. Apriori Association Rules"));
C.push(p("At the baseline triple constraint the algorithm produced 136 frequent itemsets (19 one-, 52 two-, 51 three- and 14 four-itemsets). After confidence and Lift filtering, 247 rules survived, 34 of which were binary. Three behavioural archetypes emerge from the binary set. The high-support–low-Lift archetype is exemplified by Suan Zao Ren ↔ Gan Cao (support 64.30%, Lift 1.01), where the joint occurrence reflects ubiquitous use of both rather than pharmacological pairing. The high-confidence directional archetype is exemplified by Wu Wei Zi → Suan Zao Ren (confidence 90.16%) and Fu Shen → Suan Zao Ren (90.04%), in which Suan Zao Ren operates as the central sedative hub. The high-Lift functional archetype is exemplified by Bai Zhu ↔ Fu Ling (Lift 1.99) and Long Gu ↔ Mu Li (Lift 1.84), in which the two herbs preferentially co-appear well above the chance expectation. Table 3 reports a representative selection from the 34 binary rules."));
C.push(caption("Table 3. Selected Apriori binary association rules (full table in Supplementary Materials)."));
C.push(tbl([
  ["LHS", "RHS", "Support (%)", "Confidence (%)", "Lift"],
  ["Gan Cao",      "Suan Zao Ren",  "64.30", "78.66", "1.01"],
  ["Suan Zao Ren", "Gan Cao",       "64.30", "82.77", "1.01"],
  ["Shou Wu Teng", "Suan Zao Ren",  "44.52", "87.62", "1.13"],
  ["He Huan Pi",   "Suan Zao Ren",  "42.70", "83.70", "1.08"],
  ["Fu Shen",      "Suan Zao Ren",  "42.19", "90.04", "1.16"],
  ["Yuan Zhi",     "Suan Zao Ren",  "41.89", "89.59", "1.15"],
  ["Wu Wei Zi",    "Suan Zao Ren",  "39.96", "90.16", "1.16"],
  ["Shou Wu Teng", "He Huan Pi",    "38.64", "76.05", "1.49"],
  ["Mu Li",        "He Huan Pi",    "37.12", "86.12", "1.69"],
  ["Long Gu",      "He Huan Pi",    "36.71", "84.38", "1.65"],
  ["Long Gu",      "Mu Li",         "34.58", "79.49", "1.84"],
  ["Bai Zhu",      "Fu Ling",       "29.31", "85.00", "1.99"],
  ["Bai Zi Ren",   "Yuan Zhi",      "25.66", "72.70", "1.55"],
], [1700, 1700, 1500, 1500, 2626]));
C.push(...fig(path.join(FIG, "figure3_apriori_bubble.png"),
  "Figure 3. Apriori binary association rules in the support–confidence–lift space. Marker size scales with Lift; rules with Lift ≥ 1.40 are annotated with the herb pair and the Lift value."));

C.push(h2("3.4. Network Topology"));
C.push(p("The full co-occurrence graph carried 317 nodes and 11,239 edges, with a mean degree of 70.91, a mean clustering coefficient of 0.83, a network diameter of 3 and a density of 0.224. The clustering–path-length profile is consistent with classical small-world organisation [38]. Figure 4 visualises the Top-30 sub-graph after Lift filtering at the 1.05 threshold, which suppresses non-specific connections involving universal harmoniser herbs and exposes two tightly knit modules. One module is built around Suan Zao Ren, He Huan Pi, Shou Wu Teng, Fu Shen, Yuan Zhi, Wu Wei Zi, Long Gu and Mu Li; the other groups Gan Cao, Fu Ling, Bai Zhu, Dang Gui, Dang Shen, Ren Shen, Long Yan Rou, Mu Xiang, Da Zao and Huang Qi."));
C.push(...fig(path.join(FIG, "figure4_core_network.png"),
  "Figure 4. Core co-occurrence network for the 30 most frequent herbs. Edges with Lift below 1.05 have been suppressed to emphasise structurally informative connections. Node size scales with raw frequency."));

C.push(h2("3.5. Centrality Profiles"));
C.push(p("Degree and closeness centrality identified Gan Cao (DC = 0.987; CC = 0.988) and Suan Zao Ren (DC = 0.968; CC = 0.969) as the network's twin hubs, followed by He Huan Pi, Shou Wu Teng, Wu Wei Zi, Fu Shen, Mu Li, Yuan Zhi, Fu Ling and Long Gu (Table 4). Betweenness centrality, in contrast, returned a more dispersed Top-10 led by Long Yan Rou (BC = 0.0192), Mu Xiang (0.0181) and Shi Chang Pu (0.0166) — moderate-frequency herbs that nevertheless lie on the shortest paths bridging functional modules. We refer to these as candidate bridge nodes (Figure 5). A pairwise Lift heatmap restricted to the top fifteen herbs (Figure 6) confirms that the high-Lift signal is concentrated in six pairs: Bai Zhu – Fu Ling (1.99), Long Gu – Mu Li (1.84), He Huan Pi – Mu Li (1.69), He Huan Pi – Long Gu (1.65), Bai Zi Ren – Yuan Zhi (1.55) and He Huan Pi – Shou Wu Teng (1.49)."));
C.push(caption("Table 4. Top ten herbs by degree (DC), betweenness (BC) and closeness (CC) centrality."));
C.push(tbl([
  ["Rank", "DC herb", "DC", "BC herb", "BC", "CC herb", "CC"],
  ["1",  "Gan Cao",      "0.987", "Long Yan Rou", "0.0192", "Gan Cao",      "0.988"],
  ["2",  "Suan Zao Ren", "0.968", "Mu Xiang",     "0.0181", "Suan Zao Ren", "0.969"],
  ["3",  "He Huan Pi",   "0.911", "Shi Chang Pu", "0.0166", "He Huan Pi",   "0.919"],
  ["4",  "Shou Wu Teng", "0.908", "Nv Zhen Zi",   "0.0166", "Shou Wu Teng", "0.916"],
  ["5",  "Wu Wei Zi",    "0.902", "Bai Shao",     "0.0163", "Wu Wei Zi",    "0.911"],
  ["6",  "Fu Shen",      "0.899", "Dang Shen",    "0.0161", "Fu Shen",      "0.908"],
  ["7",  "Mu Li",        "0.886", "Bei Sha Shen", "0.0146", "Mu Li",        "0.898"],
  ["8",  "Yuan Zhi",     "0.877", "Huang Qi",     "0.0146", "Yuan Zhi",     "0.890"],
  ["9",  "Fu Ling",      "0.867", "Ban Xia",      "0.0145", "Fu Ling",      "0.883"],
  ["10", "Long Gu",      "0.858", "Chen Pi",      "0.0144", "Long Gu",      "0.875"],
], [600, 1400, 1100, 1400, 1300, 1400, 1826]));
C.push(...fig(path.join(FIG, "figure5_centrality_top10.png"),
  "Figure 5. Degree, betweenness and closeness centrality for the ten most frequent herbs. Betweenness values have been multiplied by 30 to allow visual comparison with the other two normalised centralities."));
C.push(...fig(path.join(FIG, "figure6_lift_heatmap.png"),
  "Figure 6. Pairwise Lift heatmap for the fifteen most frequent herbs. Cells with Lift ≥ 1.40 are outlined in black: Bai Zhu – Fu Ling (1.99); Long Gu – Mu Li (1.84); He Huan Pi – Mu Li (1.69); He Huan Pi – Long Gu (1.65); Bai Zi Ren – Yuan Zhi (1.55); He Huan Pi – Shou Wu Teng (1.49)."));

C.push(h2("3.6. Community Structure"));
C.push(p("All three algorithms (Louvain, Greedy Modularity, Leiden) returned four communities on the full 317-node graph, with respective modularities of 0.0378, 0.0361 and 0.0385. The relatively low Q values reflect the pervasive co-occurrence of universal harmonisers (Gan Cao, Suan Zao Ren) with virtually every functional class, which softens the inter-community boundary in the raw co-occurrence space. Despite this numerical compression, the four modules carry coherent functional interpretations (Table 5) that align with the classical syndrome categorisation of insomnia: a Sedative–Tranquilising cluster, a Qi-Tonifying and Spleen-Strengthening cluster, a Heat-Clearing and Phlegm-Resolving cluster, and a Yin-Nourishing and Blood-Enriching cluster."));
C.push(caption("Table 5. Four functional communities recovered by Louvain on the full graph."));
C.push(tbl([
  ["Module", "Core members (descending frequency)", "Interpretation", "Plausible syndrome", "Data support"],
  ["A. Sedative–Tranquilising",
   "Suan Zao Ren, He Huan Pi, Shou Wu Teng, Fu Shen, Yuan Zhi, Wu Wei Zi, Long Gu, Mu Li, Bai Zi Ren, Shi Chang Pu",
   "Nourishment of the heart and tranquilisation of the spirit (with mineral-class sedation)",
   "Heart-spirit disquiet; liver–heart blood deficiency",
   "Strong (He Huan Pi – Mu Li, Long Gu – Mu Li, Bai Zi Ren – Yuan Zhi all carry Lift ≥ 1.40)"],
  ["B. Qi-Tonifying and Spleen-Strengthening",
   "Gan Cao, Fu Ling, Dang Gui, Bai Zhu, Long Yan Rou, Huang Qi, Dang Shen, Da Zao, Mu Xiang, Ren Shen",
   "Replenishment of qi and fortification of the spleen with blood production",
   "Concurrent heart and spleen deficiency",
   "Strong (Bai Zhu – Fu Ling carries Lift = 1.99; mirrors classical Gui Pi Tang composition)"],
  ["C. Heat-Clearing and Phlegm-Resolving",
   "Huang Bai, Ban Xia, Zhu Ru, Mu Dan Pi, Zhi Shi, Huang Lian, Zhi Zi, Hou Po, Huang Qin, Chai Hu",
   "Clearance of heat with phlegm resolution and stagnation release",
   "Phlegm-heat disturbance; liver constraint progressing to fire",
   "Partial (functional coherence is clear, but no within-module Lift ≥ 1.40 pair was observed inside the Top-15 frame)"],
  ["D. Yin-Nourishing and Blood-Enriching",
   "Bai Shao, Sheng Di Huang, Mai Dong, Bei Sha Shen, Chuan Xiong, Zhi Mu, Nv Zhen Zi, Yu Zhu, Shan Zhu Yu, E Jiao",
   "Yin replenishment with heat clearance and blood-nourishing softening of the liver",
   "Yin deficiency with effulgent fire; liver–kidney depletion",
   "Partial (community boundaries are crisp; pairwise Lifts cluster near unity and call for external validation)"],
], [1500, 2400, 1700, 1700, 1726]));

C.push(h2("3.7. Parameter Sensitivity"));
C.push(p("We exhaustively swept the 3 × 3 × 3 grid of (min_support, min_confidence, Lift threshold). At every one of the 27 settings the four flagship pairs — Bai Zhu – Fu Ling, Long Gu – Mu Li, He Huan Pi – Mu Li and He Huan Pi – Long Gu — survived; the Top-10 frequency ordering was identical to the baseline ordering across every cell of the grid. A representative subset of the grid is presented in Table 6 and the full surface is shown in Figure 7."));
C.push(caption("Table 6. Apriori sensitivity over a representative 9-point subset of the 27-cell grid."));
C.push(tbl([
  ["min_support", "min_confidence", "Lift threshold", "Binary rules", "Flagship pairs present", "Top-10 ordering"],
  ["0.15", "0.50", "1.0", "79", "4 / 4", "concordant"],
  ["0.15", "0.60", "1.0", "42", "4 / 4", "concordant"],
  ["0.15", "0.70", "1.0", "39", "4 / 4", "concordant"],
  ["0.20", "0.50", "1.0", "49", "4 / 4", "concordant"],
  ["0.20", "0.60", "1.0 (baseline)", "34", "4 / 4", "concordant"],
  ["0.20", "0.60", "1.4", "9",  "4 / 4", "concordant"],
  ["0.25", "0.50", "1.0", "28", "4 / 4", "concordant"],
  ["0.25", "0.60", "1.0", "19", "4 / 4", "concordant"],
  ["0.25", "0.60", "1.4", "7",  "4 / 4", "concordant"],
], [1500, 1600, 1600, 1500, 1500, 1326]));
C.push(...fig(path.join(FIG, "figure7_sensitivity.png"),
  "Figure 7. Number of binary rules across the 27-cell sensitivity grid. Lines distinguish confidence thresholds, marker size encodes the Lift threshold and the horizontal axis represents min_support."));

C.push(h2("3.8. Bootstrap Stability and Algorithmic Concordance"));
C.push(p("Two hundred Bootstrap resamples drawn at 80% prescription coverage were used to probe sample-level stability. Top-10 herb membership matched the baseline in 100% of the resamples; each of the four flagship Lift ≥ 1.40 pairs persisted in 100% of the resamples, as did the two secondary pairs Bai Zi Ren – Yuan Zhi and He Huan Pi – Shou Wu Teng. The three community-detection algorithms reached pairwise ARI values of 0.41 (Louvain–Greedy), 0.51 (Louvain–Leiden) and 0.46 (Greedy–Leiden), with parallel NMI values of 0.40, 0.48 and 0.44 (Figure 8). The moderate ARI / NMI levels reflect the soft module boundaries already noted in Section 3.6; the algorithms agree on the four-module partition at the global scale but place individual peripheral herbs differently."));
C.push(...fig(path.join(FIG, "figure8_community_consistency.png"),
  "Figure 8. Pairwise Adjusted Rand Index and Normalised Mutual Information across the three community-detection algorithms."));

// ═══════════════════════════════════════════════════════════════════════
// 4. Discussion
// ═══════════════════════════════════════════════════════════════════════
C.push(h1("4. Discussion"));

C.push(h2("4.1. Frequency Profile and the Classical Heart-Spirit Rationale"));
C.push(p("The two herbs that top the frequency table — Gan Cao and Suan Zao Ren — are formulary archetypes: Gan Cao is the canonical harmoniser introduced into almost every multi-herb prescription, whereas Suan Zao Ren is the sovereign ingredient of Suan Zao Ren decoction (《金匮要略》/ Jin Gui Yao Lue, Han dynasty). The remaining sedative members of the Top-10 — He Huan Pi, Shou Wu Teng, Fu Shen, Yuan Zhi, Long Gu and Mu Li — collectively account for six of the ten leading entries and define the operational core of insomnia therapy in this corpus. The dominance of Heart-meridian herbs (9 / 10) is consistent with the classical aphorism that \"the Heart houses the Spirit\". Module B reproduces the canonical composition of Gui Pi Tang (Yan Yong-He, Ji Sheng Fang, Song dynasty), and the systematic synthesis of 109 RCTs reviewed in [7] reports that Gui Pi Tang-type formulations confer measurable benefit in patients with concurrent heart–spleen deficiency."));

C.push(h2("4.2. Three Archetypes of Pair-Level Synergy"));
C.push(p("Within the 34 binary rules we recovered three behavioural archetypes. The first, exemplified by Suan Zao Ren ↔ Gan Cao (support 64.30%, Lift 1.01), is a universal-pairing archetype: the two herbs are ubiquitous, so their joint presence in two-thirds of all prescriptions does not represent pharmacological synergy. The second, exemplified by Bai Zhu ↔ Fu Ling (Lift 1.99), is a high-Lift functional-pair archetype, in which two herbs preferentially co-occur. Bai Zhu fortifies the spleen and dries dampness; Fu Ling drains dampness and quietens the spirit; jointly the pair forms the dampness-clearing core of Gui Pi Tang and supplies the qi–blood substrate that anchors the broader formulation. The third archetype is the three-herb mineral-tranquilising sub-graph composed of Long Gu, Mu Li and He Huan Pi, in which every pairwise Lift exceeds 1.65. Long Gu and Mu Li are the two principal mineral sedatives in classical formularies; He Huan Pi adds a vegetal anxiolytic colouring. We additionally recover Bai Zi Ren ↔ Yuan Zhi (Lift 1.55), a balanced moistening–opening pair often invoked under the classical heuristic of \"complementary natures with reinforcing functions\"."));

C.push(h2("4.3. Cross-Scale Mapping to Contemporary Neuropharmacology"));
C.push(p("Modern mechanistic studies offer partial molecular correlates for the modules we recovered, though they cannot establish causal correspondence with the statistical pairings. For the Sedative–Tranquilising module, integrated network-pharmacology and molecular-docking analyses of Suan Zao Ren decoction [18] and UPLC-Q-TOF-MS multi-tissue metabolomics in p-chlorophenylalanine insomnia rats [19] suggest multi-pathway, multi-target sedative effects centred on Suan Zao Ren. Mechanistic work has further implicated flavonoid restructuring of the gut–brain axis in chronic restraint stress [20], GABA-A receptor activation [21] and modulation of the hypothalamic GABA / Glu balance with concomitant changes in Lactobacillus johnsonii abundance [35]; single-component studies of Ziziphi Spinosae oil terpenoids [22] and the saponin jujuboside A acting on the paraventricular thalamic GABAergic system [34] are mutually compatible. For Yuan Zhi, the protective and HPA-axis modulating activities reviewed in [23] and the multi-neurotransmitter shifts in the Suan Zao Ren–Yuan Zhi pair [24] provide an indirect mechanistic context for the high-confidence Suan Zao Ren-centred edges that dominate Section 3.3. A recent biophysical study of Long Gu-derived nanoparticles [25] proposes a calcium-dependent enterochromaffin / vagal-NTS pathway underpinning the mineral-tranquilising trio of Long Gu, Mu Li and He Huan Pi. For the He Huan Pi – Shou Wu Teng pair (Lift 1.49), immobilised 5-HT1A receptor affinity chromatography [26] identifies catechin and 2,3,5,4'-tetrahydroxystilbene-2-O-β-D-glucoside as candidate active ligands. The GABAergic axis itself remains a parsimonious common substrate at the systems level [27], and integrative analyses combining network pharmacology with public expression repositories illustrate the multi-target nature of TCM insomnia treatments in general [28]. We stress that these molecular correlates remain plausibility arguments: the present study uses no biological assays and reports no causal inference."));

C.push(h2("4.4. Methodological Position and Future Directions"));
C.push(p("Three methodological choices distinguish this work from prior insomnia-TCM mining studies. We coupled Apriori with weighted-network analysis rather than relying on either family alone; we tested the durability of the headline findings under a 27-point parameter grid and 200 Bootstrap resamples; and we packaged the entire pipeline as a one-command, version-controlled reproducibility artefact. The pipeline can be extended in several directions. Dose-weighted association mining — which our Boolean transactional encoding does not support — could resolve the question of whether functional pair-level synergies are dose-modulated [16]. Multi-graph convolutional networks [30] and graph-neural prescription similarity [31] can carry the present static topology into a learned prescription-recommendation framework, and recent multi-graph embedding pipelines with data augmentation [17] show how data sparsity can be mitigated in this direction. Finally, the AI-assisted literature exploration approaches summarised in [29] offer a route to scaling the de-identification ontology and the bibliometric backbone used in the present study [10]."));

C.push(h2("4.5. Limitations"));
C.push(p("Several caveats apply. (i) The Boolean transactional encoding ignores dose: two herbs paired at high frequency but radically different dosages collapse to identical co-occurrences. (ii) Patient-level syndrome differentiation and four-pillar diagnostic information are not represented in the corpus, limiting prescription–phenotype mapping. (iii) The low absolute modularity Q (≈ 0.04) reflects the genuinely soft community boundaries imposed by universal harmoniser herbs; future work could employ Lift-weighted or k-core refinement to sharpen these boundaries [14]. (iv) The strong synergistic combinations identified here (Bai Zhu – Fu Ling, Long Gu – Mu Li – He Huan Pi, Bai Zi Ren – Yuan Zhi) are computational candidates rather than validated therapeutic recommendations: prospective randomised controlled trials are needed to establish clinical efficacy and safety, in line with the cautionary stance taken by recent insomnia-TCM systematic reviews [7,8]. (v) The corpus represents a de-identified curated sample rather than an unbiased clinical census; external validation on larger, multi-centre samples is desirable before generalising the findings."));

// ═══════════════════════════════════════════════════════════════════════
// 5. Conclusions
// ═══════════════════════════════════════════════════════════════════════
C.push(h1("5. Conclusions"));
C.push(p("A dual-track pipeline that pairs Apriori association rule mining with weighted-network analysis was applied to 986 de-identified insomnia prescriptions covering 317 canonical herbs and 14,150 transactional records. Frequency profiling and centrality analysis confirmed a sedative-dominated prescribing pattern anchored by the twin hubs Gan Cao and Suan Zao Ren. Thirty-four binary association rules were recovered under the triple constraint, with Bai Zhu – Fu Ling (Lift = 1.99) and Long Gu – Mu Li (Lift = 1.84) ranking highest by Lift and Wu Wei Zi → Suan Zao Ren highest by directional confidence (90.16%). A 27-cell sensitivity grid and 200-iteration Bootstrap resampling demonstrated that the four flagship Lift ≥ 1.40 pairs and the Top-10 frequency ordering are highly stable across parameter and sample perturbation. The Louvain, Greedy Modularity and Leiden algorithms each returned four functional communities — Sedative–Tranquilising, Qi-Tonifying and Spleen-Strengthening, Heat-Clearing and Phlegm-Resolving, and Yin-Nourishing and Blood-Enriching — that map cleanly onto the classical syndrome differentiation of insomnia in traditional Chinese medicine. The high-Lift synergistic sub-structures (Bai Zhu – Fu Ling; Long Gu – Mu Li – He Huan Pi; Bai Zi Ren – Yuan Zhi) constitute quantitative restatements of the formulary heuristics of \"fortify-the-spleen and drain dampness\", \"mineral-class tranquilisation\" and \"moistening–opening complementarity\" respectively, and can serve as candidate building blocks for a TCM clinical-decision-support knowledge base. Clinical validation through prospective randomised controlled trials is the obvious next step. The eleven analysis scripts, thirteen intermediate artefacts, six tables and eight figures are released as a single-command reproducibility package archived under a permanent DOI."));

// ═══════════════════════════════════════════════════════════════════════
// Front-matter statements
// ═══════════════════════════════════════════════════════════════════════
C.push(h1("Author Contributions, Funding and Other Statements"));
C.push(h3("Author Contributions"));
C.push(p("Conceptualisation, J.L.; methodology, J.L.; software, J.L.; validation, J.L. and G.S.; formal analysis, J.L.; investigation, J.L.; resources, J.L.; data curation, J.L.; writing — original draft preparation, J.L.; writing — review and editing, G.S.; visualisation, J.L.; supervision, G.S.; project administration, G.S. All authors have read and agreed to the published version of the manuscript."));

C.push(h3("Funding"));
C.push(p("This research received no external funding."));

C.push(h3("Institutional Review Board Statement"));
C.push(p("The study did not involve new interventions in human subjects and did not access any institutional electronic medical record system. The prescription information used in this study was derived from publicly available literature, classical formulary databases and a research-curated, fully de-identified prescription archive. The analytical dataset retained only the two atomic fields prescription_id and herb and contained no information by which an individual patient, prescriber or institution could be identified. Under the Chinese Measures for Ethical Review of Life Science and Medical Research Involving Humans (2023) and equivalent international frameworks, this category of research is generally eligible for ethical review exemption; the corresponding author will provide a formal exemption confirmation prior to acceptance."));

C.push(h3("Informed Consent Statement"));
C.push(p("Because the present analysis used only de-identified records and publicly available sources, individual informed consent was not required."));

C.push(h3("Data Availability Statement"));
C.push(p("The two-field analytical dataset (anonymized_prescription_transactions.csv; 14,178 records / 986 prescriptions) and the 24-rule herb-name normalisation ontology (herb_normalization_map.csv) are openly available together with the eleven analysis scripts and the manuscript source at https://github.com/ourHua/insomnia-tcm-mining. Each tagged release is permanently archived on Zenodo: the v1.0.2 archive carries the DOI 10.5281/zenodo.20250578. By design the released files do not enable re-identification of any patient, prescriber or institution. Aggregated source-class summaries are provided in Supplementary Table S1; the corresponding author will respond to methodological requests under appropriate data-use agreements."));

C.push(h3("Conflicts of Interest"));
C.push(p("The authors declare no conflict of interest."));

// ═══════════════════════════════════════════════════════════════════════
// References
// ═══════════════════════════════════════════════════════════════════════
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(h1("References"));

const REFS = [
  "Benjafield, A.V.; Sert Kuniyoshi, F.H.; Malhotra, A.; Martin, J.L.; Morin, C.M.; Maurer, L.F.; Cistulli, P.A.; Pépin, J.L.; Wickwire, E.M.; medXcloud group. Estimation of the global prevalence and burden of insomnia: A systematic literature review-based analysis. Sleep Med. Rev. 2025, 82, 102121. https://doi.org/10.1016/j.smrv.2025.102121.",
  "Riemann, D.; Espie, C.A.; Altena, E.; et al. The European Insomnia Guideline: An update on the diagnosis and treatment of insomnia 2023. J. Sleep Res. 2023, 32, e14035. https://doi.org/10.1111/jsr.14035.",
  "Edinger, J.D.; Arnedt, J.T.; Bertisch, S.M.; et al. Behavioral and psychological treatments for chronic insomnia disorder in adults: An American Academy of Sleep Medicine clinical practice guideline. J. Clin. Sleep Med. 2021, 17, 255–262. https://doi.org/10.5664/jcsm.8986.",
  "Furukawa, Y.; Sakata, M.; Furukawa, T.A.; Efthimiou, O.; Perlis, M. Initial treatment choices for long-term remission of chronic insomnia disorder in adults: A systematic review and network meta-analysis. Psychiatry Clin. Neurosci. 2024, 78, 646–653. https://doi.org/10.1111/pcn.13730.",
  "Zhang, Y.; Ren, R.; Yang, L.; et al. Comparative efficacy and acceptability of psychotherapies, pharmacotherapies, and their combination for the treatment of adult insomnia: A systematic review and network meta-analysis. Sleep Med. Rev. 2022, 65, 101687. https://doi.org/10.1016/j.smrv.2022.101687.",
  "Ye, Z.; Lai, H.; Ning, J.; et al. Traditional Chinese medicine for insomnia: Recommendation mapping of the global clinical guidelines. J. Ethnopharmacol. 2024, 322, 117601. https://doi.org/10.1016/j.jep.2023.117601.",
  "Ma, N.; Pan, B.; Yang, S.; et al. Comparative efficacy and safety of Chinese patent medicines for primary insomnia: A systematic review and network meta-analysis of 109 randomized trials. J. Ethnopharmacol. 2025, 340, 119254. https://doi.org/10.1016/j.jep.2024.119254.",
  "Liu, X.X.; Ma, Y.Q.; Wang, Y.G.; et al. Suanzaoren decoction for the treatment of chronic insomnia: A systematic review and meta-analysis. Eur. Rev. Med. Pharmacol. Sci. 2022, 26, 8523–8533. https://doi.org/10.26355/eurrev_202211_30388.",
  "Tang, Y.; Li, Z.; Yang, D.; et al. Research of insomnia on traditional Chinese medicine diagnosis and treatment based on machine learning. Chin. Med. 2021, 16, 2. https://doi.org/10.1186/s13020-020-00409-8.",
  "Zhang, C.; Yang, X.; Ye, J.; et al. Mapping the research landscape of traditional Chinese medicine in insomnia management: A bibliometric study (2005–2024). Front. Neurol. 2025, 16, 1614948. https://doi.org/10.3389/fneur.2025.1614948.",
  "Agrawal, R.; Imieliński, T.; Swami, A. Mining association rules between sets of items in large databases. In Proceedings of the 1993 ACM SIGMOD International Conference on Management of Data, Washington, DC, USA, 26–28 May 1993; pp. 207–216. https://doi.org/10.1145/170035.170072.",
  "Yang, J.; Wang, S.; Zhang, Z.; et al. Analysis of medication rule of traditional Chinese medicine in treating depression based on data mining. Heliyon 2024, 10, e39245. https://doi.org/10.1016/j.heliyon.2024.e39245.",
  "Blondel, V.D.; Guillaume, J.L.; Lambiotte, R.; Lefebvre, E. Fast unfolding of communities in large networks. J. Stat. Mech. Theory Exp. 2008, 2008, P10008. https://doi.org/10.1088/1742-5468/2008/10/P10008.",
  "Traag, V.A.; Waltman, L.; van Eck, N.J. From Louvain to Leiden: Guaranteeing well-connected communities. Sci. Rep. 2019, 9, 5233. https://doi.org/10.1038/s41598-019-41695-z.",
  "Hu, F.; Li, L.; Huang, X.; Yan, X.; Huang, P. Symptom distribution regularity of insomnia: Network and spectral clustering analysis. JMIR Med. Inform. 2020, 8, e16749. https://doi.org/10.2196/16749.",
  "Yu, H.; Choi, K.; Kim, J.Y.; Yoo, S. Multi-level association rule mining and network pharmacology to identify the polypharmacological effects of herbal materials and compounds in traditional medicine. Brief. Bioinform. 2025, 26, bbaf328. https://doi.org/10.1093/bib/bbaf328.",
  "Wen, Z.; Dong, Y.; Peng, L.; Zhang, L.; Yan, J. PRDAGE: A prescription recommendation framework for traditional Chinese medicine based on data augmentation and multi-graph embedding. PeerJ Comput. Sci. 2025, 11, e2974. https://doi.org/10.7717/peerj-cs.2974.",
  "Wang, S.; Zhao, Y.; Hu, X. Exploring the mechanism of Suanzaoren decoction in treatment of insomnia based on network pharmacology and molecular docking. Front. Pharmacol. 2023, 14, 1145532. https://doi.org/10.3389/fphar.2023.1145532.",
  "Chu, Y.; Zhang, Y.; Liu, J.; Du, C.; Yan, Y. An integrated liver, hippocampus and serum metabolomics based on UPLC-Q-TOF-MS revealed the therapeutical mechanism of Ziziphi Spinosae Semen in p-chlorophenylalanine-induced insomnia rats. Biomed. Chromatogr. 2024, 38, e5796. https://doi.org/10.1002/bmc.5796.",
  "Yan, Y.; Zhao, N.; Liu, J.; et al. Ziziphi Spinosae Semen flavonoid ameliorates hypothalamic metabolism and modulates gut microbiota in chronic restraint stress-induced anxiety-like behavior in mice. Foods 2025, 14, 828. https://doi.org/10.3390/foods14050828.",
  "Xiao, F.; Shao, S.; Zhang, H.; et al. Neuroprotective effect of Ziziphi Spinosae Semen on rats with p-chlorophenylalanine-induced insomnia via activation of GABA-A receptor. Front. Pharmacol. 2022, 13, 965308. https://doi.org/10.3389/fphar.2022.965308.",
  "Sun, M.; Li, M.; Cui, X.; et al. Terpenoids derived from Semen Ziziphi Spinosae oil enhance sleep by modulating neurotransmitter signaling in mice. Heliyon 2024, 10, e26979. https://doi.org/10.1016/j.heliyon.2024.e26979.",
  "Jiang, N.; Wei, S.; Zhang, Y.; et al. Protective effects and mechanism of Radix Polygalae against neurological diseases as well as effective substance. Front. Psychiatry 2021, 12, 688703. https://doi.org/10.3389/fpsyt.2021.688703.",
  "Luo, H.; Sun, S.J.; Wang, Y.; Wang, Y.L. Revealing the sedative-hypnotic effect of the extracts of herb pair Semen Ziziphi spinosae and Radix Polygalae and related mechanisms through experiments and metabolomics approach. BMC Complement. Med. Ther. 2020, 20, 206. https://doi.org/10.1186/s12906-020-03000-8.",
  "Liu, Z.; Wang, Q.; Fan, X.; et al. Os Draconis-derived nanoparticles improve insomnia symptoms by activating calcium-dependent 5-HT release and the vagal-NTS pathway. Int. J. Nanomedicine 2025, 20, 14329–14341. https://doi.org/10.2147/IJN.S553405.",
  "Fan, J.; Li, Y.; Wang, G.; Li, Q.; Fang, M. Identification and verification of the anti-insomnia compounds from herbal pair Albiziae Cortex and Polygoni Multiflori Caulis using immobilized 5-HT1A receptor chromatography. Biomed. Chromatogr. 2026, 40, e70278. https://doi.org/10.1002/bmc.70278.",
  "Varinthra, P.; Anwar, S.N.M.N.; Shih, S.-C.; Liu, I.Y. The role of the GABAergic system on insomnia. Tzu Chi Med. J. 2024, 36, 103–109. https://doi.org/10.4103/tcmj.tcmj_243_23.",
  "Liu, X.; Sun, P.; Bao, X.; Cao, Y.; Wang, L.; Wang, Q. Potential mechanisms of traditional Chinese medicine in treating insomnia: A network pharmacology, GEO validation, and molecular-docking study. Medicine 2024, 103, e38052. https://doi.org/10.1097/MD.0000000000038052.",
  "Chung, M.C.; Su, L.J.; Chen, C.L.; Wu, L.C. AI-assisted literature exploration of innovative Chinese medicine formulas. Front. Pharmacol. 2024, 15, 1347882. https://doi.org/10.3389/fphar.2024.1347882.",
  "Zhao, W.; Lu, W.; Li, Z.; et al. TCM herbal prescription recommendation model based on multi-graph convolutional network. J. Ethnopharmacol. 2022, 297, 115109. https://doi.org/10.1016/j.jep.2022.115109.",
  "Han, X.; Xie, X.; Zhao, R.; et al. Calculating the similarity between prescriptions to find their new indications based on graph neural network. Chin. Med. 2024, 19, 124. https://doi.org/10.1186/s13020-024-00994-y.",
  "Zhao, F.-Y.; Xu, P.; Kennedy, G.A.; et al. Commercial Chinese polyherbal preparation Zao Ren An Shen prescription for primary insomnia: A systematic review with meta-analysis and trial sequential analysis. Front. Pharmacol. 2024, 15, 1376637. https://doi.org/10.3389/fphar.2024.1376637.",
  "Yang, M.; Wang, H.; Zhang, Y.L.; et al. The herbal medicine Suanzaoren (Ziziphi Spinosae Semen) for sleep quality improvements: A systematic review and meta-analysis. Integr. Cancer Ther. 2023, 22, 15347354231162080. https://doi.org/10.1177/15347354231162080.",
  "Wang, M.; Wang, G.; Zhao, M.; et al. Jujuboside A in ameliorating insomnia in mice via GABAergic modulation of the PVT. J. Ethnopharmacol. 2025, 349, 119939. https://doi.org/10.1016/j.jep.2025.119939.",
  "Bian, Z.; Zhang, W.; Feng, Z.; et al. Ziziphi Spinosae semen extract ameliorates insomnia by regulating hypothalamic GABA/Glu balance and gut microbiota Lactobacillus johnsonii. J. Funct. Foods 2025, 129, 106911. https://doi.org/10.1016/j.jff.2025.106911.",
  "Hagberg, A.A.; Schult, D.A.; Swart, P.J. Exploring network structure, dynamics, and function using NetworkX. In Proceedings of the 7th Python in Science Conference (SciPy 2008), Pasadena, CA, USA, 19–24 August 2008; pp. 11–15.",
  "Newman, M.E.J. Modularity and community structure in networks. Proc. Natl. Acad. Sci. USA 2006, 103, 8577–8582. https://doi.org/10.1073/pnas.0601602103.",
  "Watts, D.J.; Strogatz, S.H. Collective dynamics of 'small-world' networks. Nature 1998, 393, 440–442. https://doi.org/10.1038/30918.",
  "Freeman, L.C. Centrality in social networks: Conceptual clarification. Soc. Networks 1978, 1, 215–239. https://doi.org/10.1016/0378-8733(78)90021-7.",
  "Raschka, S. MLxtend: Providing machine learning and data science utilities and extensions to Python's scientific computing stack. J. Open Source Softw. 2018, 3, 638. https://doi.org/10.21105/joss.00638.",
];
REFS.forEach((ref, i) => C.push(new Paragraph({
  spacing: { after: 100, line: 280 },
  alignment: AlignmentType.JUSTIFIED,
  indent: { left: 360, hanging: 360 },
  children: [new TextRun({
    text: `${i + 1}. ${ref}`,
    font: { name: FONT }, size: 20,
  })],
})));

// ═══════════════════════════════════════════════════════════════════════
// Supplementary Materials
// ═══════════════════════════════════════════════════════════════════════
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(h1("Supplementary Materials"));

C.push(h2("Supplementary Table S1. Data source inventory (template)"));
C.push(p("Each peer-reviewed source is cited under MDPI citation style with DOI / journal / volume / pages; each database entry is reported with its access URL and access date; the de-identified research-curated archive is summarised as anonymous batch labels (Batch-α, Batch-β, …) together with the prescription count contributed by each batch. No physician name and no institution name appear in the supplementary inventory."));

C.push(h2("Supplementary Table S2. Glossary of canonical herb names"));
C.push(p("For every herb cited in the manuscript or in the figures, the table below pairs the Pinyin transliteration used in the figures with the standardised Latin pharmacognostic name expected by SCI readers. Chinese characters are retained in the rightmost column for traceability with the original input data."));
C.push(tbl([
  ["Pinyin", "Latin pharmacognostic name", "Chinese"],
  ["Gan Cao",        "Glycyrrhizae Radix et Rhizoma",         "甘草"],
  ["Suan Zao Ren",   "Ziziphi Spinosae Semen",                "酸枣仁"],
  ["He Huan Pi",     "Albiziae Cortex",                       "合欢皮"],
  ["Shou Wu Teng",   "Polygoni Multiflori Caulis",            "首乌藤"],
  ["Fu Shen",        "Poria cum Radice Pini",                 "茯神"],
  ["Yuan Zhi",       "Polygalae Radix",                       "远志"],
  ["Wu Wei Zi",      "Schisandrae Chinensis Fructus",         "五味子"],
  ["Long Gu",        "Os Draconis",                           "龙骨"],
  ["Mu Li",          "Ostreae Concha",                        "牡蛎"],
  ["Fu Ling",        "Poria",                                 "茯苓"],
  ["Dang Gui",       "Angelicae Sinensis Radix",              "当归"],
  ["Bai Shao",       "Paeoniae Radix Alba",                   "白芍"],
  ["Bai Zi Ren",     "Platycladi Semen",                      "柏子仁"],
  ["Bai Zhu",        "Atractylodis Macrocephalae Rhizoma",    "白术"],
  ["Shi Chang Pu",   "Acori Tatarinowii Rhizoma",             "石菖蒲"],
  ["Long Yan Rou",   "Longan Arillus",                        "龙眼肉"],
  ["Huang Qi",       "Astragali Radix",                       "黄芪"],
  ["Dang Shen",      "Codonopsis Radix",                      "党参"],
  ["Da Zao",         "Jujubae Fructus",                       "大枣"],
  ["Mu Xiang",       "Aucklandiae Radix",                     "木香"],
  ["Ren Shen",       "Ginseng Radix et Rhizoma",              "人参"],
  ["Chen Pi",        "Citri Reticulatae Pericarpium",         "陈皮"],
  ["Sheng Di Huang", "Rehmanniae Radix",                      "生地黄"],
  ["Huang Bai",      "Phellodendri Chinensis Cortex",         "黄柏"],
  ["Mai Dong",       "Ophiopogonis Radix",                    "麦冬"],
  ["Bei Sha Shen",   "Glehniae Radix",                        "北沙参"],
  ["Chuan Xiong",    "Chuanxiong Rhizoma",                    "川芎"],
  ["Ban Xia",        "Pinelliae Rhizoma",                     "半夏"],
  ["Zhu Ru",         "Bambusae Caulis in Taenias",            "竹茹"],
  ["Mu Dan Pi",      "Moutan Cortex",                         "牡丹皮"],
  ["Nv Zhen Zi",     "Ligustri Lucidi Fructus",               "女贞子"],
], [1800, 4200, 3026]));

C.push(h2("Supplementary Methods S3. De-identification protocol"));
C.push(p("Before any record entered the analytical pipeline, the following five-element de-identification protocol was applied at the source: removal of personal name, removal of any government-issued identification number, removal of contact information (telephone, e-mail, address), removal of the exact visit date (year retained only where research-relevant), and removal of any institution-internal record identifier. The prescription_id field released in the public dataset is an opaque, irreversibly mapped identifier generated by a one-way hash with a salt held only by the study team; the salt is not distributed. Records lacking complete composition information or carrying any residual identifier were excluded from the analytical corpus."));

C.push(h2("Supplementary Code"));
C.push(p("The eleven analysis scripts — step1_data_audit.py to step11_reproducibility_report.py — together with the Makefile, conda environment specification and reproducibility-report generator are released at https://github.com/ourHua/insomnia-tcm-mining and permanently archived on Zenodo (DOI 10.5281/zenodo.20250578). The single-command reproduction \"make all\" regenerates every numerical result, table and figure reported in the manuscript and emits an HTML reproducibility report that asserts the headline values."));

// ═══════════════════════════════════════════════════════════════════════
// Build and write
// ═══════════════════════════════════════════════════════════════════════
const doc = new Document({
  styles: {
    default: { document: { run: { font: { name: FONT, eastAsia: CN_FONT } } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: { name: HFONT } },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: { name: HFONT } },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: { name: HFONT } },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: PAGE_H },
                          margin: { top: MARG, right: MARG, bottom: MARG, left: MARG } } },
    children: C,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const out = path.resolve(__dirname, "Insomnia_TCM_Mining_Manuscript_EN.docx");
  fs.writeFileSync(out, buf);
  console.log(`WROTE: ${out}  (${(buf.length / 1024).toFixed(1)} KB)`);
});
