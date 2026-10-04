import { describe, expect, it } from "vitest";
import { evidenceBoxPercent, scaleEvidenceBbox } from "../lib/evidenceBbox";

const location = {
  page_number: 2,
  element_id: "docling-2-4",
  bbox: { left: 60, top: 80, right: 300, bottom: 200 },
  coord_origin: "TOPLEFT" as const,
  page_width: 600,
  page_height: 800
};

describe("evidence bbox", () => {
  it("scales top-left PDF coordinates into the rendered page", () => {
    expect(scaleEvidenceBbox(location, 300, 400)).toEqual({
      left: 30,
      top: 40,
      width: 120,
      height: 60
    });
    expect(evidenceBoxPercent(location)).toEqual({
      left: 10,
      top: 10,
      width: 40,
      height: 15
    });
  });

  it.each([
    { ...location, page_width: 0 },
    { ...location, bbox: { left: -1, top: 0, right: 10, bottom: 10 } },
    { ...location, bbox: { left: 20, top: 20, right: 10, bottom: 30 } },
    { ...location, bbox: { left: 20, top: 20, right: 700, bottom: 30 } }
  ])("rejects invalid or out-of-page locations", invalid => {
    expect(evidenceBoxPercent(invalid)).toBeNull();
    expect(scaleEvidenceBbox(invalid, 300, 400)).toBeNull();
  });
});
