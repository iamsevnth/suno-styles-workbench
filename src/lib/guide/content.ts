import { GUIDE_CHAPTERS, type GuideChapterMeta } from "./manifest.ts";

/** Vite eagerly embeds every Markdown chapter in the JavaScript bundle, including the offline HTML. */
const rawFiles = import.meta.glob("../../content/guide/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export interface GuideChapter extends GuideChapterMeta { body: string }

function lookupText(id: string): string {
  const matching = Object.entries(rawFiles).filter(([path]) => path.endsWith(`/${id}.md`));
  if (matching.length !== 1) throw new Error(`Expected exactly one Guide source for ${id}; found ${matching.length}`);
  return matching[0][1];
}

export const GUIDE_CONTENT: GuideChapter[] = GUIDE_CHAPTERS.map((chapter) => ({
  ...chapter,
  body: lookupText(chapter.id),
}));
