import pytest

from app.paper_metadata import extract_local_paper_metadata


def test_extracts_explicit_pdf_metadata_without_inference() -> None:
    text = """Comprehensive Review of Power System Flexibility
This article has been accepted for publication in IEEE Access.
Date of publication May 22, 2024.
Digital Object Identifier 10.1109/ACCESS.2024.1234567
INDEX TERMS Electricity markets, Power system flexibility, Energy storage
"""

    result = extract_local_paper_metadata(filename="paper.pdf", text=text)

    assert result.doi == "10.1109/access.2024.1234567"
    assert result.journal == "IEEE Access"
    assert result.published_date == "2024"
    assert result.keywords == (
        "电力市场",
        "电力系统灵活性",
        "储能",
    )
    assert result.article_type == "综述"


def test_prioritizes_specific_topics_when_author_keywords_are_missing() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="Layered oxide cathodes for sodium-ion batteries",
    )

    assert result.keywords == ("层状氧化物正极", "钠离子电池", "层状氧化物", "正极材料")
    assert result.journal == ""
    assert result.article_type == ""


def test_extracts_up_to_eight_multiline_author_keywords_in_chinese() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="""Keywords: Energy Storage; Na-ion cathode; Structural transition; Rietveld refinement; Layered
oxides; Electrochemical Impedance Spectroscopy; Interfacial Impedance; Equivalent Circuit
Modeling.

1. Introduction
This paragraph must not become a keyword.
""",
    )

    assert result.keywords == (
        "储能",
        "钠离子电池正极",
        "结构转变",
        "Rietveld 精修",
        "层状氧化物",
        "电化学阻抗谱",
        "界面阻抗",
        "等效电路建模",
    )


def test_preserves_unmapped_author_keyword_in_english() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="Keywords: Unmapped phase descriptor",
    )

    assert result.keywords == ("Unmapped phase descriptor",)


def test_stops_keyword_block_at_roman_numbered_section() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="""INDEX TERMS Electricity markets, Flexibility, Flexibility resources, Variable energy resources
I. INTRODUCTION
Net-zero mandates require deep electrification of major sectors.
However, relying solely on traditional network reinforcements is costly.
""",
    )

    assert result.keywords == (
        "电力市场",
        "灵活性",
        "灵活性资源",
        "可变能源资源",
    )


def test_leaves_ambiguous_metadata_empty() -> None:
    result = extract_local_paper_metadata(filename="notes.pdf", text="short notes")

    assert result.doi is None
    assert result.journal == ""
    assert result.published_date is None
    assert result.keywords == ()
    assert result.article_type == ""


def test_uses_citation_doi_year_when_publication_date_is_placeholder() -> None:
    result = extract_local_paper_metadata(
        filename="accepted.pdf",
        text="""Date of publication xxxx 00, 0000.
This article has been accepted for publication in IEEE Access.
Citation information: DOI 10.1109/ACCESS.2026.3709710""",
    )

    assert result.published_date == "2026"


def test_rejects_doi_template_placeholder_and_uses_real_citation_doi() -> None:
    result = extract_local_paper_metadata(
        filename="accepted.pdf",
        text="""Digital Object Identifier 10.1109/ACCESS.2024.Doi Number
Citation information: DOI 10.1109/ACCESS.2026.3709710""",
    )

    assert result.doi == "10.1109/access.2026.3709710"


@pytest.mark.parametrize(
    ("subject", "expected"),
    [
        ("Nature Communications, doi:10.1038/s41467-025-57663-3", "Nature Communications"),
        ("Nature Reviews Chemistry, doi:10.1038/s41570-025-00795-3", "Nature Reviews Chemistry"),
        ("Chemical Society Reviews (2024), 53, 4230-4301", "Chemical Society Reviews"),
        ("Advanced Energy Materials 2024.14:2400373", "Advanced Energy Materials"),
        ("Article npj Energy Materials, doi:10.1038/s44456-026-00006-4", "npj Energy Materials"),
    ],
)
def test_extracts_explicit_journal_from_pdf_subject(subject: str, expected: str) -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="",
        document_metadata={"subject": subject},
    )

    assert result.journal == expected


