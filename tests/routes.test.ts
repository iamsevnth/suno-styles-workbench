import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PAGES, SITE_URL as BUILD_SITE_URL } from "../scripts/site-pages.mjs";
import { hrefFor, ROUTE_META, ROUTE_PATHS, routeFromHash, routeFromPath, SITE_URL } from "../src/routes.ts";

describe("page addresses", () => {
  it("gives every page a clean address", () => {
    assert.deepEqual(ROUTE_PATHS, {
      home: "/",
      styles: "/compiler",
      lyrics: "/lyrics",
      guide: "/guide",
      privacy: "/privacy-policy",
    });
    assert.equal(hrefFor("styles"), "/compiler");
    assert.equal(hrefFor("privacy"), "/privacy-policy");
  });

  it("reads a path with or without a trailing slash or .html", () => {
    for (const path of ["/compiler", "/compiler/", "/compiler.html"]) assert.equal(routeFromPath(path), "styles");
    assert.equal(routeFromPath("/privacy-policy"), "privacy");
    assert.equal(routeFromPath("/privacy-policy.html"), "privacy");
    assert.equal(routeFromPath("/"), "home");
    assert.equal(routeFromPath("/index.html"), "home");
    assert.equal(routeFromPath("/skills"), "home");
    assert.equal(routeFromPath("/no-such-page"), "home");
  });

  it("maps offline #links to their pages and ignores removed/in-page anchors", () => {
    assert.equal(routeFromHash("#styles"), "styles");
    assert.equal(routeFromHash("#guide"), "guide");
    assert.equal(routeFromHash("#privacy"), "privacy");
    assert.equal(routeFromHash("#skills"), null);
    assert.equal(routeFromHash("#/"), "home");
    assert.equal(routeFromHash("#main"), null);
    assert.equal(routeFromHash(""), null);
  });

  it("matches the page files the build writes", () => {
    assert.equal(BUILD_SITE_URL, SITE_URL);
    assert.deepEqual(
      PAGES.map((p: { id: string; path: string; title: string; description: string }) => [
        p.id,
        p.path,
        p.title,
        p.description,
      ]),
      (Object.keys(ROUTE_PATHS) as (keyof typeof ROUTE_PATHS)[]).map((id) => [
        id,
        ROUTE_PATHS[id],
        ROUTE_META[id].title,
        ROUTE_META[id].description,
      ]),
    );
  });
});
