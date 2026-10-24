/** External sources the Guide cites, with the date they were last checked. */
export const SOURCES_CHECKED = "10/24/2026";

export const SOURCES = {
  sunoBlog: {
    label: "Suno blog: Introducing v6 (09/09/2026)",
    href: "https://suno.com/blog/introducing-v6",
    kind: "suno",
  },
  sunoFaq: { label: "Suno Help Center: v6 FAQ", href: "https://help.suno.com/en/articles/13924481", kind: "suno" },
  stylesLimit: {
    label: "HookGenius: Suno style prompt guide (Styles field limit)",
    href: "https://hookgenius.app/learn/suno-style-prompt/",
    kind: "community",
  },
  createGuide: {
    label: "Jack Righteous: Inside Suno v6 Create",
    href: "https://jackrighteous.com/blogs/guides-using-suno-ai-music-creation/inside-suno-v6-create-simple-advanced-sounds-guide",
    kind: "community",
  },
  moderation: {
    label: "Jack Righteous: “Prompt contained inappropriate material”",
    href: "https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/suno-prompt-contained-inappropriate-material",
    kind: "community",
  },
} as const;
