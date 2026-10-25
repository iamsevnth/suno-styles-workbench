import { useEffect, useState } from "react";
import { ROUTE_META, ROUTE_PATHS, routeFromHash, routeFromPath, RouteId, usesHashRoutes } from "../routes.ts";

function currentRoute(): RouteId {
  if (usesHashRoutes()) return routeFromHash(window.location.hash) ?? "home";
  return routeFromPath(window.location.pathname);
}

/**
 * The page to show. On the hosted site it follows the path (/compiler) and switches pages without a
 * reload when a site link is clicked; the offline file uses #hash routes. Old #hash links
 * (sunoworkbench.com/#styles) are rewritten to their clean address.
 */
export function useRoute(): RouteId {
  const [route, setRoute] = useState<RouteId>(() => {
    if (!usesHashRoutes()) {
      const legacy = routeFromHash(window.location.hash);
      if (legacy) window.history.replaceState(null, "", ROUTE_PATHS[legacy]);
    }
    return currentRoute();
  });

  useEffect(() => {
    const sync = () => {
      setRoute(currentRoute());
      window.scrollTo({ top: 0 });
    };
    if (usesHashRoutes()) {
      // Only route hashes switch pages; "#main" (Skip to content) just moves focus.
      const onHash = () => {
        if (routeFromHash(window.location.hash)) sync();
      };
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    }

    // Site links switch pages in place; new tabs, downloads and other sites behave normally.
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin || url.hash) return;
      if (!(Object.values(ROUTE_PATHS) as string[]).includes(url.pathname)) return;
      event.preventDefault();
      if (url.pathname !== window.location.pathname) window.history.pushState(null, "", url.pathname);
      sync();
    };
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", sync);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useEffect(() => {
    document.title = ROUTE_META[route].title;
  }, [route]);

  return route;
}
