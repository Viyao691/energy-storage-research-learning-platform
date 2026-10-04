from __future__ import annotations

import json
import re
from dataclasses import dataclass
from enum import Enum


DEFAULT_ANALYSIS_CONTEXT_CHARS = 18_000
_CONCLUSION_HEADING_RE = re.compile(r"(?im)^[ \t]*(?:(?:\d+(?:\.\d+)*|[IVXLC]+)[.)]?[ \t]+)?(?:conclusions?|summary and outlook|结论|总结与展望)[ \t]*$")
_REFERENCES_HEADING_RE = re.compile(r"(?im)^[ \t]*(?:references|bibliography|参考文献)[ \t]*$")
_CONTRIBUTION_RE = re.compile(r"\b(?:contributions?|novel framework|we propose|we present|this (?:paper|study) (?:proposes?|presents?|develops?))\b|创新|贡献|本文提出", re.I)
_RESULT_RE = re.compile(r"\b(?:results?|performance|capacity|retention|efficiency|energy density|cycles?)\b|结果|性能|容量|循环|效率", re.I)
_SECTION_RE = re.compile(r"\b(?:abstract|introduction|methods?|experimental|discussion|references)\b|摘要|引言|方法|实验|讨论|参考文献", re.I)
_NUMBER_RE = re.compile(r"\b\d+(?:\.\d+)?\s*(?:%|Wh/kg|mAh/g|mAh\s*g|cycles?|V\b|K\b)", re.I)


@dataclass(frozen=True)
class PaperAnalysisContext:
    text: str
    evidence_scope: str
    article_type: str


@dataclass(frozen=True)
class ParsedAnalysisResult:
    summary: str
    plain_explanation: str
    deep_analysis: str
    evidence_status: str


class AnalysisReportType(str, Enum):
    quick_understanding = "quick_understanding"
    layman_understanding = "layman_understanding"
    reviewer_analysis = "reviewer_analysis"


REPORT_PROMPT_VERSIONS = {
    AnalysisReportType.quick_understanding: "quick-understanding-v6",
    AnalysisReportType.layman_understanding: "layman-understanding-v6",
    AnalysisReportType.reviewer_analysis: "reviewer-analysis-v6",
}
REPORT_SCHEMA_VERSIONS = {
    AnalysisReportType.quick_understanding: "quick-understanding-schema-v2",
    AnalysisReportType.layman_understanding: "layman-understanding-schema-v2",
    AnalysisReportType.reviewer_analysis: "reviewer-analysis-schema-v2",
}


def is_usable_report_version(report_type: AnalysisReportType, prompt_version: str, schema_version: str) -> bool:
    return schema_version == REPORT_SCHEMA_VERSIONS[report_type] and prompt_version in {
        REPORT_PROMPT_VERSIONS[report_type],
        REPORT_PROMPT_VERSIONS[report_type].replace("-v6", "-v5"),
        REPORT_PROMPT_VERSIONS[report_type].replace("-v6", "-v4"),
    }


@dataclass(frozen=True)
class ParsedReportResult:
    report_markdown: str
    evidence_status: str


def _context_header(scope: str, article_type: str, parse_confidence: float) -> str:
    resolved_type = article_type.strip() or "未可靠识别"
    return (
        f"【证据范围：{scope}】\n"
        f"【文章体裁：{resolved_type}】\n"
        f"【文本提取量指标（非准确率）：{parse_confidence:.2f}】"
    )


def _page_chunks(text: str, limit: int = 950) -> list[str]:
    # PyMuPDF commonly inserts line breaks at column width, not paragraphs.
    joined = re.sub(r"(?<=\w)-\n(?=\w)", "", text)
    joined = re.sub(r"\s+", " ", joined).strip()
    sentences = re.split(r"(?<=[.!?。！？])\s+(?=[A-Z0-9(（“‘])", joined)
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        if len(sentence) > limit:
            # A PDF table or broken extraction has no reliable sentence boundary.
            if current:
                chunks.append(current)
                current = ""
            for start in range(0, len(sentence), limit):
                chunks.append(sentence[start:start + limit])
        elif len(current) + len(sentence) + 1 > limit:
            chunks.append(current)
            current = sentence
        else:
            current = f"{current} {sentence}".strip()
    if current:
        chunks.append(current)
    return chunks


