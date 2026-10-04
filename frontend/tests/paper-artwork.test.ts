// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { reservePaperArtwork } from "../lib/paperArtwork";

describe("paper artwork allocation", () => {
  beforeEach(() => localStorage.clear());

  it("uses every one of the 24 illustrations before repeating and preserves assignments across reload order", () => {
    const first = Array.from({ length: 24 }, (_, i) => reservePaperArtwork(`paper-${i}`));
    expect(new Set(first).size).toBe(24);
    expect(first.every(slot => slot >= 0 && slot < 24)).toBe(true);
    expect(Array.from({ length: 24 }, (_, i) => reservePaperArtwork(`paper-${23 - i}`))).toEqual(first.slice().reverse());
    expect(reservePaperArtwork("paper-24")).toBeGreaterThanOrEqual(0);
  });

  it("returns a stable bounded slot when storage is corrupt or unavailable", () => {
    localStorage.setItem("paper-artwork:v1", "{invalid");
    const slot = reservePaperArtwork("stable-id");
    expect(reservePaperArtwork("stable-id")).toBe(slot);
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error("disabled"); };
    try {
      expect(reservePaperArtwork("fallback-id")).toBe(reservePaperArtwork("fallback-id"));
      expect(reservePaperArtwork("fallback-id")).toBeGreaterThanOrEqual(0);
      expect(reservePaperArtwork("fallback-id")).toBeLessThan(24);
    } finally {
      Storage.prototype.getItem = original;
    }
  });
});
