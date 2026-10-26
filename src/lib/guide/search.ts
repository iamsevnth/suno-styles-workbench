export interface SearchableGuideChapter {
  id: string;
  title: string;
  body: string;
}

export interface GuideSearchHit<T extends SearchableGuideChapter> {
  chapter: T;
  excerpt: string;
}

function searchKey(value: string): string {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Entirely local full-text search, including every appendix. Never sends a query anywhere. */
export function searchGuide<T extends SearchableGuideChapter>(chapters: T[], query: string): GuideSearchHit<T>[] {
  const terms = searchKey(query.trim()).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const hits: GuideSearchHit<T>[] = [];
  for (const chapter of chapters) {
    const haystack = searchKey(chapter.title + "\n" + chapter.body);
    if (!terms.every((term) => haystack.includes(term))) continue;
    const original = chapter.body.replace(/^#{1,3}\s+/gm, "").replace(/\s+/g, " ");
    const lowerOriginal = searchKey(original);
    const at = terms.map((term) => lowerOriginal.indexOf(term)).filter((x) => x >= 0).sort((a,b) => a-b)[0] ?? 0;
    const start = Math.max(0, at - 85);
    const end = Math.min(original.length, Math.max(200, at + 190));
    hits.push({
      chapter,
      excerpt: (start ? "…" : "") + original.slice(start, end).trim() + (end < original.length ? "…" : ""),
    });
  }
  return hits;
}
