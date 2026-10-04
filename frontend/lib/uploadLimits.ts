export const MAX_PDF_UPLOAD_MB = 30;
export const MAX_PDF_UPLOAD_BYTES = MAX_PDF_UPLOAD_MB * 1024 * 1024;

type PdfUploadCandidate = Pick<File, "name" | "size" | "type">;

export function validatePdfUpload(file?: PdfUploadCandidate): string {
  if (!file) {
    return "请选择 PDF 文件。";
  }
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "仅支持 PDF 文件。";
  }
  if (file.size > MAX_PDF_UPLOAD_BYTES) {
    return `PDF 文件超过 ${MAX_PDF_UPLOAD_MB}MB 限制。`;
  }
  return "";
}

