from __future__ import annotations

import base64
import json
import re
from dataclasses import dataclass
from typing import Protocol

import httpx

from .paper_analysis import (
    AnalysisReportType,
    PaperAnalysisContext,
    build_report_prompt,
    parse_report_result,
)
from .learning import (
    LearningCardDraft,
    LearningCardsResult,
    LearningFeedbackResult,
    LearningQuestionDraft,
    LearningQuizResult,
    parse_cards_result,
    parse_feedback_result,
    parse_quiz_result,
)


DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEEPSEEK_DEFAULT_MODEL = "deepseek-flash"
ZHIPU_BASE_URL = "https://open.bigmodel.cn/api/paas/v4"
ZHIPU_DEFAULT_MODEL = "glm-5.3"
OPENAI_BASE_URL = "https://api.openai.com/v1"
OPENAI_DEFAULT_MODEL = "gpt-6-sol"
OLLAMA_BASE_URL = "http://host.docker.internal:11434"
OLLAMA_DEFAULT_MODEL = "qwen2.5:7b"
OLLAMA_DEFAULT_VISION_MODEL = "qwen2.5vl:3b"

# Provider IDs are persisted in settings and bind encrypted keys to one vendor.
# Empty model defaults require the user to enter an account-specific model ID.
COMPATIBLE_PROVIDER_DEFAULTS: dict[str, tuple[str, str]] = {
    "qwen": ("https://dashscope.aliyuncs.com/compatible-mode/v1", "qwen3.8-flash"),
    "gemini": ("https://generativelanguage.googleapis.com/v1beta/openai", "gemini-3.8-flash"),
    "moonshot": ("https://api.moonshot.cn/v1", "kimi-k3"),
    "volcengine": ("https://ark.cn-beijing.volces.com/api/v3", "doubao-seed-2-1-lite-260915"),
    "minimax": ("https://api.minimax.cn/v1", "MiniMax-M3"),
    "hunyuan": ("https://tokenhub.tencentmaas.com/v1", "hy4-preview"),
    "qianfan": ("https://qianfan.baidubce.com/v2", "ernie-5.0"),
    "siliconflow": ("https://api.siliconflow.cn/v1", ""),
    "openrouter": ("https://openrouter.ai/api/v1", "~openai/gpt-sol-latest"),
    "xai": ("https://api.x.ai/v1", "grok-4.7"),
    "mistral": ("https://api.mistral.ai/v1", "mistral-medium-3-5"),
}
ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1"
ANTHROPIC_DEFAULT_MODEL = "claude-sonnet-5"


def provider_base_url(provider: str, override: str = "") -> str:
    """Resolve a configured endpoint without crossing provider identities."""
    if override.strip():
        return override.strip().rstrip("/")
    if provider == "anthropic":
        return ANTHROPIC_BASE_URL
    if provider in COMPATIBLE_PROVIDER_DEFAULTS:
        return COMPATIBLE_PROVIDER_DEFAULTS[provider][0]
    if provider == "deepseek":
        return DEEPSEEK_BASE_URL
    if provider == "zhipu":
        return ZHIPU_BASE_URL
    if provider == "openai":
        return OPENAI_BASE_URL
    return ""


def _bound_figure_parts(page_text: str) -> tuple[str, list[str]]:
    figure_match = re.search(r"图号：([^\n]+)", page_text)
    subfigure_match = re.search(r"子图：([^\n]+)", page_text)
    figure_label = figure_match.group(1).strip() if figure_match else "当前 Figure"
    labels = re.findall(r"\b([a-z])\b", subfigure_match.group(1), re.I) if subfigure_match else []
    return figure_label, list(dict.fromkeys(label.lower() for label in labels))


def _visual_analysis_prompt(
    title: str,
    caption: str,
    page_text: str,
    *,
    retry_in_chinese: bool = False,
) -> str:
    figure_label, subfigures = _bound_figure_parts(page_text)
    subfigure_sections = "\n".join(
        f"### 子图 {label}\n只使用子图 {label} 自己可确认的坐标、图例、样品、条件与数据。"
        for label in subfigures
    ) or "### 子图边界无法确认\n明确说明无法确认，不得虚构子图。"
    retry_instruction = (
        "上一次回答使用了过多英文。请重新分析，不要复述或翻译上一次回答；"
        if retry_in_chinese
        else ""
    )
    return (
        f"{retry_instruction}"
        "你以储能论文审稿人和科研导师的方式解读 Figure。只依据给出的论文标题、"
        "图注、已绑定上下文和页面图像回答。所有 Markdown 标题和解释正文必须使用简体中文，"
        "即使论文、图注或图中文字是英文，也不能用大段英文代替中文分析。"
        "专业术语首次出现时可以写成“中文（English）”，化学式、材料缩写、"
        "图号和单位可以保留原文。\n\n"
        "先完成上下文绑定：逐项核对图号、Caption、PDF 页码、子图 a/b/c…和正文引用段落。"
        "任何一项没有可靠来源都必须原样标记“无法确认”，确认上下文前不得解释。"
        "坐标、图例、样品、测试条件或数值看不清时同样写“无法确认”；禁止使用“可能是”猜测坐标、"
        "不得猜测任何无法可靠辨认的信息。"
        "图例、样品或条件，也不得把摘要或通用领域知识伪装成该图证据。\n\n"
        "输出必须按以下 Markdown 结构：\n"
        "## 1. 图中内容与读图方法\n"
        "简要完成上下文绑定：图号、Caption、PDF 页码、正文引用段落和已确认子图；"
        "标明信息来自图像、图注还是正文，不要用长篇绑定清单挤占分析。\n"
        f"{subfigure_sections}\n"
        "对每个已确认的 a/b/c…分别说明横纵坐标、单位、图例、样品、实验/模拟条件和读图顺序。"
        "表格说明行列、单位、比较基准与分母；示意图说明箭头/模块含义，不伪造数据或实验机制。"
        "若子图无法分开，明确写“子图边界无法确认”，不得虚构子图。\n"
        f"禁止为 {figure_label} 整体编造或共用一套横纵坐标、图例、样品及测试条件。\n"
        "## 2. 关键结果\n"
        "按子图分点写真实趋势、差异、重要数值及其条件，说明比较对象和计算口径。"
        "不凭图像猜精确数字，不把控制指令当实际输出、模拟参考当实测、相对百分比当百分点。"
        "图文不一致时明确指出，不默默修正。\n"
        "## 3. 深层解析／机制\n"
        "解释观察如何支持物理/化学/控制机制，把数据到判断的推理写清楚；"
        "替代解释必须是能产生相同观察结果、但机制归因不同的竞争性解释，不得重复作者结论。"
        "区分原图事实、正文解释与分析推论，说明哪些机制需要联合证据才能判别。\n"
        "## 4. 在论文中的论证作用\n"
        "说明作者为什么画这张图、前一环节的缺口和它支撑的 Claim。"
        "解释 a→b→c→d 怎样各自承担不同论证步骤并共同推进论文主线，不能只是重复汇总。\n"
        "用简洁 Claim–Evidence 分点关联具体子图/页码和事实，判断属于直接证据、间接证据或辅助证据，"
        "不要把同一仿真中的多个输出当成独立实测验证。\n"
        "## 5. 局限与下一步\n"
        "说明单凭这张图不能证明什么、证据支持到何种程度；区分仿真、实验、综述示意与目录正文引用。"
        "给出针对当前图中关键不确定性的联合证据、审稿人追问或有判别力的优先验证，"
        "说明验证能区分哪些解释，不堆砌一般建议或通用补实验清单。\n\n"
        "每节必须采用 Markdown 分点短段（-），每点 1–3 句，分点之间留空行；复杂图按 a/b/c 子图组织。"
        "重要判断、数值和条件使用 **加粗**，不要整段加粗。简单示意约 400–700 中文字，"
        "复杂图表约 700–1200 中文字或按证据需要更长；目录引用可简短，不靠重复凑字数。"
        "只输出可阅读的分析 Markdown，不输出代码、JSON 或代码围栏。\n\n"
        "遇到以下表征时只使用对应专业逻辑，不得套通用模板：\n"
        "- XRD：核对物相归属、峰位/峰形/半峰宽、晶格参数、Rietveld 拟合质量、原位/非原位条件；"
        "峰移或新峰本身不能唯一证明离子占位、相变路径或可逆机制。\n"
        "- XPS：核对能量校准、峰拟合约束、背景/峰形、表面充电和溅射影响；表面结合能变化不能单独证明体相价态或体相氧化还原。\n"
        "- XAS：区分 XANES 边位/白线/预峰与 EXAFS 配位壳层/拟合区间/R 因子，比较标准样；平均局域结构不能唯一给出单一价态或长程有序。\n"
        "- TEM：核对尺度、区域代表性、晶格条纹索引、FFT/SAED 与束流损伤；单一区域不能代表整体材料或证明体相机制。\n"
        "- SEM：核对倍率、尺度、统计数量、断面/表面和样品制备；形貌相关性不能单独证明性能因果。\n"
        "- CV：核对电压窗、扫速、活性物质量、峰位/峰间距/峰电流和循环变化；峰形变化不能单独给出扩散系数或反应路径。\n"
        "- GITT：核对脉冲/静置时间、电流、准平衡是否达到、几何与公式假设；未满足半无限扩散和稳态条件时不得把表观值当作精确扩散系数。\n"
        "- EIS：核对频率范围、扰动幅值、SOC/温度/静置、等效电路、拟合残差与参数不唯一性；半圆变化不能未经验证直接归因于单一电荷转移过程。\n\n"
        "不得因为期刊、仪器先进或多种表征方向一致就声称机制已经证明。公式、化学式和上下角标"
        "优先使用 Unicode（如 O₂、O²⁻、Na⁺、E = ½Jω²）；需要复杂数学时行内用 $...$、独立方程用 $$...$$，"
        "不要输出裸 LaTeX 或用反引号包裹公式。P2/P3/O2/O3 是结构相名，数字保持普通字符，"
        "必须区分相名 O2、氧分子 O₂ 与氧离子 O²⁻。\n\n"
        f"论文标题：{title}\n图注：{caption}\n已绑定上下文：\n{page_text[:8000]}"
    )


