export type RouteId = "home" | "styles" | "lyrics" | "skills" | "guide";
export type StudioRouteId = "styles" | "lyrics" | "skills";

const ROUTE_IDS: ReadonlySet<string> = new Set<RouteId>(["home", "styles", "lyrics", "skills", "guide"]);

/** Hash routing keeps every page working on GitHub Pages and in the offline file. */
export function routeFromHash(hash: string): RouteId {
  const id = hash.replace(/^#\/?/, "");
  return ROUTE_IDS.has(id) ? (id as RouteId) : "home";
}

export function hrefFor(route: RouteId): string {
  return route === "home" ? "#/" : `#${route}`;
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
