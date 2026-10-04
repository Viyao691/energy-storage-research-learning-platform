const STORAGE_KEY = "paper-artwork:v1";
export const PAPER_ARTWORK_COUNT = 24;

export function paperArtworkFallback(paperId: string): number {
  let hash = 2166136261;
  for (const char of paperId) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % PAPER_ARTWORK_COUNT;
}

export function reservePaperArtwork(paperId: string): number {
  const fallback = paperArtworkFallback(paperId);
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const assignments: Record<string, number> = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, number> : {};
    const existing = assignments[paperId];
    if (Number.isInteger(existing) && existing >= 0 && existing < PAPER_ARTWORK_COUNT) return existing;
    const counts = Array<number>(PAPER_ARTWORK_COUNT).fill(0);
    for (const slot of Object.values(assignments)) {
      if (Number.isInteger(slot) && slot >= 0 && slot < PAPER_ARTWORK_COUNT) counts[slot]++;
    }
    const least = Math.min(...counts);
    const slot = Array.from({ length: PAPER_ARTWORK_COUNT }, (_, offset) => (fallback + offset) % PAPER_ARTWORK_COUNT).find(candidate => counts[candidate] === least)!;
    assignments[paperId] = slot;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    return slot;
  } catch {
    return fallback;
  }
}
