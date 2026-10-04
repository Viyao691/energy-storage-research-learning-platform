from app.document_parsers import ParsedDocument, ParsedElement, ParsedPage


def _document(text, left=50):
    element = ParsedElement("table-1", 1, text, "table", left, 100, left + 400, 250)
    return ParsedDocument((ParsedPage(1, 600, 800, text, (element,)),), text)


def test_quality_score_requires_row_association_and_matching_location():
    from scripts.parser_quality import evaluate
    expected = {"blocks": [{"page": 1, "label": "table", "bbox": [50, 100, 450, 250],
                           "rows": ["A 120.5 92.0", "B 98.2 87.5"]}]}
    perfect = evaluate(_document("| A | 120.5 | 92.0 |\n| B | 98.2 | 87.5 |"), expected)
    assert perfect["blocks"][0]["row_recall"] == 1
    assert perfect["blocks"][0]["numeric_recall"] == 1
    assert perfect["passed"]
    swapped = evaluate(_document("| A | 98.2 | 87.5 |\n| B | 120.5 | 92.0 |"), expected)
    assert swapped["blocks"][0]["numeric_recall"] == 1
    assert swapped["blocks"][0]["row_recall"] == 0
    assert not swapped["passed"]
    missing = evaluate(_document("| A | 120.5 | 92.0 |"), expected)
    assert missing["blocks"][0]["numeric_recall"] == 0.5
    assert not missing["passed"]
    misplaced = evaluate(_document("A 120.5 92.0\nB 98.2 87.5", left=900), expected)
    assert not misplaced["passed"]


def test_quality_score_does_not_report_no_expectations_as_success():
    from scripts.parser_quality import evaluate
    import pytest
    with pytest.raises(ValueError):
        evaluate(_document("text"), {"blocks": []})
