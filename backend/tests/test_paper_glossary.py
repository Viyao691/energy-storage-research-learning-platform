from app.paper_glossary import glossary_required_terms, glossary_terms_prompt, parse_glossary_terms
import pytest

from app.providers import ModelProviderError, StructuredTaskResult


def test_reports_and_full_text_supply_required_shorthand():
    evidence = "ordinary text " * 1000 + " xrd and mrixs; STEM-HAADF imaging."
    reports = "P2/P3 layered phases compared with XRD and STEM-HAADF."
    required = glossary_required_terms(evidence, reports)
    assert required == ["P2", "P3", "XRD", "HAADF-STEM", "mRIXS"]
    prompt = glossary_terms_prompt("title", evidence, reports, required)
    assert reports in prompt and "mRIXS" in prompt
    assert "15–20" in prompt and "至少8项" in prompt and "层间滑移" in prompt


def test_known_required_terms_survive_model_omission_and_aliases():
    result = StructuredTaskResult(
        data={"terms": [{"term": "STEM-HAADF", "explanation": "显微技术"}] +
                        [{"term": f"术语{i}", "explanation": "通用解释"} for i in range(19)]},
        evidence_status="test", model_name="fake",
    )
    terms = parse_glossary_terms(result, ["XRD", "HAADF-STEM", "mRIXS", "P2", "P3"])
    assert [item.term for item in terms[:5]] == ["XRD", "HAADF-STEM", "mRIXS", "P2", "P3"]
    assert len(terms) == 20
    assert not any(item.term == "STEM-HAADF" for item in terms)
    assert not any(item.term in {"O2", "O3"} for item in terms)


def test_phase_context_and_nontechnical_tokens_are_filtered():
    assert glossary_required_terms("O2 gas and O3 gas; Mg Ti Co K Na2CO3 JSON PDF https://site/XRD") == []
    assert glossary_required_terms("O2/O3 layered phase; EPR and XPS") == ["O2", "O3", "EPR", "XPS"]
    assert glossary_required_terms("RESEARCH STUDY METHODS RESULTS ABSTRACT research; XRD and EPR") == ["XRD", "EPR"]
    assert len(glossary_required_terms("XRD EPR XPS SEM TEM FTIR Raman NMR EXAFS XANES SAXS WAXS BET DFT DOS GITT PITT CV EIS DSC TGA")) <= 12


def test_common_words_and_translations_are_removed_without_losing_specialist_phrases():
    names = ["层间滑移", "氧氧化还原", "阴离子氧化还原", "层状氧化物", "P2–O2相变",
             "相变应力", "比容量", "循环稳定性", "能量密度", "离子扩散", "晶格畸变", "电荷补偿",
             "XRD", "STEM-HAADF", "mRIXS", "EPR", "XPS", "research gap",
             "RESEARCH（研究）", "Methods"]
    result = StructuredTaskResult(
        data={"terms": [{"term": name, "explanation": "专业概念解释"} for name in names]},
        evidence_status="test", model_name="fake",
    )
    terms = parse_glossary_terms(result, ["HAADF-STEM", "research"])
    selected = [item.term for item in terms]
    assert len(selected) == 18
    assert selected[0] == "HAADF-STEM"
    assert all(name in selected for name in names[:13])
    assert "research gap" in selected
    assert not any(name in selected for name in ["research", "RESEARCH（研究）", "Methods", "STEM-HAADF"])


def test_insufficient_specialist_terms_after_filtering_are_rejected():
    names = ["层间滑移", "氧氧化还原", "相变应力", "比容量", "XRD", "mRIXS"] + ["RESEARCH（研究）"] * 14
    result = StructuredTaskResult(
        data={"terms": [{"term": name, "explanation": "概念解释"} for name in names]},
        evidence_status="test", model_name="fake",
    )
    with pytest.raises(ModelProviderError, match="专业术语不足15项，请重新生成"):
        parse_glossary_terms(result)