def _visual_answer_needs_chinese_retry(content: str) -> bool:
    chinese_characters = sum("\u4e00" <= character <= "\u9fff" for character in content)
    latin_characters = sum(
        character.isascii() and character.isalpha() for character in content
    )
    return latin_characters >= 120 and (
        chinese_characters < 30 or latin_characters > chinese_characters * 4
    )


def _structured_visual_prompt(title: str, caption: str, page_text: str) -> str:
    return (
        "你是严谨的科研图表数据提取助手。只依据给出的裁切图像、图注和页面文字。"
        "返回一个 JSON 对象，且只包含 chart_type、x_axis、y_axis、series、limitations。"
        "x_axis 和 y_axis 必须各有字符串 label、unit；series 是最多 12 个对象，每项只有"
        "字符串 name 和 points，points 是最多 200 个对象，每项只有字符串 x、y。"
        "无法辨认的坐标、单位、数值必须使用空字符串或省略该点，绝不猜测。"
        "limitations 是字符串数组，必须说明近似读取和人工核对需求。不要输出 Markdown 或代码围栏。\n\n"
        f"论文标题：{title}\n图注：{caption}\n当前页文字：{page_text[:6000]}"
    )


def _structured_visual_data(content: object) -> tuple[str, dict[str, str], dict[str, str], list[dict[str, object]], list[str]]:
    if not isinstance(content, str):
        raise ValueError("structured visual response is not text")
    parsed = json.loads(content)
    if not isinstance(parsed, dict):
        raise ValueError("structured visual response is not an object")

    def axis(name: str) -> dict[str, str]:
        value = parsed.get(name)
        if not isinstance(value, dict):
            raise ValueError("structured visual axis is invalid")
        label, unit = value.get("label"), value.get("unit")
        if not isinstance(label, str) or not isinstance(unit, str):
            raise ValueError("structured visual axis values are invalid")
        return {"label": label[:160], "unit": unit[:80]}

    chart_type = parsed.get("chart_type")
    raw_series = parsed.get("series")
    raw_limitations = parsed.get("limitations")
    if not isinstance(chart_type, str) or not isinstance(raw_series, list) or not isinstance(raw_limitations, list):
        raise ValueError("structured visual fields are invalid")
    series: list[dict[str, object]] = []
    for item in raw_series[:12]:
        if not isinstance(item, dict) or not isinstance(item.get("name"), str) or not isinstance(item.get("points"), list):
            raise ValueError("structured visual series is invalid")
        points: list[dict[str, str]] = []
        for point in item["points"][:200]:
            if not isinstance(point, dict) or not isinstance(point.get("x"), str) or not isinstance(point.get("y"), str):
                raise ValueError("structured visual point is invalid")
            points.append({"x": point["x"][:80], "y": point["y"][:80]})
        series.append({"name": item["name"][:160], "points": points})
    limitations = [item[:300] for item in raw_limitations[:12] if isinstance(item, str)]
    if len(limitations) != len(raw_limitations[:12]):
        raise ValueError("structured visual limitations are invalid")
    return chart_type[:80], axis("x_axis"), axis("y_axis"), series, limitations


@dataclass(frozen=True)
class ModelResult:
    summary: str
    plain_explanation: str
    deep_analysis: str
    evidence_status: str


@dataclass(frozen=True)
class AnalysisReportResult:
    report_markdown: str
    evidence_status: str


@dataclass(frozen=True)
class VisualModelResult:
    analysis_markdown: str
    evidence_status: str
    model_name: str


@dataclass(frozen=True)
class VisualStructuredDataResult:
    chart_type: str
    x_axis: dict[str, str]
    y_axis: dict[str, str]
    series: list[dict[str, object]]
    limitations: list[str]
    evidence_status: str
    model_name: str


@dataclass(frozen=True)
class KnowledgeContext:
    citation_id: int
    paper_title: str
    page_number: int | None
    section: str
    source_scope: str
    excerpt: str


@dataclass(frozen=True)
class KnowledgeAnswerResult:
    answer_markdown: str
    evidence_status: str
    model_name: str


@dataclass(frozen=True)
class ModelListResult:
    ok: bool
    models: list[str]
    message: str


@dataclass(frozen=True)
class StructuredTaskResult:
    data: dict[str, object]
    evidence_status: str
    model_name: str


class ModelProviderError(RuntimeError):
    """A model failure safe to expose without credentials or response bodies."""


