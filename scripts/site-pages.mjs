// The site's addresses and their search/link-preview text. src/routes.ts holds the same values for
// the app; tests/routes.test.ts fails if the two ever differ.
export const SITE_URL = "https://sunoworkbench.com";

export const PAGES = [
  {
    id: "home",
    path: "/",
    title: "Suno Workbench: Styles Compiler, Lyrics Studio and Skills",
    description:
      "Free, browser-only tools for Suno v6: compile a one-line brief into 925–975 character Styles prompts, build and phonetically respell lyrics, and run production playbooks.",
  },
  {
    id: "styles",
    path: "/compiler",
    title: "Styles Compiler | Suno Workbench",
    description:
      "Turn a one-line brief into Suno v6 Styles prompts of 925–975 characters, each naming the tempo, genres, groove, bass, harmony, vocal, mix and instruments.",
  },
  {
    id: "lyrics",
    path: "/lyrics",
    title: "Lyrics Studio | Suno Workbench",
    description:
      "Lay out a song section by section, generate or finish lyrics with Suno section tags, and respell them the way they are spoken in American English.",
  },
  {
    id: "skills",
    path: "/skills",
    title: "Skills Studio | Suno Workbench",
    description:
      "Eight playbooks for Suno v6: fix a prompt that missed, plan covers and mashups, rewrite lyrics, run Song Editor and Studio checklists, and check rights.",
  },
  {
    id: "guide",
    path: "/guide",
    title: "Guide | Suno Workbench",
    description:
      "How to write a brief, how the Styles Compiler works, the Suno v6 settings that keep a prompt intact, troubleshooting, a glossary and sources.",
  },
];
