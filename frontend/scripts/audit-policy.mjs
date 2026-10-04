import { spawnSync } from "node:child_process";

const executable = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm";
const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm.cmd audit --json"] : ["audit", "--json"];
const result = spawnSync(executable, args, { encoding: "utf8" });
if (result.error || !result.stdout?.trim()) {
  console.error("npm audit did not return a JSON report", result.error?.message || result.stderr || "empty output");
  process.exit(1);
}
const report = JSON.parse(result.stdout);
const vulnerabilities = report.vulnerabilities || {};
if (!Object.keys(vulnerabilities).length) {
  console.log("npm audit passed with no vulnerabilities");
  process.exit(0);
}

const allowedPackages = new Set(["nanoid", "postcss", "next", "vite", "@vitest/mocker", "vite-node", "vitest"]);
const unexpected = Object.keys(vulnerabilities).filter(name => !allowedPackages.has(name));
const nanoidVia = vulnerabilities.nanoid?.via || [];
const exactAdvisory = nanoidVia.some(item => typeof item === "object" && String(item.url || "").includes("GHSA-2v37-7h3g-55p8"))
  && vulnerabilities.nanoid?.fixAvailable === false;
if (unexpected.length || !exactAdvisory) {
  console.error("npm audit found vulnerabilities outside the reviewed exception:", unexpected.length ? unexpected.join(", ") : "unexpected advisory state");
  process.exit(1);
}
console.warn("Reviewed npm audit exception: GHSA-2v37-7h3g-55p8 is transitive through PostCSS and currently reports no fix; the app does not call NanoID custom generators. Any different advisory fails this gate.");