class ModelProvider(Protocol):
    name: str
    supports_vision: bool
    def analyze(
        self,
        title: str,
        text: str,
        *,
        article_type: str = "",
        evidence_scope: str = "",
    ) -> ModelResult: ...
    def analyze_report(
        self,
        title: str,
        text: str,
        report_type: AnalysisReportType,
        *,
        article_type: str = "",
        evidence_scope: str = "",
    ) -> AnalysisReportResult: ...
    def analyze_visual(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualModelResult: ...
    def extract_visual_data(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualStructuredDataResult: ...
    def answer_question(
        self,
        question: str,
        contexts: list[KnowledgeContext],
    ) -> KnowledgeAnswerResult: ...
    def generate_learning_cards(self, prompt: str, valid_evidence_ids: set[str]) -> LearningCardsResult: ...
    def generate_learning_quiz(self, prompt: str, valid_positions: set[int], valid_evidence_ids: set[str], schema_version: str = "learning-quiz-schema-v1") -> LearningQuizResult: ...
    def generate_learning_feedback(self, prompt: str) -> LearningFeedbackResult: ...
    def generate_structured_task(self, prompt: str, task_type: str, *, max_tokens: int | None = None) -> StructuredTaskResult: ...
    def test_connection(self) -> tuple[bool, str]: ...
    def list_models(self) -> ModelListResult: ...


class MockModelProvider:
    name = "mock"
    supports_vision = True

    def _legacy_analyze(
        self,
        title: str,
        text: str,
        *,
        article_type: str = "",
        evidence_scope: str = "",
    ) -> ModelResult:
        excerpt = " ".join(text.split())[:240] or "未提取到足够正文"
        scope = evidence_scope or "证据范围未标明"
        if "综述" in article_type or "review" in article_type.lower():
            deep = (
                "## 1. 领域问题地图与真正瓶颈\n\n**AI归纳（Mock 演示）**：仅展示综述解析骨架。\n\n"
                "## 2. 文献分类逻辑及分类是否合理\n\n**尚不确定**：Mock 未执行真实判断。\n\n"
                "## 3. 各路线解决什么\n\n**尚不确定**。\n\n## 4. 各路线的证据、共识与争议\n\n**尚不确定**。\n\n"
                "## 5. 各路线优劣与适用条件\n\n**AI质疑（Mock 演示）**：需依据全文核验。\n\n"
                "## 6. 作者自己的判断及证据基础\n\n**尚不确定**。\n\n## 7. 真正贡献与常规整理\n\n**尚不确定**。\n\n"
                "## 8. 未解决科学问题\n\n**AI质疑（Mock 演示）**：未执行真实判断。\n\n"
                "## 9. 下一代研究路线与关键验证\n\n**AI假设（Mock 演示）**：未提出真实实验。\n\n"
                "## 10. 审稿人/导师会追问的问题\n\n1. 分类边界是否一致？\n2. 反例是否纳入？\n\n"
                "## 11. 我读完应该记住的领域逻辑\n\n**AI归纳（Mock 演示）**：请配置真实模型后生成。"
            )
        else:
            claims = "\n\n".join(
                f"### Claim–Evidence {index}\n- Claim：**尚不确定**\n- 证据：未定位\n- 证据强度：证据不足\n- 边界：Mock 未执行真实分析。"
                for index in range(1, 4)
            )
            questions = "\n".join(f"{index}. 关键对照或证据边界是否充分？（Mock 占位）" for index in range(1, 6))
            deep = (
                "## 1. 论文到底解决什么问题\n\n**AI归纳（Mock 演示）**：仅展示研究论文解析骨架。\n\n"
                "## 2. 作者核心假设\n\n**尚不确定**：Mock 未执行真实判断。\n\n"
                "## 3. 整篇论文论证路线\n\n**尚不确定**：需从全文逐组实验核验。\n\n"
                f"## 4. 核心 Claim–Evidence\n\n{claims}\n\n"
                "## 5. 核心结果的物理/化学意义\n\n**尚不确定**。\n\n"
                "## 6. 机制分析\n\n**AI质疑（Mock 演示）**：高级表征本身不能证明机制。\n\n"
                "## 7. 实验设计审查\n\n**尚不确定**：需核验对照、变量、统计与测试条件。\n\n"
                "## 8. 创新性拆解\n\n**尚不确定**。\n\n"
                f"## 9. 审稿人质疑\n\n{questions}\n\n"
                "## 10. 论文边界\n\n**AI质疑（Mock 演示）**：当前不作全文级断言。\n\n"
                "## 11. 下一步最有价值实验\n\n**AI假设（Mock 演示）**：未提出真实实验。\n\n"
                "## 12. 我读完这篇论文应该记住的核心逻辑\n\n**AI归纳（Mock 演示）**：请配置真实模型后生成。"
            )
        return ModelResult(
            summary=(f"## 一句话贡献\n\n**尚不确定**：Mock 不生成真实论文结论。\n\n"
                     f"## 30 秒总结\n\n证据范围：{scope}。解析文本节选：{excerpt}"),
            plain_explanation=("## 本科生解释\n\n**AI归纳（Mock 演示）**：这里将解释研究问题。\n\n"
                               "## 前置知识\n\n尚不确定。\n\n## 关键因果关系\n\n尚不确定。\n\n"
                               "## 类比边界\n\nMock 类比不能代替论文证据。"),
            deep_analysis=deep,
            evidence_status="AI推断（Mock 演示）",
        )

    def analyze_report(
        self,
        title: str,
        text: str,
        report_type: AnalysisReportType,
        *,
        article_type: str = "",
        evidence_scope: str = "",
    ) -> AnalysisReportResult:
        legacy = self._legacy_analyze(
            title,
            text,
            article_type=article_type,
            evidence_scope=evidence_scope,
        )
        reports = {
            AnalysisReportType.quick_understanding: legacy.summary,
            AnalysisReportType.layman_understanding: legacy.plain_explanation,
            AnalysisReportType.reviewer_analysis: legacy.deep_analysis,
        }
        return AnalysisReportResult(reports[report_type], legacy.evidence_status)

    def analyze(
        self,
        title: str,
        text: str,
        *,
        article_type: str = "",
        evidence_scope: str = "",
    ) -> ModelResult:
        reports = {
            report_type: self.analyze_report(
                title,
                text,
                report_type,
                article_type=article_type,
                evidence_scope=evidence_scope,
            )
            for report_type in AnalysisReportType
        }
        return ModelResult(
            reports[AnalysisReportType.quick_understanding].report_markdown,
            reports[AnalysisReportType.layman_understanding].report_markdown,
            reports[AnalysisReportType.reviewer_analysis].report_markdown,
            reports[AnalysisReportType.reviewer_analysis].evidence_status,
        )

    def test_connection(self) -> tuple[bool, str]:
        return True, "Mock 模型已就绪（不消耗 API 费用）"

    def list_models(self) -> ModelListResult:
        return ModelListResult(True, ["mock-research-copilot"], "Mock 模型已就绪")

    def analyze_visual(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualModelResult:
        excerpt = page_text.strip()[:1200] or "无法确认"
        _, subfigures = _bound_figure_parts(page_text)
        subfigure_reports = "\n\n".join(
            f"### 子图 {label}\n\n**无法确认**：Mock 不猜测该子图的坐标、图例、样品、条件或趋势。"
            for label in subfigures
        ) or "### 子图边界无法确认\n\n**无法确认**：Mock 不虚构子图。"
        return VisualModelResult(
            analysis_markdown=(
                f"## 1. 上下文绑定\n\n**图注/正文事实（Mock 输入）**\n\n{excerpt}\n\n"
                "## 2. 作者为什么画这张图\n\n**无法确认**：Mock 不生成真实实验目的。\n\n"
                f"## 3. 子图逐项审稿人式解读\n\n{subfigure_reports}\n\n"
                "## 4. Figure 整体论证作用\n\n**无法确认**：Mock 只验证 a→b→c→d 独立结构，不编造论证链。\n\n"
                "## 5. Claim–Evidence 证据链\n\n**AI归纳（Mock 演示）**：未调用真实视觉模型，不能建立论文 Claim。\n\n"
                "## 6. 替代解释与证据边界\n\n**AI质疑（Mock 演示）**：单凭这张图不能证明机制、因果关系或体相过程。\n\n"
                "## 7. 联合证据与审稿人追问\n\n**无法确认**：需结合正文指定的其他 Figure/表征并补充有判别力的对照实验。\n\n"
                f"## 8. 一句话审稿结论\n\n《{title}》的 **{caption}** 尚未进行真实图像分析，证明程度无法确认。"
            ),
            evidence_status="AI推断（Mock 图像演示）",
            model_name="mock-vision",
        )

    def extract_visual_data(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualStructuredDataResult:
        return VisualStructuredDataResult(
            chart_type="unknown",
            x_axis={"label": "", "unit": ""},
            y_axis={"label": "", "unit": ""},
            series=[],
            limitations=["Mock 演示不读取真实图像数值，请人工核对原图。"],
            evidence_status="AI推断（Mock 演示）",
            model_name="mock-vision",
        )

    def answer_question(
        self,
        question: str,
        contexts: list[KnowledgeContext],
    ) -> KnowledgeAnswerResult:
        markers = "、".join(
            f"[证据{context.citation_id}]" for context in contexts[:3]
        )
        first_excerpt = (
            contexts[0].excerpt[:260] if contexts else "未检索到可用论文片段"
        )
        return KnowledgeAnswerResult(
            answer_markdown=(
                "## Mock 论文库回答\n\n"
                f"问题：{question}\n\n"
                f"检索到的原文线索为：{first_excerpt} {markers}\n\n"
                "当前为 Mock 演示，系统没有调用真实语言模型；请结合下方原文证据核验。"
            ),
            evidence_status="AI归纳（Mock 论文库问答演示）",
            model_name="mock-research-copilot",
        )

    def generate_learning_cards(self, prompt: str, valid_evidence_ids: set[str]) -> LearningCardsResult:
        evidence_id = sorted(valid_evidence_ids)[0]
        concepts = ["科学问题", "核心假设", "材料设计", "结构表征", "电化学性能", "机制证据", "替代解释", "证据边界"]
        return LearningCardsResult(
            [
                LearningCardDraft(
                    concept,
                    f"**AI归纳（Mock 演示）**：围绕{concept}建立从原文事实到科研判断的学习框架，并区分直接证据与推断。",
                    f"{concept}决定了论文论证链中第 {index} 个关键环节。",
                    "不要把相关性、单一表征或作者解释直接等同于机制已经证明。",
                    [evidence_id],
                )
                for index, concept in enumerate(concepts, start=1)
            ],
            "mock-research-copilot",
        )

    def generate_learning_quiz(self, prompt: str, valid_positions: set[int], valid_evidence_ids: set[str], schema_version: str = "learning-quiz-schema-v1") -> LearningQuizResult:
        positions = sorted(valid_positions)
        evidence = [sorted(valid_evidence_ids)[0]] if valid_evidence_ids else []
        questions: list[LearningQuestionDraft] = []
        choice_count = 4 if schema_version == "learning-quiz-schema-v2" else 6
        short_count = 3 if schema_version == "learning-quiz-schema-v2" else 4
        for index in range(choice_count):
            questions.append(LearningQuestionDraft(
                "multiple_choice",
                f"第 {index + 1} 题：判断论文证据边界时，哪种做法最严谨？",
                ["A. 区分直接证据与推断", "B. 只看期刊等级", "C. 只看单张图", "D. 忽略对照实验"],
                "A",
                "应把可观察事实、作者解释和 AI 归纳分开。",
                ["能识别证据类型", "能说明单项证据边界"],
                [positions[index % len(positions)]],
                evidence,
            ))
        if schema_version == "learning-quiz-schema-v2":
            for index in range(2):
                questions.append(LearningQuestionDraft(
                    "true_false",
                    f"判断题 {index + 1}：单一表征足以独立证明材料机制。",
                    [],
                    "错误",
                    "机制结论需要相互独立的证据链与排他性对照。",
                    ["区分相关性与因果性"],
                    [positions[index % len(positions)]],
                    evidence,
                ))
            for index in range(2):
                questions.append(LearningQuestionDraft(
                    "fill_blank",
                    f"填空题 {index + 1}：科研论证常用 ____–Evidence 结构。",
                    [],
                    "Claim Evidence",
                    "Claim 应与可核验 Evidence 明确绑定。",
                    ["写出 Claim", "绑定 Evidence"],
                    [positions[index % len(positions)]],
                    evidence,
                    ["Claim Evidence", "claim-evidence"],
                ))
        for index in range(short_count):
            questions.append(LearningQuestionDraft(
                "short_answer",
                f"第 {index + 1} 题：用 Claim–Evidence 结构说明一个关键结论及其边界。",
                [],
                "",
                "参考回答应包含 Claim、原始证据、证据类型、替代解释和未证明内容。",
                ["写出 Claim", "绑定证据", "说明替代解释与边界"],
                [positions[index % len(positions)]],
                evidence,
            ))
        return LearningQuizResult(questions, "mock-research-copilot")

    def generate_learning_feedback(self, prompt: str) -> LearningFeedbackResult:
        return LearningFeedbackResult(
            "**AI归纳（Mock 演示）**：请逐条对照参考要点，并明确区分直接证据、作者解释与推断边界。",
            "mock-research-copilot",
            "基于学习包证据快照",
        )

    def generate_structured_task(self, prompt: str, task_type: str, *, max_tokens: int | None = None) -> StructuredTaskResult:
        if task_type == "research-reading-highlights-v1":
            source = json.loads(prompt.split("\nSOURCE_ITEMS=", 1)[1])
            return StructuredTaskResult(
                {"items": [{"key": item["key"], "title_zh": "研究内容速览（Mock 演示）", "points": ["AI推断（Mock 演示）：此处展示中文阅读重点。", "Mock 未调用真实模型翻译或归纳原文。", "请打开原文核对标题与摘要中的具体信息。"]} for item in source]},
                "AI推断（Mock 演示）", "mock-research-copilot",
            )
        if task_type == "paper-glossary-generate-v1":
            terms = ["层间滑移", "氧氧化还原", "阴离子氧化还原", "层状氧化物", "P2–O2相变", "相变应力", "比容量", "循环稳定性", "能量密度", "离子扩散", "晶格畸变", "电荷补偿", "XRD", "HAADF-STEM", "mRIXS", "P2", "P3", "EPR"]
            return StructuredTaskResult(
                {"terms": [{"term": term, "explanation": f"{term}的通用概念示例；请结合论文原文核对。"} for term in terms]},
                "AI推断（Mock 演示）", "mock-research-copilot",
            )
        if task_type == "paper-glossary-ask-v1":
            return StructuredTaskResult(
                {"answer": "这是通用概念的 Mock 演示回答；具体论文结论请返回原文证据页签核对。"},
                "AI推断（Mock 演示）", "mock-research-copilot",
            )
        if task_type == "contest_rules":
            citation = next(iter(re.findall(r"\[(S\d+)\]", prompt)), "S1")
            date_match = re.search(r"(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})", prompt)
            deadline = (
                f"{date_match.group(1)}-{int(date_match.group(2)):02d}-{int(date_match.group(3)):02d}"
                if date_match else None
            )
            rubric_items = []
            for title in ("创新性", "可行性", "答辩"):
                match = re.search(title + r"\s*(\d+(?:\.\d+)?)\s*分", prompt)
                if match:
                    rubric_items.append({"title": title, "description": f"按{title}要求准备证据。", "weight": float(match.group(1)), "citations": [citation]})
            return StructuredTaskResult(
                {
                    "rules": [{"title": "申报截止日期", "description": "在截止日前完成申报。", "deadline": deadline, "citations": [citation]}],
                    "rubric_items": rubric_items or [{"title": "项目质量", "description": "按竞赛通知核对。", "weight": None, "citations": [citation]}],
                },
                "AI推断（Mock 演示）",
                "mock-research-copilot",
            )
        if task_type == "contest_rubric":
            items = []
            has_content = "PROJECT_CONTENT_PRESENT=true" in prompt
            for item_id, title in re.findall(r"R(\d+)\|([^\n]+)", prompt):
                items.append({
                    "rubric_item_id": int(item_id),
                    "status": "partial" if has_content else "missing",
                    "evidence": ["项目结构化内容"] if has_content else [],
                    "questions": [f"请补充能够直接支撑“{title.strip()}”的可核验证据。"],
                })
            return StructuredTaskResult({"items": items}, "AI推断（Mock 演示）", "mock-research-copilot")
        if task_type == "contest_defense":
            return StructuredTaskResult(
                {
                    "question": "你的核心创新与已有工作的可判别差异是什么？",
                    "feedback": "AI推断（Mock 演示）：请把创新点与直接证据、对照组及证据边界逐一对应。",
                },
                "AI推断（Mock 演示）",
                "mock-research-copilot",
            )
        if task_type == "research_idea":
            evidence_ids = re.findall(r"\b[PD]\d+\b", prompt)
            cited = "、".join(evidence_ids) or "用户选择的证据"
            return StructuredTaskResult(
                {
                    "title": "基于所选证据的可证伪研究选题",
                    "hypothesis": "所选变量之间存在可通过对照实验检验的关系。",
                    "evidence": f"当前依据：{cited}。",
                    "novelty": "AI推断（Mock 演示）：需与既有工作逐项核对。",
                    "falsification": "若对照组与实验组无可重复差异，则假设不成立。",
                    "feasibility": "需结合现有设备、时间和样本量人工确认。",
                    "resources": "待填写设备、样品、工时与人员约束。",
                    "evidence_gaps": "缺少独立重复、反例和外部验证证据。",
                },
                "AI推断（Mock 演示）",
                "mock-research-copilot",
            )
        if task_type == "experiment_review":
            return StructuredTaskResult(
                {"review": "AI推断（Mock 演示）：请补齐变量、对照、重复、随机化、测量、统计、停止标准、资源与风险，并避免把相关性写成因果。"},
                "AI推断（Mock 演示）",
                "mock-research-copilot",
            )
        raise ModelProviderError("Mock 不支持该结构化任务")


class UnconfiguredProvider:
    name = "unconfigured"
    supports_vision = False

    def analyze(
        self,
        title: str,
        text: str,
        *,
        article_type: str = "",
        evidence_scope: str = "",
    ) -> ModelResult:
        return ModelResult("尚未配置模型", "尚未配置模型，PDF 已完成本地解析。", "请在系统设置中配置模型 API 密钥，或切换到 Mock 模式。", "尚不确定")

    def analyze_report(
        self,
        title: str,
        text: str,
        report_type: AnalysisReportType,
        *,
        article_type: str = "",
        evidence_scope: str = "",
    ) -> AnalysisReportResult:
        raise ModelProviderError("尚未配置文本模型；请在系统设置中配置模型或切换到 Mock 模式")

    def test_connection(self) -> tuple[bool, str]:
        return False, "尚未配置模型 API 密钥"

    def list_models(self) -> ModelListResult:
        return ModelListResult(False, [], "尚未配置模型 API 密钥")

    def analyze_visual(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualModelResult:
        raise ModelProviderError("尚未配置支持图像分析的模型")

    def extract_visual_data(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualStructuredDataResult:
        raise ModelProviderError("尚未配置支持图像分析的模型")

    def answer_question(
        self,
        question: str,
        contexts: list[KnowledgeContext],
    ) -> KnowledgeAnswerResult:
        raise ModelProviderError(
            "尚未配置文本模型；论文索引仍然保留，请先在系统设置中配置模型"
        )

    def generate_learning_cards(self, prompt: str, valid_evidence_ids: set[str]) -> LearningCardsResult:
        raise ModelProviderError("尚未配置文本模型，无法生成知识卡片")

    def generate_learning_quiz(self, prompt: str, valid_positions: set[int], valid_evidence_ids: set[str], schema_version: str = "learning-quiz-schema-v1") -> LearningQuizResult:
        raise ModelProviderError("尚未配置文本模型，无法生成自测题")

    def generate_learning_feedback(self, prompt: str) -> LearningFeedbackResult:
        raise ModelProviderError("尚未配置文本模型，无法生成简答反馈")

    def generate_structured_task(self, prompt: str, task_type: str, *, max_tokens: int | None = None) -> StructuredTaskResult:
        raise ModelProviderError("尚未配置文本模型，无法执行结构化科研任务")


def _knowledge_prompt(
    question: str,
    contexts: list[KnowledgeContext],
) -> str:
    evidence_parts: list[str] = []
    for context in contexts:
        if context.source_scope == "note":
            location = "用户笔记（非论文原文证据，无页码）"
        elif context.page_number is not None:
            location = f"第 {context.page_number} 页"
        else:
            location = "摘要（无全文页码）"
        evidence_parts.append(
            f"[证据{context.citation_id}]\n"
            f"论文：{context.paper_title}\n"
            f"定位：{location}，{context.section}\n"
            f"来源等级：{context.source_scope}\n"
            f"原文片段：{context.excerpt}"
        )
    return (
        "你是个人科研论文库问答助手。必须使用简体中文，只能依据下列编号证据回答。"
        "每项重要结论后必须标注一个或多个 [证据N]。证据不足或互相矛盾时必须明确"
        "说明，不能用模型记忆补充事实。不得生成证据中没有的作者、DOI、页码、图号、"
        "实验数据或因果结论；不得把摘要来源说成全文。可以使用 Markdown，化学式和"
        "用户笔记只代表用户自己的记录，不能用来证明作者结论，也不能提高论文证据"
        "置信度。"
        "行内公式使用 $...$，独立方程使用 $$...$$。\n\n"
        f"用户问题：{question}\n\n"
        + "\n\n".join(evidence_parts)
    )


class OpenAICompatibleProvider:
    name = "openai_compatible"
    supports_vision = False

    def __init__(self, api_key: str, base_url: str, model_name: str, timeout_seconds: int) -> None:
        self.api_key, self.base_url, self.model_name, self.timeout_seconds = api_key, base_url.rstrip("/"), model_name, timeout_seconds

    def _chat_content(
        self,
        prompt: str,
        *,
        max_tokens: int | None = None,
        temperature: float | None = None,
        json_mode: bool = False,
        non_thinking: bool = False,
        strict_max_tokens: bool = False,
        timeout: int | None = None,
    ) -> str:
        payload: dict[str, object] = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
        }
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens
        if temperature is not None:
            payload["temperature"] = temperature
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        if non_thinking and self.name == "deepseek":
            payload["thinking"] = {"type": "disabled"}
        if json_mode and self.name == "zhipu" and self.model_name.lower() == "glm-4.7":
            payload["thinking"] = {"type": "disabled"}
        response = httpx.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json=payload,
            timeout=timeout or self.timeout_seconds,
        )
        response.raise_for_status()
        choice = response.json()["choices"][0]
        if choice.get("finish_reason") == "length":
            raise ModelProviderError("模型输出达到上限，报告未保存；请稍后重试")
        content = choice["message"]["content"]
        if not isinstance(content, str) or not content.strip():
            raise ValueError("empty model response")
        return content

    def test_connection(self) -> tuple[bool, str]:
        try:
            response = httpx.get(f"{self.base_url}/models", headers={"Authorization": f"Bearer {self.api_key}"}, timeout=self.timeout_seconds)
            return (response.is_success, "模型连接成功" if response.is_success else f"模型服务返回 {response.status_code}")
        except httpx.HTTPError:
            return False, "无法连接模型服务，请检查基础地址、密钥和网络"

    def list_models(self) -> ModelListResult:
        try:
            response = httpx.get(
                f"{self.base_url}/models",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
            models = [
                item["id"]
                for item in payload.get("data", [])
                if isinstance(item, dict) and isinstance(item.get("id"), str)
            ]
            return ModelListResult(True, models, f"已发现 {len(models)} 个模型")
        except (httpx.HTTPError, ValueError, TypeError, KeyError):
            return ModelListResult(False, [], "无法读取模型列表，请检查模型连接")

    def analyze(
        self,
        title: str,
        text: str,
        *,
        article_type: str = "",
        evidence_scope: str = "",
    ) -> ModelResult:
        reports = {
            report_type: self.analyze_report(
                title,
                text,
                report_type,
                article_type=article_type,
                evidence_scope=evidence_scope,
            )
            for report_type in AnalysisReportType
        }
        return ModelResult(
            reports[AnalysisReportType.quick_understanding].report_markdown,
            reports[AnalysisReportType.layman_understanding].report_markdown,
            reports[AnalysisReportType.reviewer_analysis].report_markdown,
            reports[AnalysisReportType.reviewer_analysis].evidence_status,
        )

    def analyze_report(
        self,
        title: str,
        text: str,
        report_type: AnalysisReportType,
        *,
        article_type: str = "",
        evidence_scope: str = "",
    ) -> AnalysisReportResult:
        context = PaperAnalysisContext(text[:18000], evidence_scope, article_type)
        prompt = build_report_prompt(title, context, report_type)
        max_tokens = {
            AnalysisReportType.quick_understanding: 16000,
            AnalysisReportType.layman_understanding: 12000,
            AnalysisReportType.reviewer_analysis: 20000,
        }[report_type]
        request_timeout = max(self.timeout_seconds, {
            AnalysisReportType.quick_understanding: 180,
            AnalysisReportType.layman_understanding: 180,
            AnalysisReportType.reviewer_analysis: 300,
        }[report_type])
        try:
            content = self._chat_content(prompt, temperature=0.2, max_tokens=max_tokens, json_mode=True, timeout=request_timeout)
            parsed = parse_report_result(content, "AI归纳（待原文证据核验）", report_type)
            return AnalysisReportResult(parsed.report_markdown, parsed.evidence_status)
        except httpx.TimeoutException as exc:
            raise ModelProviderError("模型生成超时，原报告保持不变；请稍后重试") from exc
        except httpx.HTTPStatusError as exc:
            raise ModelProviderError(f"模型接口返回 HTTP {exc.response.status_code}，原报告保持不变") from exc
        except httpx.HTTPError as exc:
            raise ModelProviderError("模型连接中断，原报告保持不变；请检查连接后重试") from exc
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise ModelProviderError("模型返回不符合当前报告格式，原报告保持不变") from exc

    def analyze_visual(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualModelResult:
        raise ModelProviderError("当前模型接口未声明支持图像分析")

    def extract_visual_data(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualStructuredDataResult:
        raise ModelProviderError("当前模型接口未声明支持图像分析")

    def answer_question(
        self,
        question: str,
        contexts: list[KnowledgeContext],
    ) -> KnowledgeAnswerResult:
        try:
            content = self._chat_content(_knowledge_prompt(question, contexts), temperature=0.1)
            return KnowledgeAnswerResult(
                content.strip(),
                "AI归纳（基于个人论文库检索证据，待原文核验）",
                self.model_name,
            )
        except (httpx.HTTPError, ValueError, TypeError, KeyError, IndexError) as exc:
            raise ModelProviderError(
                "论文库问答失败，请检查文本模型连接后重试"
            ) from exc

    def _learning_json(self, prompt: str, max_tokens: int, *, non_thinking: bool = False,
                       strict_max_tokens: bool = False) -> str:
        try:
            return self._chat_content(
                prompt, temperature=0.15, max_tokens=max_tokens,
                json_mode=True, non_thinking=non_thinking, strict_max_tokens=strict_max_tokens,
                timeout=max(self.timeout_seconds, 240),
            )
        except (httpx.HTTPError, ValueError, TypeError, KeyError, IndexError) as exc:
            raise ModelProviderError("学习内容生成失败，请检查文本模型连接后重试") from exc

    def generate_learning_cards(self, prompt: str, valid_evidence_ids: set[str]) -> LearningCardsResult:
        try:
            return parse_cards_result(self._learning_json(prompt, 16000), self.model_name, valid_evidence_ids)
        except ValueError as exc:
            raise ModelProviderError("知识卡片返回不符合 learning-cards-v1 schema") from exc

    def generate_learning_quiz(self, prompt: str, valid_positions: set[int], valid_evidence_ids: set[str], schema_version: str = "learning-quiz-schema-v1") -> LearningQuizResult:
        try:
            return parse_quiz_result(self._learning_json(prompt, 12000), self.model_name, valid_positions, valid_evidence_ids, schema_version)
        except ValueError as exc:
            raise ModelProviderError("自测题返回不符合 learning-quiz-v1 schema") from exc

    def generate_learning_feedback(self, prompt: str) -> LearningFeedbackResult:
        try:
            return parse_feedback_result(self._learning_json(prompt, 4000), self.model_name)
        except ValueError as exc:
            raise ModelProviderError("简答反馈返回不符合 learning-short-feedback-v1 schema") from exc

    def generate_structured_task(self, prompt: str, task_type: str, *, max_tokens: int | None = None) -> StructuredTaskResult:
        try:
            compact_task = task_type in {"research_idea", "experiment_review", "campus-notice-v1"} or task_type.startswith("paper-glossary-")
            raw = self._learning_json(prompt, max_tokens or (2400 if compact_task else 12000),
                                      non_thinking=compact_task, strict_max_tokens=max_tokens is not None)
            parsed = json.loads(raw)
            if not isinstance(parsed, dict):
                raise ValueError("structured task result is not an object")
            return StructuredTaskResult(
                parsed,
                "AI归纳（结构化科研任务，待用户确认）",
                self.model_name,
            )
        except (ValueError, TypeError) as exc:
            raise ModelProviderError(f"{task_type} 返回不符合结构化 schema") from exc


class OpenAIChatVisionProvider(OpenAICompatibleProvider):
    """Image input shared by vendors using chat completions."""
    supports_vision = False

    def analyze_visual(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualModelResult:
        image_data = base64.b64encode(png_bytes).decode("ascii")
        try:
            content = ""
            for attempt in range(2):
                prompt = _visual_analysis_prompt(
                    title,
                    caption,
                    page_text,
                    retry_in_chinese=attempt == 1,
                )
                response = httpx.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": getattr(self, "vision_model", "") or self.model_name,
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/png;base64,{image_data}",
                                            "detail": "high",
                                        },
                                    },
                                ],
                            }
                        ],
                        "temperature": 0.2,
                    },
                    timeout=self.timeout_seconds,
                )
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                if not isinstance(content, str) or not content.strip():
                    raise ModelProviderError("视觉模型未返回可用分析")
                if attempt == 0 and _visual_answer_needs_chinese_retry(content):
                    continue
                break
            return VisualModelResult(
                analysis_markdown=content.strip(),
                evidence_status="AI归纳（基于选中 PDF 页面，待人工核验）",
                model_name=getattr(self, "vision_model", "") or self.model_name,
            )
        except ModelProviderError:
            raise
        except (httpx.HTTPError, ValueError, TypeError, KeyError, IndexError) as exc:
            raise ModelProviderError("图表分析失败，请检查模型连接后重试") from exc

    def extract_visual_data(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualStructuredDataResult:
        image_data = base64.b64encode(png_bytes).decode("ascii")
        try:
            response = httpx.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": getattr(self, "vision_model", "") or self.model_name,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": _structured_visual_prompt(title, caption, page_text)},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/png;base64,{image_data}",
                                        "detail": "high",
                                    },
                                },
                            ],
                        }
                    ],
                    "temperature": 0.1,
                },
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            chart_type, x_axis, y_axis, series, limitations = _structured_visual_data(content)
            return VisualStructuredDataResult(
                chart_type=chart_type,
                x_axis=x_axis,
                y_axis=y_axis,
                series=series,
                limitations=limitations,
                evidence_status="AI推断（基于选中图表区域，待人工核验）",
                model_name=getattr(self, "vision_model", "") or self.model_name,
            )
        except (httpx.HTTPError, ValueError, TypeError, KeyError, IndexError) as exc:
            raise ModelProviderError("图表结构化提取失败，请检查模型连接后重试") from exc


