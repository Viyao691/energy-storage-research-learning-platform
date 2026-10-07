from __future__ import annotations

import json

import pytest


def test_fulltext_context_keeps_page_grounding_and_priority_sections() -> None:
    from app.paper_analysis import build_paper_analysis_context

    pages = [
        "Title and Abstract: a sodium layered oxide study.",
        "Introduction: the unresolved air-stability bottleneck.",
        "Methods and Experimental: controlled humidity exposure.",
        "Background without a section cue.",
        "Results and Discussion. Figure 2 shows the phase transition.",
        "Conclusion: the coating slows degradation.",
    ]

    context = build_paper_analysis_context(
        page_texts=pages,
        abstract="",
        fallback_text="",
        article_type="研究论文",
        parse_confidence=0.82,
    )

    assert context.evidence_scope == "全文 PDF 精选片段"
    assert context.article_type == "研究论文"
    assert "【证据范围：全文 PDF 精选片段】" in context.text
    assert "【文章体裁：研究论文】" in context.text
    assert "【文本提取量指标（非准确率）：0.82】" in context.text
    assert "不得声称逐页审查全文" in context.text
    for page_number in (1, 2, 3, 5, 6):
        assert f"【第 {page_number} 页】" in context.text


def test_context_respects_budget_and_keeps_first_and_last_pages() -> None:
    from app.paper_analysis import build_paper_analysis_context

    pages = [f"page {index} " + ("x" * 500) for index in range(1, 21)]
    context = build_paper_analysis_context(
        page_texts=pages,
        abstract="",
        fallback_text="",
        article_type="",
        parse_confidence=0.4,
        max_chars=2400,
    )

    assert len(context.text) <= 2400
    assert "【第 1 页】" in context.text
    assert "【第 20 页】" in context.text
    assert "【文章体裁：未可靠识别】" in context.text


def test_context_keeps_late_conclusion_and_early_numeric_result_as_complete_blocks() -> None:
    from app.paper_analysis import build_paper_analysis_context

    pages = ["Abstract. Overview of the study. " + "background. " * 250]
    pages.append("Introduction. " + "background. " * 250 +
                 "Results show 15.8% phase fraction, 635 Wh/kg cathode energy, 297 Wh/kg full-cell energy, and 80% retention after 600 cycles.")
    pages.extend(["Methods. " + "method detail. " * 250 for _ in range(17)])
    pages.append("IX. CONCLUSION\nThis study presents a unified framework.\n"
                 "First, the authors define flexibility.\nSecond, they map its mechanisms.\n"
                 "Finally, they identify regulatory gaps.\nREFERENCES\n" + "references. " * 300)
    pages.append("References. " + "citation. " * 200)
    context = build_paper_analysis_context(page_texts=pages, abstract="", fallback_text="",
                                           article_type="综述", parse_confidence=1.0, max_chars=6000)

    assert "【第 2 页】" in context.text
    assert "15.8% phase fraction, 635 Wh/kg cathode energy, 297 Wh/kg full-cell energy, and 80% retention after 600 cycles." in context.text
    assert "【第 20 页】" in context.text
    assert "Finally, they identify regulatory gaps." in context.text
    assert len(context.text) <= 6000


def test_abstract_and_metadata_contexts_never_claim_fulltext() -> None:
    from app.paper_analysis import build_paper_analysis_context

    abstract_context = build_paper_analysis_context(
        page_texts=[],
        abstract="This abstract reports a capacity improvement.",
        fallback_text="",
        article_type="综述",
        parse_confidence=0.7,
    )
    metadata_context = build_paper_analysis_context(
        page_texts=None,
        abstract="",
        fallback_text="",
        article_type="",
        parse_confidence=0.0,
    )

    assert abstract_context.evidence_scope == "仅摘要"
    assert "【证据范围：仅摘要】" in abstract_context.text
    assert "全文 PDF 文本" not in abstract_context.text
    assert "不能审查完整实验、图表和机制证据" in abstract_context.text
    assert metadata_context.evidence_scope == "仅元数据"
    assert "【证据范围：仅元数据】" in metadata_context.text
    assert "全文 PDF 文本" not in metadata_context.text


