import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../app/globals.css", import.meta.url)),
  "utf8"
);

describe("paper reader single-scroll workspaces", () => {
  it("locks the body and builds two full-height independent scroll columns", () => {
    expect(css).toContain("@media (min-width: 961px)");
    expect(css).toMatch(/body:has\(\.reader-workspace\)\s*\{[^}]*height:\s*100vh;[^}]*overflow:\s*hidden;/s);
    expect(css).toMatch(/body:has\(\.reader-workspace\) \.app-shell\s*\{[^}]*height:\s*100vh;[^}]*overflow:\s*hidden;/s);
    expect(css).toMatch(/body:has\(\.reader-workspace\) \.app-main\s*\{[^}]*height:\s*100vh;[^}]*overflow:\s*hidden;/s);
    expect(css).toMatch(/\.reader-workspace \.detail-grid\s*\{[^}]*grid-template-columns:\s*1fr 1fr;/s);
    expect(css).toMatch(/\.reader-workspace \.detail-grid\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\);/s);
    // Left PDF workspace: the whole card is the ONLY scroll container
    expect(css).toMatch(/\.reader-workspace \.pdf-workspace\s*\{[^}]*overflow-y:\s*auto;/s);
    expect(css).toMatch(/\.reader-workspace \.pdf-workspace \.pdf-reader\s*\{[^}]*min-height:\s*62vh;[^}]*height:\s*62vh;/s);
    // Right analysis panel: one scroll container wraps every tab panel
    expect(css).toMatch(/\.reader-workspace \.analysis-panel\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s);
    expect(css).toMatch(/\.reader-workspace \.analysis-panel \.analysis-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/s);
    expect(css).toMatch(/\.reader-workspace \.analysis-tab-panel \.markdown-content\s*\{[^}]*max-height:\s*none;[^}]*overflow:\s*visible;/s);
    expect(css).toContain("@media (max-width: 960px)");
    expect(css).toMatch(/body:has\(\.reader-workspace\)\s*\{[^}]*height:\s*auto;[^}]*overflow:\s*visible;/s);
  });
});