class DeepSeekProvider(OpenAIChatVisionProvider):
    name = "deepseek"

    def __init__(self, api_key: str, base_url: str, model_name: str, timeout_seconds: int) -> None:
        super().__init__(
            api_key=api_key,
            base_url=base_url.strip() or DEEPSEEK_BASE_URL,
            model_name=model_name.strip() or DEEPSEEK_DEFAULT_MODEL,
            timeout_seconds=timeout_seconds,
        )
        self.supports_vision = "vision" in self.model_name.lower() or self.model_name == "deepseek-flash"


class ZhipuProvider(OpenAIChatVisionProvider):
    name = "zhipu"
    supports_vision = False

    def __init__(self, api_key: str, base_url: str, model_name: str, timeout_seconds: int, vision_model: str = "") -> None:
        OpenAICompatibleProvider.__init__(
            self,
            api_key=api_key,
            base_url=base_url.strip() or ZHIPU_BASE_URL,
            model_name=model_name.strip() or ZHIPU_DEFAULT_MODEL,
            timeout_seconds=timeout_seconds,
        )
        self.vision_model = vision_model.strip()
        self.supports_vision = (self.vision_model or self.model_name) in {"glm-5.3-flash", "glm-5.3-flashx"}


class NamedCompatibleProvider(OpenAIChatVisionProvider):
    """Named OpenAI-compatible API with vendor endpoint and account model ID."""

    def __init__(self, provider: str, api_key: str, base_url: str, model_name: str, timeout_seconds: int, vision_model: str = "") -> None:
        default_url, default_model = COMPATIBLE_PROVIDER_DEFAULTS[provider]
        OpenAICompatibleProvider.__init__(self, api_key, base_url.strip() or default_url, model_name.strip() or default_model, timeout_seconds)
        self.name = provider
        self.vision_model = vision_model.strip()
        self.supports_vision = bool(self.vision_model)

    def _chat_content(self, prompt: str, **kwargs: object) -> str:
        # These vendors share chat completions, but JSON mode and sampling
        # parameters differ between models; prompts already request JSON.
        kwargs["json_mode"] = False
        kwargs["temperature"] = None
        return super()._chat_content(prompt, **kwargs)


