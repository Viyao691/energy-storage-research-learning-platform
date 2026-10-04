def test_formula_match_preserves_fraction_structure_and_symbol_case():
    from scripts.formula_probe import formula_matches

    expected = r"Q=\frac{It}{m}"
    assert formula_matches(r"Q = \frac{I t}{m}", expected)
    assert not formula_matches(r"Q=\frac{m}{It}", expected)
    assert not formula_matches("Q I t m", expected)
    assert not formula_matches(r"Q=\frac{It}{M}", expected)
    assert not formula_matches("", expected)
