export type RouteId = "home" | "styles" | "lyrics" | "skills" | "guide";
export type StudioRouteId = "styles" | "lyrics" | "skills";

/** The public site's address. */
export const SITE_URL = "https://sunoworkbench.com";

/** Clean addresses on the hosted site (sunoworkbench.com/compiler). */
export const ROUTE_PATHS: Record<RouteId, string> = {
  home: "/",
  styles: "/compiler",
  lyrics: "/lyrics",
  skills: "/skills",
  guide: "/guide",
};

/** Page title and search/link-preview description for each address. */
export const ROUTE_META: Record<RouteId, { title: string; description: string }> = {
  home: {
    title: "Suno Workbench: Styles Compiler, Lyrics Studio and Skills",
    description:
      "Free, browser-only tools for Suno v6: compile a one-line brief into 925–975 character Styles prompts, build and phonetically respell lyrics, and run production playbooks.",
  },
  styles: {
    title: "Styles Compiler | Suno Workbench",
    description:
      "Turn a one-line brief into Suno v6 Styles prompts of 925–975 characters, each naming the tempo, genres, groove, bass, harmony, vocal, mix and instruments.",
  },
  lyrics: {
    title: "Lyrics Studio | Suno Workbench",
    description:
      "Lay out a song section by section, generate or finish lyrics with Suno section tags, and respell them the way they are spoken in American English.",
  },
  skills: {
    title: "Skills Studio | Suno Workbench",
    description:
      "Eight playbooks for Suno v6: fix a prompt that missed, plan covers and mashups, rewrite lyrics, run Song Editor and Studio checklists, and check rights.",
  },
  guide: {
    title: "Guide | Suno Workbench",
    description:
      "How to write a brief, how the Styles Compiler works, the Suno v6 settings that keep a prompt intact, troubleshooting, a glossary and sources.",
  },
};

const ROUTE_IDS = Object.keys(ROUTE_PATHS) as RouteId[];

/** The offline file opens from disk, where the address can't change, so it keeps #hash routes. */
export function usesHashRoutes(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "file:";
}

/** Route for an old-style or offline #hash ("#styles", "#/"), or null when the hash is not a route. */
export function routeFromHash(hash: string): RouteId | null {
  const id = hash.replace(/^#\/?/, "");
  if (id === "") return hash === "#/" ? "home" : null;
  return (ROUTE_IDS as string[]).includes(id) ? (id as RouteId) : null;
}

/** Route for a path ("/compiler", "/compiler/", "/compiler.html"); unknown paths show the home page. */
export function routeFromPath(pathname: string): RouteId {
  const clean =
    pathname
      .replace(/\.html$/, "")
      .replace(/\/index$/, "/")
      .replace(/(.)\/+$/, "$1") || "/";
  return ROUTE_IDS.find((id) => ROUTE_PATHS[id] === clean) ?? "home";
}

export function hrefFor(route: RouteId): string {
  if (usesHashRoutes()) return route === "home" ? "#/" : `#${route}`;
  return ROUTE_PATHS[route];
}

export function isStudioRoute(route: RouteId): route is StudioRouteId {
  return route === "styles" || route === "lyrics" || route === "skills";
}

export const NAV_ITEMS: { route: RouteId; label: string }[] = [
  { route: "home", label: "Home" },
  { route: "styles", label: "Styles Compiler" },
  { route: "lyrics", label: "Lyrics Studio" },
  { route: "skills", label: "Skills Studio" },
  { route: "guide", label: "Guide" },
];

export const REPO_URL = "https://github.com/iamsevnth/suno-styles-workbench";