class AnthropicProvider(OpenAICompatibleProvider):
    name = "anthropic"
    supports_vision = True

    def __init__(self, api_key: str, base_url: str, model_name: str, timeout_seconds: int) -> None:
        super().__init__(
            api_key, base_url.strip() or ANTHROPIC_BASE_URL,
            model_name.strip() or ANTHROPIC_DEFAULT_MODEL, timeout_seconds,
        )

    def _headers(self) -> dict[str, str]:
        return {"x-api-key": self.api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}

    def _output_limit(self, requested: int) -> int:
        # Fable 5.1 and Opus 5.5 always spend part of this limit on thinking.
        if self.model_name.startswith(("claude-fable-5-1", "claude-opus-5-5")):
            return max(requested, 8192)
        return requested

    def test_connection(self) -> tuple[bool, str]:
        result = self.list_models()
        return result.ok, "模型连接成功" if result.ok else result.message

    def list_models(self) -> ModelListResult:
        try:
            response = httpx.get(f"{self.base_url}/models", headers=self._headers(), timeout=self.timeout_seconds)
            response.raise_for_status()
            models = [item["id"] for item in response.json().get("data", []) if isinstance(item, dict) and isinstance(item.get("id"), str)]
            return ModelListResult(True, models, f"已发现 {len(models)} 个模型")
        except (httpx.HTTPError, ValueError, TypeError, KeyError):
            return ModelListResult(False, [], "无法读取模型列表，请检查模型连接")

    def _chat_content(self, prompt: str, *, max_tokens: int | None = None, timeout: int | None = None,
                      strict_max_tokens: bool = False, **_: object) -> str:
        if strict_max_tokens and max_tokens is not None and self._output_limit(max_tokens) > max_tokens:
            raise ModelProviderError("该模型的最低输出预算高于校园资讯设置的单条上限")
        response = httpx.post(
            f"{self.base_url}/messages",
            headers=self._headers(),
            json={
                "model": self.model_name,
                "max_tokens": self._output_limit(max_tokens or 4096),
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=timeout or self.timeout_seconds,
        )
        response.raise_for_status()
        body = response.json()
        if body.get("stop_reason") == "max_tokens":
            raise ModelProviderError("模型输出达到上限，报告未保存；请稍后重试")
        parts = [part["text"] for part in body.get("content", []) if isinstance(part, dict) and part.get("type") == "text" and isinstance(part.get("text"), str)]
        content = "\n".join(parts).strip()
        if not content:
            raise ValueError("empty model response")
        return content

    def _image_content(self, prompt: str, png_bytes: bytes) -> str:
        response = httpx.post(
            f"{self.base_url}/messages",
            headers=self._headers(),
            json={
                "model": self.model_name,
                "max_tokens": self._output_limit(4096),
                "messages": [{"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": base64.b64encode(png_bytes).decode("ascii")}},
                ]}],
            },
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        content = "\n".join(part["text"] for part in response.json().get("content", []) if isinstance(part, dict) and part.get("type") == "text" and isinstance(part.get("text"), str)).strip()
        if not content:
            raise ValueError("empty model response")
        return content

    def analyze_visual(self, title: str, caption: str, page_text: str, png_bytes: bytes) -> VisualModelResult:
        try:
            content = ""
            for attempt in range(2):
                content = self._image_content(
                    _visual_analysis_prompt(title, caption, page_text, retry_in_chinese=attempt == 1),
                    png_bytes,
                )
                if attempt == 0 and _visual_answer_needs_chinese_retry(content):
                    continue
                break
            return VisualModelResult(content, "AI归纳（基于选中 PDF 页面，待人工核验）", self.model_name)
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
            raise ModelProviderError("图表分析失败，请检查模型连接后重试") from exc

    def extract_visual_data(self, title: str, caption: str, page_text: str, png_bytes: bytes) -> VisualStructuredDataResult:
        try:
            content = self._image_content(_structured_visual_prompt(title, caption, page_text), png_bytes)
            chart_type, x_axis, y_axis, series, limitations = _structured_visual_data(content)
            return VisualStructuredDataResult(
                chart_type, x_axis, y_axis, series, limitations,
                "AI推断（基于选中图表区域，待人工核验）", self.model_name,
            )
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
            raise ModelProviderError("图表结构化提取失败，请检查模型连接后重试") from exc


