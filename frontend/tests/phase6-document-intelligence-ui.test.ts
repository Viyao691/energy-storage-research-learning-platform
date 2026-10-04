import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("Phase 6 document intelligence UI", () => {
  it("provides independent OCR and document vision settings", () => {
    const source = read("app/settings/page.tsx");
    expect(source).toContain("文档视觉与 OCR");
    expect(source).toContain("下载 PP-StructureV3");
    expect(source).toContain("document_vision_api_key");
  });

  it("fills the settings page with a deliberate two-column desktop layout", () => {
    const styles = read("app/globals.css");
    expect(styles).toContain("grid-template-columns: minmax(0, 1.35fr) minmax(320px, .65fr)");
    expect(styles).toContain(".settings-page .grid { grid-template-columns: 1fr; }");
  });

  it("stretches settings cards so cost control aligns with the model connection card", () => {
    const styles = read("app/globals.css");
    expect(styles).toContain(".settings-page .grid { align-items: stretch;");
    expect(styles).not.toContain(".settings-page .grid { align-items: start;");
  });

  it("adds OCR quality controls and scientific data workflow to paper detail", () => {
    const page = read("app/papers/[id]/page.tsx");
    const pdfWorkspace = read("components/papers/PdfWorkspace.tsx");
    const analysisTabs = read("components/papers/AnalysisTabs.tsx");
    const scientificPanel = read("components/papers/ScientificPanel.tsx");
    expect(pdfWorkspace).toContain("自动识别低质量页");
    expect(pdfWorkspace).toContain("原件");
    expect(pdfWorkspace).toContain("OCR 衍生版");
    expect(analysisTabs).toContain('["scientific", "科研数据"]');
    expect(scientificPanel).toContain("人工确认数据");
    expect(scientificPanel).toContain("导出可复现 ZIP");
    expect(page).toContain("PdfWorkspace");
    expect(page).toContain("ScientificPanel");
  });

  it("documents privacy, confidence and troubleshooting without the obsolete limitation", () => {
    const source = read("app/help/page.tsx");
    expect(source).toContain("混合 OCR");
    expect(source).toContain("仅上传你明确选择的单页或裁切图");
    expect(source).toContain("校准残差不超过 1%");
    expect(source).not.toContain("仍不包含扫描 PDF 的完整 OCR");
  });

  it("exposes typed OCR and scientific analysis API calls", () => {
    const source = read("lib/api.ts");
    for (const token of ["documentAiStatus", "installDocumentAi", "createOcrRun", "cloudEnhancePage", "createScientificDataset", "runScientificAnalysis", "scientificExportUrl"]) {
      expect(source).toContain(token);
    }
  });

  it("integrates Docling candidates and evidence overlays into existing paper components", () => {
    const workspace = read("components/papers/PdfWorkspace.tsx");
    const controls = read("components/papers/ParseCandidateControls.tsx");
    const preview = read("components/papers/EvidencePagePreview.tsx");
    const claims = read("components/papers/ClaimsPanel.tsx");
    const followUp = read("components/papers/PaperFollowUp.tsx");
    const styles = read("app/globals.css");
    expect(controls).toContain("实验解析，不会自动替换当前版本");
    expect(controls).toContain("确认启用这个候选");
    expect(workspace).toContain("ParseCandidateControls");
    expect(workspace).toContain("EvidencePagePreview");
    expect(preview).toContain('aria-label="证据区域"');
    expect(preview).toContain('className="evidence-page-canvas"');
    expect(styles).toContain(".evidence-page-canvas { --page-preview-max-height: 640px; position: relative;");
    expect(styles).toContain(".evidence-page-canvas img { width: 100%; height: auto;");
    expect(preview).toContain("location.page_width / location.page_height");
    expect(controls).toContain("duration_seconds");
    expect(claims).toContain("source_locations");
    expect(followUp).toContain("source_locations");
  });
});