def test_does_not_treat_descriptive_pdf_subject_as_journal() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="",
        document_metadata={"subject": "This paper studies sodium-ion battery degradation."},
    )

    assert result.journal == ""


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Nature Communications|        (2025) 16:2520", "Nature Communications"),
        ("Nature Reviews Chemistry | Volume 10 | March 2026", "Nature Reviews Chemistry"),
        ("Cite this: Chem. Soc. Rev., 2024, 53, 4230", "Chem. Soc. Rev"),
    ],
)
def test_extracts_explicit_journal_from_page_header(text: str, expected: str) -> None:
    result = extract_local_paper_metadata(filename="paper.pdf", text=text)

    assert result.journal == expected


@pytest.mark.parametrize(
    ("text", "document_metadata", "expected"),
    [
        ("Nature Communications | (2025) 16:2520", {}, "2025"),
        ("Nature Reviews Chemistry | Volume 10 | March 2026", {}, "2026"),
        ("", {"subject": "Nature Communications (2025), 16:2520"}, "2025"),
    ],
)
def test_extracts_year_from_explicit_journal_header_or_subject(
    text: str,
    document_metadata: dict[str, str],
    expected: str,
) -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text=text,
        document_metadata=document_metadata,
    )

    assert result.published_date == expected


def test_extracts_research_article_from_standalone_first_page_marker() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="Article\nDecoupling slab gliding and lattice contraction",
    )

    assert result.article_type == "研究论文"


def test_finds_research_article_marker_later_in_first_page_sample() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text=("Front matter\n" * 900) + "\nRESEARCH ARTICLE\n",
    )

    assert result.article_type == "研究论文"


def test_identifies_research_paper_from_complete_section_structure() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="\n".join((
            "Abstract",
            "Summary text",
            "1. Introduction",
            "Background text",
            "2. Results and Discussion",
            "Findings text",
            "4. Conclusions",
        )),
    )

    assert result.article_type == "研究论文"


def test_leaves_article_type_empty_when_section_structure_is_weak() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="1. Introduction\nOnly one recognizable section",
    )

    assert result.article_type == ""


def test_identifies_explicit_arxiv_manuscript_as_preprint() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="arXiv:2408.01234 [cond-mat.mtrl-sci]\nA manuscript title",
    )

    assert result.article_type == "预印本"


def test_supplements_generic_author_keywords_with_evidenced_specific_topics() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="""A Ni(OH)2 slurry for CO2 capture
Abstract
We synthesized a nickel hydroxide slurry and measured CO2 capture and carbonation.
Keywords: Energy storage
1. Introduction
""",
    )
    assert result.keywords[0] == "储能"
    assert "氢氧化镍浆料" in result.keywords
    assert "CO2捕集" in result.keywords
    assert result.article_type == "实验研究"


def test_does_not_classify_body_review_or_reference_titles_as_review() -> None:
    result = extract_local_paper_metadata(
        filename="paper.pdf",
        text="""Research Article
Abstract
We formulate optimal scheduling of a virtual power plant using mixed-integer linear programming.
Case studies validate the dispatch model. We review prior work in the introduction.
References
A review of sodium-ion batteries and layered oxide cathodes.
""",
    )
    assert result.article_type == "建模与优化研究"
    assert "虚拟电厂" in result.keywords
    assert "混合整数线性规划" in result.keywords
    assert "钠离子电池" not in result.keywords


@pytest.mark.parametrize(("text", "expected"), [
    ("Review\nAbstract\nWe summarize experimental research on slurries.", "综述"),
    ("An experimental study\nAbstract\nA literature review motivates our measurements.", "实验研究"),
    ("Research Article\nAbstract\nDensity functional theory calculations reveal the migration barrier.", "理论与计算研究"),
    ("Research Article\nAbstract\nNumerical simulation of a flow battery using computational fluid dynamics.", "数值仿真研究"),
])
def test_classifies_using_direct_genre_and_method_evidence(text: str, expected: str) -> None:
    assert extract_local_paper_metadata(filename="paper.pdf", text=text).article_type == expected
