import manifest from "./assets.json";
export type ChronicleAsset = { id: string; src: string | null; alt: string; sourceUrl: string; credit: string; license: string; status: string; subjects: string[]; kind?: string; context?: string; priority?: number };
const assets: readonly ChronicleAsset[] = manifest.assets;
export function getAsset(id?: string) { const asset = assets.find(asset => asset.id === id && asset.status === "usable" && !!asset.src); return asset?.src ? { ...asset, src: asset.src } : undefined; }
export function assetIdFor(subject: string, kind?: string) { return assets.filter(asset => asset.status === "usable" && !!asset.src && asset.subjects.includes(subject) && (!kind || asset.kind === kind)).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0]?.id; }

export function assetForExhibit(historySubject: string, section: string, item: { subject: string; yearNumber?: number }, preferredSubject?: string) {
  const routeSubject = historySubject.startsWith("route:") ? historySubject.replace(/:history$/, "") : undefined;
  const subjects = preferredSubject ? [preferredSubject] : section === "history" ? [routeSubject && item.yearNumber ? routeSubject.replace(/^route:/, "event:") + ":" + item.yearNumber : "", item.subject !== "scene:history" && item.subject !== "route:history" ? item.subject : "", historySubject] : [routeSubject ? routeSubject + ":" + section : "", item.subject];
  return subjects.map(subject => getAsset(assetIdFor(subject))).find(Boolean);
}