def _selected_chunks(pages: list[tuple[int, str]], budget: int) -> list[tuple[int, str]]:
    candidates: list[tuple[int, int, str, int, str]] = []
    for page_number, page_text in pages:
        heading = _CONCLUSION_HEADING_RE.search(page_text)
        parts = [(page_text[:heading.start()], "body"), (page_text[heading.start():], "conclusion")] if heading else [(page_text, "body")]
        if heading:
            references = _REFERENCES_HEADING_RE.search(parts[-1][0])
            if references:
                conclusion_text = parts[-1][0]
                parts[-1:] = [(conclusion_text[:references.start()], "conclusion"), (conclusion_text[references.start():], "body")]
        position = 0
        for part, section in parts:
            for chunk in _page_chunks(part):
                score = (100 if section == "conclusion" else 0) + (75 if _CONTRIBUTION_RE.search(chunk) else 0)
                score += 55 if _NUMBER_RE.search(chunk) and _RESULT_RE.search(chunk) else 0
                score += 35 if _RESULT_RE.search(chunk) else 0
                score += 25 if page_number == pages[0][0] else 0
                score += 15 if _SECTION_RE.search(chunk) else 0
                category = "conclusion" if section == "conclusion" else (
                    "contribution" if _CONTRIBUTION_RE.search(chunk) else (
                        "numeric" if _NUMBER_RE.search(chunk) and _RESULT_RE.search(chunk) else (
                            "methods" if re.search(r"\b(?:methods?|experimental|protocol|approach)\b|方法|实验", chunk, re.I) else "other"
                        )
                    )
                )
                candidates.append((page_number, position, chunk, score, category))
                position += 1
    chosen: list[tuple[int, int, str, int, str]] = []
    used = 0
    def add(candidate: tuple[int, int, str, int, str]) -> None:
        nonlocal used
        cost = len(candidate[2]) + len(f"【第 {candidate[0]} 页】\n") + 2
        if candidate not in chosen and used + cost <= budget:
            chosen.append(candidate)
            used += cost

    ranked = sorted(candidates, key=lambda item: (-item[3], item[0], item[1]))
    for page in (pages[0][0], pages[-1][0]):
        page_candidates = [item for item in candidates if item[0] == page]
        if page_candidates:
            add(page_candidates[0])
    for candidate in [item for item in candidates if item[0] in {page for page, _ in pages[:3]} and _NUMBER_RE.search(item[2])][:3]:
        add(candidate)
    for category, count in (("conclusion", 4), ("contribution", 2), ("numeric", 3), ("methods", 2)):
        for candidate in [item for item in ranked if item[4] == category][:count]:
            add(candidate)
    for candidate in [item for item in candidates if item[0] == pages[0][0]][:2]:
        add(candidate)
    # Reserve geographical spread in long papers before spending the rest by score.
    for slot in range(min(6, len(pages))):
        page = pages[round(slot * (len(pages) - 1) / max(min(6, len(pages)) - 1, 1))][0]
        page_candidates = [item for item in ranked if item[0] == page]
        if page_candidates:
            add(page_candidates[0])
    for candidate in ranked:
        add(candidate)
    return [(page, chunk) for page, _, chunk, _, _ in sorted(chosen, key=lambda item: (item[0], item[1]))]


def build_paper_analysis_context(
    *,
    page_texts: list[str] | None,
    abstract: str,
    fallback_text: str,
    article_type: str,
    parse_confidence: float,
    max_chars: int = DEFAULT_ANALYSIS_CONTEXT_CHARS,
) -> PaperAnalysisContext:
    pages = [
        (page_number, text.strip())
        for page_number, text in enumerate(page_texts or [], start=1)
        if text and text.strip()
    ]
    if pages:
        scope = "全文 PDF 精选片段"
        header = _context_header(scope, article_type, parse_confidence)
        warning = "以下仅为按输入预算选出的分页片段，未覆盖的内容不能视为论文没有；不得声称逐页审查全文。"
        budget = max(max_chars - len(header) - len(warning) - 4, 0)
        blocks = [f"【第 {page} 页】\n{chunk}" for page, chunk in _selected_chunks(pages, budget)]
        text = f"{header}\n{warning}\n\n" + "\n\n".join(blocks)
        return PaperAnalysisContext(text, scope, article_type.strip())

    if abstract.strip():
        scope = "仅摘要"
        warning = "当前没有可用的分页全文，不能审查完整实验、图表和机制证据。"
        body = f"{_context_header(scope, article_type, parse_confidence)}\n{warning}\n\n【摘要】\n{abstract.strip()}"
    elif fallback_text.strip():
        scope = "本地解析文本（页码不可用）"
        warning = "当前文本无法可靠绑定 PDF 页码；不得编造页码、章节或图表定位。"
        body = f"{_context_header(scope, article_type, parse_confidence)}\n{warning}\n\n{fallback_text.strip()}"
    else:
        scope = "仅元数据"
        warning = "当前仅有论文元数据，不能生成全文级实验、图表或机制判断。"
        body = f"{_context_header(scope, article_type, parse_confidence)}\n{warning}"
    return PaperAnalysisContext(body[:max_chars], scope, article_type.strip())