def test_research_prompt_requires_reviewer_structure_and_evidence_boundaries() -> None:
    from app.paper_analysis import PaperAnalysisContext, build_analysis_prompt

    context = PaperAnalysisContext(
        text="【证据范围：全文 PDF 文本】\n【第 3 页】\nFigure 2 reports a phase change.",
        evidence_scope="全文 PDF 文本",
        article_type="研究论文",
    )
    prompt = build_analysis_prompt("Layered oxide study", context)

    for required in (
        "论文到底解决什么问题",
        "作者核心假设",
        "整篇论文论证路线",
        "3–8 条核心 Claim–Evidence",
        "机制分析",
        "实验设计审查",
        "创新性拆解",
        "5–10 个审稿人质疑",
        "论文边界",
        "下一步最有价值实验",
        "我读完这篇论文应该记住的核心逻辑",
    ):
        assert required in prompt
    for label in (
        "作者事实",
        "作者结论",
        "原始数据",
        "AI归纳",
        "AI推断",
        "AI质疑",
        "AI假设",
        "尚不确定",
    ):
        assert label in prompt
    assert "高级表征本身不能证明机制" in prompt
    assert "页码、章节、图号、表号和短证据片段" in prompt


def test_review_prompt_uses_field_map_instead_of_experimental_template() -> None:
    from app.paper_analysis import PaperAnalysisContext, build_analysis_prompt

    context = PaperAnalysisContext("【证据范围：仅摘要】", "仅摘要", "综述")
    prompt = build_analysis_prompt("A review", context)

    for required in (
        "领域问题地图",
        "文献分类逻辑",
        "各路线解决什么",
        "证据、共识与争议",
        "各路线优劣",
        "作者自己的判断",
        "未解决科学问题",
        "下一代研究路线",
    ):
        assert required in prompt
    assert "不要套用实验论文模板" in prompt
    assert "仅摘要" in prompt
    assert "不能声称已审查全文实验、图表或机制证据" in prompt


def test_analysis_json_parser_requires_three_nonempty_strings() -> None:
    from app.paper_analysis import parse_analysis_result

    result = parse_analysis_result(
        json.dumps(
            {
                "summary": "快速理解",
                "plain_explanation": "通俗理解",
                "deep_analysis": "审稿人速解",
            },
            ensure_ascii=False,
        ),
        "AI归纳（待原文证据核验）",
    )

    assert result.summary == "快速理解"
    assert result.plain_explanation == "通俗理解"
    assert result.deep_analysis == "审稿人速解"
    with pytest.raises(ValueError):
        parse_analysis_result('{"summary": "", "plain_explanation": "x"}', "尚不确定")


def test_three_understanding_reports_use_independent_prompts_and_single_report_schema() -> None:
    from app.paper_analysis import (
        AnalysisReportType,
        PaperAnalysisContext,
        build_report_prompt,
        parse_report_result,
    )

    context = PaperAnalysisContext(
        "【证据范围：全文 PDF 文本】\n【第 1 页】Decoupling slab gliding.",
        "全文 PDF 文本",
        "研究论文",
    )
    prompts = {
        report_type: build_report_prompt("Decoupling slab gliding", context, report_type)
        for report_type in AnalysisReportType
    }

    assert len(set(prompts.values())) == 3
    assert "1200–2000" in prompts[AnalysisReportType.quick_understanding]
    assert "前置知识 → 科学问题 → 作者思路" in prompts[AnalysisReportType.layman_understanding]
    assert "2000–4000" in prompts[AnalysisReportType.layman_understanding]
    assert "5–10 个 reviewer questions" in prompts[AnalysisReportType.reviewer_analysis]
    assert "不要限制输出长度" in prompts[AnalysisReportType.reviewer_analysis]
    for report_type, prompt in prompts.items():
        assert report_type.value in prompt
        assert "summary、plain_explanation、deep_analysis" not in prompt
        assert "**加粗**" in prompt
        assert "```mermaid" in prompt
        assert "核心逻辑图" in prompt
        assert "方法流程图" in prompt
        assert "flowchart TD" in prompt
        assert "5–9 个" in prompt
        assert "两行简短、具体" in prompt
        assert "视觉风格由前端统一控制" in prompt
        assert "不得生成实验、结果或证据链图" in prompt
        assert "本任务 prompt 版本：" in prompt and "-v6" in prompt
        assert "mindmap" not in prompt

    parsed = parse_report_result(
        '{"report_markdown":"## 独立完整报告\\n\\n没有被截断。"}',
        "AI归纳（测试）",
    )
    assert parsed.report_markdown.endswith("没有被截断。")
    with pytest.raises(ValueError):
        parse_report_result('{"summary":"旧式总报告"}', "尚不确定")


