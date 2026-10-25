import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/build-routes.mjs", import.meta.url));

const TEMPLATE = `<!doctype html><html><head>
<title>Home</title>
<meta name="description" content="home" />
<link rel="canonical" href="https://sunoworkbench.com/" />
<meta property="og:title" content="Suno Workbench" />
<meta property="og:description" content="home" />
<meta property="og:url" content="https://sunoworkbench.com/" />
</head><body></body></html>`;

describe("page files for clean addresses", () => {
  it("writes one page per address with its own title, description and canonical URL", () => {
    const dist = mkdtempSync(path.join(tmpdir(), "build-routes-"));
    try {
      writeFileSync(path.join(dist, "index.html"), TEMPLATE);
      const result = spawnSync(process.execPath, [script, dist], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);

      const compiler = readFileSync(path.join(dist, "compiler.html"), "utf8");
      assert.match(compiler, /<title>Styles Compiler \| Suno Workbench<\/title>/);
      assert.match(compiler, /<link rel="canonical" href="https:\/\/sunoworkbench.com\/compiler" \/>/);
      assert.match(compiler, /<meta property="og:url" content="https:\/\/sunoworkbench.com\/compiler" \/>/);
      for (const file of ["lyrics.html", "guide.html", "privacy-policy.html", "404.html", "sitemap.xml", "robots.txt"]) {
        assert.ok(readFileSync(path.join(dist, file), "utf8").length > 0, file);
      }
      assert.match(readFileSync(path.join(dist, "404.html"), "utf8"), /<meta name="robots" content="noindex" \/>/);
      assert.match(
        readFileSync(path.join(dist, "sitemap.xml"), "utf8"),
        /<loc>https:\/\/sunoworkbench.com\/privacy-policy<\/loc>/,
      );
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });

  it("fails when index.html is missing a tag it must rewrite", () => {
    const dist = mkdtempSync(path.join(tmpdir(), "build-routes-"));
    try {
      writeFileSync(path.join(dist, "index.html"), TEMPLATE.replace(/<link rel="canonical"[^>]*>/, ""));
      const result = spawnSync(process.execPath, [script, dist], { encoding: "utf8" });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /missing the canonical link/);
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });
});