class OpenAIProvider(OpenAICompatibleProvider):
    name = "openai"
    supports_vision = True

    def __init__(self, api_key: str, base_url: str, model_name: str, timeout_seconds: int) -> None:
        super().__init__(
            api_key=api_key,
            base_url=base_url.strip() or OPENAI_BASE_URL,
            model_name=model_name.strip() or OPENAI_DEFAULT_MODEL,
            timeout_seconds=timeout_seconds,
        )

    def _chat_content(self, prompt: str, *, max_tokens: int | None = None, timeout: int | None = None, **_: object) -> str:
        payload: dict[str, object] = {
            "model": self.model_name,
            "input": [{"role": "user", "content": prompt}],
            "store": False,
        }
        if max_tokens is not None:
            payload["max_output_tokens"] = max_tokens
        response = httpx.post(
            f"{self.base_url}/responses",
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=timeout or self.timeout_seconds,
        )
        response.raise_for_status()
        body = response.json()
        if body.get("status") == "incomplete":
            raise ModelProviderError("模型输出不完整，报告未保存；请稍后重试")
        content = body.get("output_text")
        if not isinstance(content, str) or not content.strip():
            content = "\n".join(
                part["text"]
                for output in body.get("output", []) if isinstance(output, dict)
                for part in output.get("content", [])
                if isinstance(part, dict) and part.get("type") == "output_text" and isinstance(part.get("text"), str)
            )
        if not content:
            raise ValueError("empty model response")
        return content

    def analyze_visual(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualModelResult:
        image_data = base64.b64encode(png_bytes).decode("ascii")
        try:
            content = ""
            for attempt in range(2):
                prompt = _visual_analysis_prompt(
                    title,
                    caption,
                    page_text,
                    retry_in_chinese=attempt == 1,
                )
                response = httpx.post(
                    f"{self.base_url}/responses",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model_name,
                        "input": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "input_text", "text": prompt},
                                    {
                                        "type": "input_image",
                                        "image_url": f"data:image/png;base64,{image_data}",
                                        "detail": "high",
                                    },
                                ],
                            }
                        ],
                        "store": False,
                    },
                    timeout=self.timeout_seconds,
                )
                response.raise_for_status()
                payload = response.json()
                content = payload.get("output_text")
                if not isinstance(content, str) or not content.strip():
                    parts: list[str] = []
                    for output in payload.get("output", []):
                        if not isinstance(output, dict):
                            continue
                        for item in output.get("content", []):
                            if (
                                isinstance(item, dict)
                                and item.get("type") == "output_text"
                                and isinstance(item.get("text"), str)
                            ):
                                parts.append(item["text"])
                    content = "\n".join(parts)
                if not isinstance(content, str) or not content.strip():
                    raise ModelProviderError("视觉模型未返回可用分析")
                if attempt == 0 and _visual_answer_needs_chinese_retry(content):
                    continue
                break
            return VisualModelResult(
                analysis_markdown=content.strip(),
                evidence_status="AI归纳（基于选中 PDF 页面，待人工核验）",
                model_name=self.model_name,
            )
        except ModelProviderError:
            raise
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
            raise ModelProviderError("图表分析失败，请检查模型连接后重试") from exc

    def extract_visual_data(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualStructuredDataResult:
        image_data = base64.b64encode(png_bytes).decode("ascii")
        try:
            response = httpx.post(
                f"{self.base_url}/responses",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model_name,
                    "input": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "input_text", "text": _structured_visual_prompt(title, caption, page_text)},
                                {"type": "input_image", "image_url": f"data:image/png;base64,{image_data}", "detail": "high"},
                            ],
                        }
                    ],
                    "store": False,
                },
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            content = response.json().get("output_text")
            chart_type, x_axis, y_axis, series, limitations = _structured_visual_data(content)
            return VisualStructuredDataResult(
                chart_type=chart_type,
                x_axis=x_axis,
                y_axis=y_axis,
                series=series,
                limitations=limitations,
                evidence_status="AI推断（基于选中图表区域，待人工核验）",
                model_name=self.model_name,
            )
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
            raise ModelProviderError("图表结构化提取失败，请检查模型连接后重试") from exc


