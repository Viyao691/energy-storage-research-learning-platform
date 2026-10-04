export type EvidenceLocation = {
  page_number: number;
  element_id: string;
  bbox: { left: number; top: number; right: number; bottom: number };
  coord_origin: "TOPLEFT";
  page_width: number;
  page_height: number;
};

type EvidenceBox = { left: number; top: number; width: number; height: number };

function valid(location: EvidenceLocation): boolean {
  const { bbox, page_width: pageWidth, page_height: pageHeight } = location;
  return (
    location.coord_origin === "TOPLEFT" &&
    location.page_number >= 1 &&
    pageWidth > 0 &&
    pageHeight > 0 &&
    bbox.left >= 0 &&
    bbox.top >= 0 &&
    bbox.right > bbox.left &&
    bbox.bottom > bbox.top &&
    bbox.right <= pageWidth &&
    bbox.bottom <= pageHeight
  );
}

export function evidenceBoxPercent(location: EvidenceLocation): EvidenceBox | null {
  if (!valid(location)) return null;
  const { bbox, page_width: pageWidth, page_height: pageHeight } = location;
  return {
    left: (bbox.left / pageWidth) * 100,
    top: (bbox.top / pageHeight) * 100,
    width: ((bbox.right - bbox.left) / pageWidth) * 100,
    height: ((bbox.bottom - bbox.top) / pageHeight) * 100
  };
}

export function scaleEvidenceBbox(
  location: EvidenceLocation,
  renderedWidth: number,
  renderedHeight: number
): EvidenceBox | null {
  const percent = evidenceBoxPercent(location);
  if (!percent || renderedWidth <= 0 || renderedHeight <= 0) return null;
  return {
    left: (percent.left / 100) * renderedWidth,
    top: (percent.top / 100) * renderedHeight,
    width: (percent.width / 100) * renderedWidth,
    height: (percent.height / 100) * renderedHeight
  };
}
