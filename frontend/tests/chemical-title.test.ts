import { describe, expect, it } from "vitest";
import { normalizeChemicalText } from "../lib/scientificMarkdown";

describe("plain scientific title display", () => {
  it("formats formulas with groups without changing phase names or ordinary numbers", () => {
    expect(normalizeChemicalText("A Ni(OH)2 slurry for CO2 capture: P2/P3 and O2/O3 in 2024 with 3D imaging"))
      .toBe("A Ni(OH)₂ slurry for CO₂ capture: P2/P3 and O2/O3 in 2024 with 3D imaging");
    expect(normalizeChemicalText("P2-Na0.67MnO2, LiFePO4 and Fe3+"))
      .toBe("P2-Na₀.₆₇MnO₂, LiFePO₄ and Fe³⁺");
  });
});
