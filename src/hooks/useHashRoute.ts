import { useEffect, useState } from "react";
import { routeFromHash, RouteId } from "../routes.ts";

export function useHashRoute(): RouteId {
  const [route, setRoute] = useState<RouteId>(() => routeFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const titles: Record<RouteId, string> = {
      home: "Suno Workbench — Styles Compiler, Lyrics Studio and Skills",
      styles: "Styles Compiler — Suno Workbench",
      lyrics: "Lyrics Studio — Suno Workbench",
      skills: "Skills Studio — Suno Workbench",
      guide: "Guide — Suno Workbench",
    };
    document.title = titles[route];
  }, [route]);

  return route;
}