def _is_review(article_type: str) -> bool:
    normalized = article_type.strip().lower()
    return "综述" in normalized or "review" in normalized


def build_report_prompt(
    title: str,
    context: PaperAnalysisContext,
    report_type: AnalysisReportType,
) -> str:
    """Build one complete report task; no report is derived from another report."""

    response_key = report_type.value
    shared = (
        "你是严谨的储能论文科研导师。只依据证据包生成一份独立、完整的中文 Markdown 报告。"
        f"只返回 JSON 对象，且只包含一个非空字符串字段 {response_key}。"
        "禁止生成另外两类报告，禁止把同一总报告切片、截断或按章节分配给不同页面。"
        "重要判断必须标记为作者事实、作者结论、原始数据、AI归纳、AI推断、AI质疑、AI假设或尚不确定；"
        "尽可能绑定真实存在的 PDF 页码、章节、图表号和短证据片段，无法定位时写未定位/尚不确定。"
        "化学式、变量和方程统一改写为可读 Unicode/纯文本（如 NaₓTMO₂、ΔG），禁止输出任何 LaTeX 命令或反斜杠。"
        "真实化学式计量数字使用Unicode下标，离子电荷使用Unicode上标；Delmas结构相标记P2、P3、O2、O3保持普通数字，不能改成化学下标。"
        "Mermaid节点中的化学表达也遵守此规则，不使用LaTeX或HTML上下标标签。"
        "不得把摘要分析伪装为全文分析，不得因期刊或高级表征本身断言机制成立。"
        "排版硬性要求：每个大点用二级或三级标题（## 或 ###）单独成行；大点内部的内容必须分行书写，"
        "用短段落或列表（- 或 1.）逐条罗列，禁止把多个要点挤进同一个长段落；"
        "关键结论、核心数据、重要术语和提示词必须用 **加粗** 强调；"
        "在合适的两个不同小节分别放置两张用途不同的 ```mermaid 代码块，均优先用 flowchart TD；"
        "每个代码块前必须独立成行写 ### 核心逻辑图 或 ### 方法流程图 标题，不能只有裸代码块。"
        "核心逻辑图串起具体问题、关键分析或发现、结论及边界；"
        "综述要呈现路线比较、共识或争议与研究缺口，不把文献并列写成伪因果链。"
        "第二张标题为“方法流程图”，研究论文按证据包中真实的实验与分析步骤组织；"
        "综述仅在原文有依据时呈现检索、筛选、分类比较到综合判断，未交代的方法明确写缺口；"
        "真实并列步骤保留分支，不强行串成单线。方法图止于证据分类表或综合框架等方法产物，"
        "不要在末尾重复核心发现；两图内容不得重复，也不得用放射状目录词代替论证。"
        "每图通常 5–7 个有内容的节点；证据不足时减少节点并标明缺口，绝不为凑数补造。"
        "每个节点只写一个具体核心判断或操作加短限定，分两行，每行尽量 12–18 个汉字；"
        "节点与箭头标签不得包含页码；真实短数据可适度放入节点，页码引用、长英文列表和完整公式写在图外。"
        "不要只写“背景”“方法”“结果”等目录词，也不要把整段文字塞入节点。"
        "每条箭头都必须有 2–6 字关系标签，区分操作先后、比较、支持或限制；"
        "分支须有明确语义，不得把统一数学框架到技术成熟度等未经证实的关系误画成因果。"
        "只用安全、简单的 Mermaid flowchart TD 语法：节点用 ASCII ID、双引号包裹标签，标签内用 <br/> 分成两行；"
        "语法简例 A[\"具体问题<br/>关键限定\"] -->|支持| B[\"关键判断<br/>证据定位\"]，实际主词须具体且不是目录词。"
        "不要输出 classDef、style、click、"
        "init 指令或模型指定的颜色与样式，视觉风格由前端统一控制。"
        "每图后用一两句解释阅读主线与证据边界。仅元数据时不得生成实验、结果或证据链图，"
        "改用文字说明两图因缺少正文证据而无法构建。"
    )
    if report_type is AnalysisReportType.quick_understanding:
        requirements = (
            "本任务是快速理解，面向 5 分钟真正读懂论文。正常全文目标约 1200–2000 中文字；"
            "原文不足时明确缺失，不能用套话填充。报告简洁但必须独立完整，依次回答："
            "论文做什么；为什么做与真正瓶颈；作者怎么做；最关键结果及其意义；真正贡献；最重要局限；"
            "最后给出一条完整的速读结论。不得引用或依赖通俗理解、审稿人速解的输出。"
        )
    elif report_type is AnalysisReportType.layman_understanding:
        requirements = (
            "本任务是通俗理解，面向储能本科生教学。正常全文目标约 2000–4000 中文字。"
            "必须按“前置知识 → 科学问题 → 作者思路 → "
            "实验为什么这样做 → 结果意味着什么 → 机制 → 我该学会什么”完整讲透。"
            "必须补充哪些地方容易误解。类比必须紧跟适用边界，不能牺牲科学准确性；"
            "专业术语首次出现时解释，实验结果要说明因果链和证据边界。"
            "不得引用或依赖快速理解、审稿人速解的输出。"
        )
    elif _is_review(context.article_type):
        requirements = (
            "本任务是审稿人速解，且本文是综述。不要套实验论文模板。必须独立完整覆盖："
            "领域问题地图；文献缺口与分类逻辑；各路线解决什么；证据、共识与争议；各路线优劣和适用条件；"
            "作者自己的判断及证据基础；真正创新与常规整理；未解决科学问题；下一代研究路线；"
            "5–10 个 reviewer questions；综述证明与未证明的边界；最终领域故事线。"
        )
    else:
        requirements = (
            "本任务是审稿人速解，是信息量最大的独立全文报告。必须完整覆盖：科学问题与领域现状；文献缺口；"
            "核心假设及成立条件；实验设计逻辑；材料/方法设计到每组关键实验的逐步论证路线；3–8 条核心 "
            "Claim–Evidence（Claim、原始证据、页码/图表、证据类型、强度和边界）；关键结果的物理/化学意义；"
            "机制的直接与间接证据；真正竞争性的替代解释；对照、变量隔离、测试公平性和证据跳跃；"
            "创新性与旧工作基础；证据强弱；可能过度的结论；5–10 个 reviewer questions；"
            "建议补实验及其解决的争议；论文证明与未证明的边界；最终完整科研故事线。"
            "不要限制输出长度来节省 Token；正常全文应明显长于另外两类报告，质量和证据密度优先。"
        )

    scope_guard = ""
    if context.evidence_scope == "全文 PDF 精选片段":
        scope_guard = "当前仅有分页精选片段：未展示的章节不能判断为原文缺失，不得声称逐页审查全文。"
    elif context.evidence_scope == "仅摘要":
        scope_guard = "当前仅有摘要：不得声称审查过全文实验、图表、机制或对照。"
    elif context.evidence_scope == "仅元数据":
        scope_guard = "当前仅有元数据：不得生成实验路线、结果、机制或证据链。"
    elif context.evidence_scope != "全文 PDF 文本":
        scope_guard = "当前没有可靠分页全文：不得编造页码、章节或图表定位。"
    return (
        f"{shared}\n本任务 prompt 版本：{REPORT_PROMPT_VERSIONS[report_type]}；"
        f"schema 版本：{REPORT_SCHEMA_VERSIONS[report_type]}。\n{requirements}\n{scope_guard}\n"
        f"论文标题：{title}\n文章体裁：{context.article_type or '未可靠识别'}\n"
        f"证据范围：{context.evidence_scope}\n\n证据包：\n{context.text}"
    )


