// The site's addresses and their search/link-preview text. src/routes.ts holds the same values for
// the app; tests/routes.test.ts fails if the two ever differ.
export const SITE_URL = "https://sunoworkbench.com";

export const PAGES = [
  {
    id: "home",
    path: "/",
    title: "Suno Workbench: Styles Compiler and Lyrics Studio",
    description:
      "Free, browser-only tools for Suno v6: compile or repair detailed Styles prompts and build structured lyrics. Everything stays in your browser.",
  },
  {
    id: "styles",
    path: "/compiler",
    title: "Styles Compiler | Suno Workbench",
    description:
      "Create or fix Suno v6 Styles prompts of 925–975 characters with clear tempo, genres, groove, bass, harmony, vocals, mix and instruments.",
  },
  {
    id: "lyrics",
    path: "/lyrics",
    title: "Lyrics Studio | Suno Workbench",
    description:
      "Lay out a song section by section, generate or finish lyrics with Suno section tags, and respell them the way they are spoken in American English.",
  },
  {
    id: "guide",
    path: "/guide",
    title: "Guide | Suno Workbench",
    description:
      "Search the complete Suno Workbench production manual, v4 compiler documentation, Suno Create controls, 30 recipes, genre tables, and the 59-section sonic encyclopedia.",
  },
  {
    id: "privacy",
    path: "/privacy-policy",
    title: "Privacy Policy | Suno Workbench",
    description:
      "SEVNTHLABS privacy policy for Suno Workbench: client-side processing, local browser storage, GitHub Pages hosting and no site analytics or tracking.",
  },
];
