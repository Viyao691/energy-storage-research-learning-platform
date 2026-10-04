import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("generated evidence coordinates", () => {
  it("allows local indexing to outlast the default proxy timeout", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).toContain("proxyTimeout: 600_000");
  });
  it("preserves OpenAPI constant values as TypeScript literals", () => {
    const types = readFileSync("lib/api.generated.d.ts", "utf8");
    expect(types).toContain('coord_origin: "TOPLEFT";');
  });
});