class OllamaProvider:
    name = "ollama"
    supports_vision = False

    def __init__(
        self,
        base_url: str,
        model_name: str,
        timeout_seconds: int,
        vision_model: str = "",
    ) -> None:
        self.base_url = base_url.strip().rstrip("/") or OLLAMA_BASE_URL
        self.model_name = model_name.strip() or OLLAMA_DEFAULT_MODEL
        self.vision_model = vision_model.strip()
        self.supports_vision = bool(self.vision_model)
        self.timeout_seconds = timeout_seconds

    def list_models(self) -> ModelListResult:
        try:
            response = httpx.get(
                f"{self.base_url}/api/tags",
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
            models: list[str] = []
            for item in payload.get("models", []):
                if not isinstance(item, dict):
                    continue
                value = item.get("name") or item.get("model")
                if isinstance(value, str) and value.strip() and value not in models:
                    models.append(value)
            if not models:
                return ModelListResult(
                    False,
                    [],
                    "Ollama 已启动，但尚未安装模型",
                )
            return ModelListResult(True, models, f"已发现 {len(models)} 个本地模型")
        except (httpx.HTTPError, ValueError, TypeError):
            return ModelListResult(
                False,
                [],
                "无法连接 Ollama，请确认 Ollama 已启动并检查基础地址",
            )

    def test_connection(self) -> tuple[bool, str]:
        result = self.list_models()
        if not result.ok:
            return False, result.message
        if self.model_name not in result.models:
            return (
                False,
                f"已连接 Ollama，但未安装模型 {self.model_name}",
            )
        if self.vision_model and self.vision_model not in result.models:
            return (
                False,
                f"已连接 Ollama，但未安装视觉模型 {self.vision_model}；"
                f"请运行 ollama pull {self.vision_model}",
            )
        if self.vision_model:
            return (
                True,
                f"Ollama 已连接，文本模型 {self.model_name} 和视觉模型 "
                f"{self.vision_model} 均可用",
            )
        return True, f"Ollama 已连接，模型 {self.model_name} 可用"

    def analyze(
        self,
        title: str,
        text: str,
        *,
        article_type: str = "",
        evidence_scope: str = "",
    ) -> ModelResult:
        reports = {
            report_type: self.analyze_report(
                title,
                text,
                report_type,
                article_type=article_type,
                evidence_scope=evidence_scope,
            )
            for report_type in AnalysisReportType
        }
        return ModelResult(
            reports[AnalysisReportType.quick_understanding].report_markdown,
            reports[AnalysisReportType.layman_understanding].report_markdown,
            reports[AnalysisReportType.reviewer_analysis].report_markdown,
            reports[AnalysisReportType.reviewer_analysis].evidence_status,
        )

    def analyze_report(
        self,
        title: str,
        text: str,
        report_type: AnalysisReportType,
        *,
        article_type: str = "",
        evidence_scope: str = "",
    ) -> AnalysisReportResult:
        context = PaperAnalysisContext(text[:18000], evidence_scope, article_type)
        prompt = build_report_prompt(title, context, report_type)
        num_predict = {
            AnalysisReportType.quick_understanding: 3500,
            AnalysisReportType.layman_understanding: 6500,
            AnalysisReportType.reviewer_analysis: 11000,
        }[report_type]
        try:
            response = httpx.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model_name,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "format": "json",
                    "options": {
                        "temperature": 0.2,
                        "num_ctx": 32768,
                        "num_predict": num_predict,
                    },
                },
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
            if payload.get("done_reason") == "length":
                raise ModelProviderError("Ollama 输出达到上限，报告未保存；请稍后重试")
            content = payload["message"]["content"]
            parsed = parse_report_result(
                content,
                "AI归纳（Ollama 本地模型，待原文证据核验）",
                report_type,
            )
            return AnalysisReportResult(parsed.report_markdown, parsed.evidence_status)
        except httpx.TimeoutException as exc:
            raise ModelProviderError("Ollama 分析超时，原报告保持不变") from exc
        except httpx.HTTPError as exc:
            raise ModelProviderError("Ollama 连接失败，原报告保持不变") from exc
        except (ValueError, TypeError, KeyError) as exc:
            raise ModelProviderError("Ollama 返回不符合当前报告格式，原报告保持不变") from exc

    def analyze_visual(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualModelResult:
        if not self.vision_model:
            raise ModelProviderError(
                "尚未配置 Ollama 视觉模型，请在系统设置中填写视觉模型"
            )
        image_data = base64.b64encode(png_bytes).decode("ascii")
        try:
            content = ""
            for attempt in range(2):
                prompt = _visual_analysis_prompt(
                    title,
                    caption,
                    page_text,
                    retry_in_chinese=attempt == 1,
                )
                response = httpx.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.vision_model,
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt,
                                "images": [image_data],
                            }
                        ],
                        "stream": False,
                        "options": {
                            "temperature": 0.1,
                            "num_ctx": 16384,
                            "num_predict": 3600,
                        },
                    },
                    timeout=self.timeout_seconds,
                )
                response.raise_for_status()
                content = response.json()["message"]["content"]
                if not isinstance(content, str) or not content.strip():
                    raise ModelProviderError(
                        "Ollama 视觉模型未返回可用分析，请更换视觉模型后重试"
                    )
                if attempt == 0 and _visual_answer_needs_chinese_retry(content):
                    continue
                break
            return VisualModelResult(
                analysis_markdown=content.strip(),
                evidence_status=(
                    "AI归纳（Ollama 本地图像分析，待原文与图表人工核验）"
                ),
                model_name=self.vision_model,
            )
        except ModelProviderError:
            raise
        except httpx.TimeoutException as exc:
            raise ModelProviderError(
                "Ollama 图像分析超时，请增加调用超时或使用更小的视觉模型"
            ) from exc
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
            raise ModelProviderError(
                "Ollama 图像分析失败，请确认视觉模型已安装且支持图片"
            ) from exc

    def extract_visual_data(
        self,
        title: str,
        caption: str,
        page_text: str,
        png_bytes: bytes,
    ) -> VisualStructuredDataResult:
        if not self.vision_model:
            raise ModelProviderError(
                "尚未配置 Ollama 视觉模型，请在系统设置中填写视觉模型"
            )
        image_data = base64.b64encode(png_bytes).decode("ascii")
        try:
            response = httpx.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.vision_model,
                    "messages": [
                        {
                            "role": "user",
                            "content": _structured_visual_prompt(title, caption, page_text),
                            "images": [image_data],
                        }
                    ],
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0, "num_ctx": 8192, "num_predict": 2200},
                },
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            content = response.json()["message"]["content"]
            chart_type, x_axis, y_axis, series, limitations = _structured_visual_data(content)
            return VisualStructuredDataResult(
                chart_type=chart_type,
                x_axis=x_axis,
                y_axis=y_axis,
                series=series,
                limitations=limitations,
                evidence_status="AI推断（Ollama 本地图表区域提取，待人工核验）",
                model_name=self.vision_model,
            )
        except httpx.TimeoutException as exc:
            raise ModelProviderError(
                "Ollama 图表结构化提取超时，请增加调用超时或使用更小的视觉模型"
            ) from exc
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
            raise ModelProviderError(
                "Ollama 图表结构化提取失败，请确认视觉模型已安装且支持图片"
            ) from exc

    def answer_question(
        self,
        question: str,
        contexts: list[KnowledgeContext],
    ) -> KnowledgeAnswerResult:
        try:
            response = httpx.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model_name,
                    "messages": [
                        {
                            "role": "user",
                            "content": _knowledge_prompt(question, contexts),
                        }
                    ],
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_ctx": 8192,
                        "num_predict": 1400,
                    },
                },
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            content = response.json()["message"]["content"]
            if not isinstance(content, str) or not content.strip():
                raise ValueError("empty answer")
            return KnowledgeAnswerResult(
                content.strip(),
                "AI归纳（Ollama 本地模型，基于个人论文库检索证据）",
                self.model_name,
            )
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
            raise ModelProviderError(
                "Ollama 论文库问答失败，请确认文本模型已启动并适当增加超时时间"
            ) from exc

    def _learning_json(self, prompt: str, num_predict: int) -> str:
        try:
            response = httpx.post(
                f"{self.base_url}/api/chat",
                json={"model": self.model_name, "messages": [{"role": "user", "content": prompt}], "stream": False, "format": "json", "options": {"temperature": 0.15, "num_ctx": 32768, "num_predict": num_predict}},
                timeout=max(self.timeout_seconds, 240),
            )
            response.raise_for_status()
            return response.json()["message"]["content"]
        except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
            raise ModelProviderError("Ollama 学习内容生成失败，请检查本地文本模型") from exc

    def generate_learning_cards(self, prompt: str, valid_evidence_ids: set[str]) -> LearningCardsResult:
        try:
            return parse_cards_result(self._learning_json(prompt, 9000), self.model_name, valid_evidence_ids)
        except ValueError as exc:
            raise ModelProviderError("Ollama 知识卡片返回不符合 learning-cards-v1 schema") from exc

    def generate_learning_quiz(self, prompt: str, valid_positions: set[int], valid_evidence_ids: set[str], schema_version: str = "learning-quiz-schema-v1") -> LearningQuizResult:
        try:
            return parse_quiz_result(self._learning_json(prompt, 7000), self.model_name, valid_positions, valid_evidence_ids, schema_version)
        except ValueError as exc:
            raise ModelProviderError("Ollama 自测题返回不符合 learning-quiz-v1 schema") from exc

    def generate_learning_feedback(self, prompt: str) -> LearningFeedbackResult:
        try:
            return parse_feedback_result(self._learning_json(prompt, 3000), self.model_name)
        except ValueError as exc:
            raise ModelProviderError("Ollama 简答反馈返回不符合 learning-short-feedback-v1 schema") from exc

    def generate_structured_task(self, prompt: str, task_type: str, *, max_tokens: int | None = None) -> StructuredTaskResult:
        try:
            parsed = json.loads(self._learning_json(prompt, max_tokens or (1200 if task_type == "campus-notice-v1" else 9000)))
            if not isinstance(parsed, dict):
                raise ValueError("structured task result is not an object")
            return StructuredTaskResult(
                parsed,
                "AI归纳（Ollama 本地结构化任务，待用户确认）",
                self.model_name,
            )
        except (ValueError, TypeError) as exc:
            raise ModelProviderError(f"Ollama {task_type} 返回不符合结构化 schema") from exc


def make_provider(
    provider: str,
    api_key: str,
    base_url: str,
    model_name: str,
    timeout_seconds: int,
    vision_model: str = "",
) -> ModelProvider:
    if provider == "mock":
        return MockModelProvider()
    if provider == "ollama":
        return OllamaProvider(
            base_url,
            model_name,
            timeout_seconds,
            vision_model=vision_model,
        )
    if provider == "deepseek" and api_key:
        return DeepSeekProvider(api_key, base_url, model_name, timeout_seconds)
    if provider == "zhipu" and api_key:
        return ZhipuProvider(api_key, base_url, model_name, timeout_seconds, vision_model)
    if provider == "openai" and api_key:
        return OpenAIProvider(api_key, base_url, model_name, timeout_seconds)
    if provider == "openai_compatible" and api_key:
        return OpenAICompatibleProvider(api_key, base_url, model_name, timeout_seconds)
    if provider in COMPATIBLE_PROVIDER_DEFAULTS and api_key:
        return NamedCompatibleProvider(provider, api_key, base_url, model_name, timeout_seconds, vision_model)
    if provider == "anthropic" and api_key:
        return AnthropicProvider(api_key, base_url, model_name, timeout_seconds)
    return UnconfiguredProvider()