def parse_report_result(content: str, evidence_status: str, report_type: AnalysisReportType | None = None) -> ParsedReportResult:
    parsed = json.loads(content)
    if not isinstance(parsed, dict):
        raise ValueError("analysis report response is not an object")
    report = parsed.get(report_type.value if report_type else "report_markdown")
    if not isinstance(report, str) or not report.strip():
        raise ValueError("analysis report must contain its non-empty report field")
    return ParsedReportResult(report.strip(), evidence_status)


def build_analysis_prompt(title: str, context: PaperAnalysisContext) -> str:
    common = (
        "你是严谨的论文审稿人和科研导师。只依据下方证据包分析，不得调用外部知识补造事实。"
        "只返回 JSON 对象，且仅包含 summary、plain_explanation、deep_analysis 三个非空字符串字段。"
        "三个字段使用中文Markdown；化学式使用Unicode下标，离子电荷使用Unicode上标，变量与方程使用可读纯文本。"
        "Delmas结构相标记P2、P3、O2、O3保持普通数字；禁止LaTeX，Mermaid内不使用HTML上下标标签。\n"
        "summary 必须包含‘一句话贡献’和‘30 秒总结’，并在开头声明证据范围。\n"
        "plain_explanation 必须包含‘本科生解释’、‘前置知识’、‘关键因果关系’和‘类比边界’。\n"
        "所有重要判断必须显式标记为以下一种：作者事实、作者结论、原始数据、AI归纳、AI推断、"
        "AI质疑、AI假设、尚不确定。作者事实指原文明示且可定位的背景或方法事实；"
        "AI假设只用于建议性的新解释或下一步实验，不得冒充作者主张。"
        "证据强度只能写直接证据、较强间接证据、弱间接证据或证据不足。"
        "重要结论尽可能绑定证据包中真实存在的页码、章节、图号、表号和短证据片段；"
        "无法定位时必须写‘未定位/尚不确定’，不得编造。期刊等级、作者声誉或高级表征本身不能证明机制。"
    )
    if _is_review(context.article_type):
        deep_requirements = (
            "本文按综述论文处理，deep_analysis 不要套用实验论文模板，必须依次包含 11 节：\n"
            "1. 领域问题地图与真正瓶颈；\n"
            "2. 文献分类逻辑及分类是否合理；\n"
            "3. 各路线解决什么；\n"
            "4. 各路线的证据、共识与争议；\n"
            "5. 各路线优劣与适用条件；\n"
            "6. 作者自己的判断及证据基础；\n"
            "7. 真正贡献与常规整理；\n"
            "8. 未解决科学问题；\n"
            "9. 下一代研究路线与关键验证；\n"
            "10. 审稿人/导师会追问的问题；\n"
            "11. 我读完应该记住的领域逻辑。\n"
        )
    else:
        deep_requirements = (
            "本文按研究论文处理，deep_analysis 必须依次包含 12 节：\n"
            "1. 论文到底解决什么问题：领域现状、真正瓶颈、本文切入点；\n"
            "2. 作者核心假设：为何可能有效及成立条件；\n"
            "3. 整篇论文论证路线：材料/方法设计、每组关键实验为什么做、得到什么、推进哪一步论证；\n"
            "4. 3–8 条核心 Claim–Evidence：每条写 Claim、证据类型、原始数据/现象、"
            "页码/章节/图表、短证据片段、证据强度与边界；\n"
            "5. 核心结果的物理/化学意义及重要性；\n"
            "6. 机制分析：作者机制、直接证据、间接证据、缺口和替代解释；\n"
            "7. 实验设计审查：对照、变量隔离、测试公平性、重复/统计和证据跳跃；\n"
            "8. 创新性拆解：真正创新、常规优化、依赖的旧工作基础；\n"
            "9. 5–10 个审稿人质疑，并说明每个问题为何重要；\n"
            "10. 论文边界：证明了什么、没有证明什么、可能过度的表述；\n"
            "11. 下一步最有价值实验：每项解决的争议及判别结果；\n"
            "12. 我读完这篇论文应该记住的核心逻辑：用完整科研故事线串联。\n"
        )
    scope_guard = ""
    if context.evidence_scope == "全文 PDF 精选片段":
        scope_guard = "当前仅有分页精选片段：未展示的章节不能判断为原文缺失，不得声称逐页审查全文。\n"
    elif context.evidence_scope == "仅摘要":
        scope_guard = "当前仅摘要：必须明确写出不能声称已审查全文实验、图表或机制证据。\n"
    elif context.evidence_scope == "仅元数据":
        scope_guard = "当前仅元数据：不得生成实验路线、结果、机制或证据链。\n"
    elif context.evidence_scope != "全文 PDF 文本":
        scope_guard = "当前没有可靠分页全文：不得声称页码或图表定位已核验。\n"
    return (
        f"{common}{deep_requirements}{scope_guard}\n"
        f"论文标题：{title}\n文章体裁：{context.article_type or '未可靠识别'}\n"
        f"证据范围：{context.evidence_scope}\n\n证据包：\n{context.text}"
    )


def parse_analysis_result(content: str, evidence_status: str) -> ParsedAnalysisResult:
    parsed = json.loads(content)
    if not isinstance(parsed, dict):
        raise ValueError("analysis response is not an object")
    values = [parsed.get(key) for key in ("summary", "plain_explanation", "deep_analysis")]
    if not all(isinstance(value, str) and value.strip() for value in values):
        raise ValueError("analysis response fields must be non-empty strings")
    return ParsedAnalysisResult(
        summary=values[0].strip(),
        plain_explanation=values[1].strip(),
        deep_analysis=values[2].strip(),
        evidence_status=evidence_status,
    )
