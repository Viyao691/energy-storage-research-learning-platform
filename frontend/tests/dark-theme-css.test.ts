import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../app/globals.css", import.meta.url)),
  "utf8",
);
const darkThemeCss = css.slice(css.indexOf('html[data-theme="dark"]'));

describe("global dark theme contrast", () => {
  it("keeps shared surfaces and controls dark with readable text", () => {
    expect(darkThemeCss).not.toContain("--workspace-navy: #fffdf8");
    expect(darkThemeCss).not.toContain("--editorial-navy: #fffdf8");

    for (const selector of [
      'html[data-theme="dark"] .search-form',
      'html[data-theme="dark"] .library-page > .card',
      'html[data-theme="dark"] .editorial-empty-state',
      'html[data-theme="dark"] .compare-workspace .paper-choice-list label',
      'html[data-theme="dark"] .help-hero',
      'html[data-theme="dark"] .help-card',
    ]) {
      expect(darkThemeCss).toContain(selector);
    }

    expect(darkThemeCss).toContain(
      'html[data-theme="dark"] .app-main .button',
    );
    expect(darkThemeCss).toContain("background: #2d5f9e !important");
    expect(darkThemeCss).toContain("color: #ffffff !important");
  });
});