@pytest.mark.parametrize("report", [
    '## 方法流程图\n```mermaid\nflowchart TD\nA["起点"] --> B["未完成',
    '## 方法流程图\n```mermaid\nflowchart TD\nA["起点"] --> B["终点"]\nB -->|表征| D["\n```',
    '## 方法流程图\n```mermaid\nflowchart TD\nA["起点"] -->\n```',
    '## 方法流程图\nmermaid\nflowchart TD\nA["起点"] --> B["',
    '## 方法流程图\nmermaid\nflowchart TD\nA["起点"] -->|表征| D[',
    '## 方法流程图\r\n```mermaid\r\nflowchart TD\r\nA["起点"] --> B["\r\n```',
])
def test_report_rejects_obviously_incomplete_mermaid(report: str) -> None:
    from app.paper_analysis import AnalysisReportType, IncompleteMermaidError, parse_report_result

    with pytest.raises(IncompleteMermaidError):
        parse_report_result(
            json.dumps({"quick_understanding": report}),
            "AI归纳（测试）",
            AnalysisReportType.quick_understanding,
        )


def test_report_accepts_completed_mermaid_and_plain_prose() -> None:
    from app.paper_analysis import AnalysisReportType, parse_report_result

    report = '## 方法流程图\n```mermaid\nflowchart TD\nA["起点"] -->|表征| B["终点"]\n```\n\n结束。'
    result = parse_report_result(json.dumps({"quick_understanding": report}), "AI归纳（测试）", AnalysisReportType.quick_understanding)
    assert result.report_markdown == report
    unfenced = '## 方法流程图\nmermaid\nflowchart TD\nA["起点"] -->|表征| B["终点"]\n\n这张图说明方法顺序。'
    result = parse_report_result(json.dumps({"quick_understanding": unfenced}), "AI归纳（测试）", AnalysisReportType.quick_understanding)
    assert result.report_markdown == unfenced


def test_report_prompt_version_keeps_v4_and_v5_reports_usable() -> None:
    from app.paper_analysis import (
        AnalysisReportType, REPORT_PROMPT_VERSIONS, REPORT_SCHEMA_VERSIONS,
        is_usable_report_version,
    )

    for report_type in AnalysisReportType:
        schema = REPORT_SCHEMA_VERSIONS[report_type]
        current = REPORT_PROMPT_VERSIONS[report_type]
        for version in (current, current.replace("-v6", "-v5"), current.replace("-v6", "-v4")):
            assert is_usable_report_version(report_type, version, schema)
        assert not is_usable_report_version(report_type, current.replace("-v6", "-v3"), schema)
        assert not is_usable_report_version(report_type, current, "unknown-schema")


def test_openai_compatible_analysis_uses_three_independent_json_contracts(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import OpenAICompatibleProvider
    import app.providers as provider_module

    captured: list[dict[str, object]] = []

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            prompt = captured[-1]["json"]["messages"][0]["content"]  # type: ignore[index]
            report_type = "quick_understanding" if "1200–2000" in prompt else "layman_understanding" if "前置知识 → 科学问题" in prompt else "reviewer_analysis"
            report = "快速理解" if report_type == "quick_understanding" else "通俗理解" if report_type == "layman_understanding" else "审稿人速解"
            return {
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                    {report_type: report},
                                ensure_ascii=False,
                            )
                        }
                    }
                ]
            }

    def fake_post(url: str, **kwargs: object) -> FakeResponse:
        captured.append({"url": url, **kwargs})
        return FakeResponse()

    monkeypatch.setattr(provider_module.httpx, "post", fake_post)
    provider = OpenAICompatibleProvider("key", "https://model.test/v1", "model", 30)
    result = provider.analyze(
        "Paper",
        "【第 1 页】 text",
        article_type="研究论文",
        evidence_scope="全文 PDF 文本",
    )

    assert len(captured) == 3
    prompts = [call["json"]["messages"][0]["content"] for call in captured]  # type: ignore[index]
    assert len(set(prompts)) == 3
    assert "3–8 条核心 Claim–Evidence" in prompts[2]
    assert all(call["json"]["response_format"] == {"type": "json_object"} for call in captured)  # type: ignore[index]
    assert [call["json"]["max_tokens"] for call in captured] == [16000, 12000, 20000]  # type: ignore[index]
    assert [call["timeout"] for call in captured] == [180, 180, 300]
    assert result.summary == "快速理解"
    assert result.deep_analysis == "审稿人速解"

    class BadResponse(FakeResponse):
        def json(self) -> dict[str, object]:
            return {"choices": [{"message": {"content": "not-json"}}]}

    monkeypatch.setattr(provider_module.httpx, "post", lambda *args, **kwargs: BadResponse())
    from app.providers import ModelProviderError
    with pytest.raises(ModelProviderError, match="不符合当前报告格式"):
        provider.analyze("Paper", "text")
