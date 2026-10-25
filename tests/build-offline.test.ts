import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const buildScript = fileURLToPath(new URL("../scripts/build-offline.mjs", import.meta.url));

function createBuildDirectory(): { root: string; dist: string } {
  const root = mkdtempSync(path.join(tmpdir(), "build-offline-"));
  const dist = path.join(root, "dist");
  mkdirSync(path.join(dist, "assets"), { recursive: true });
  return { root, dist };
}

const checkScript = fileURLToPath(new URL("../scripts/check-csp.mjs", import.meta.url));

describe("offline build Content Security Policy", () => {
  it("replaces 'self' with hashes of the inlined script and stylesheet", () => {
    const { root, dist } = createBuildDirectory();
    try {
      // Vite writes the policy's quotes as &#39; inside the attribute.
      const policy =
        "default-src &#39;none&#39;; script-src &#39;self&#39;; style-src &#39;self&#39;; img-src &#39;self&#39; data:; object-src &#39;none&#39;; base-uri &#39;none&#39;";
      writeFileSync(
        path.join(dist, "index.html"),
        `<head><meta http-equiv="Content-Security-Policy" content="${policy}"><script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css"></head>`
      );
      writeFileSync(path.join(dist, "assets", "app.js"), "console.log('<style>not a style</style>')");
      writeFileSync(path.join(dist, "assets", "app.css"), "body { color: red; }");

      const built = spawnSync(process.execPath, [buildScript, dist], { encoding: "utf8" });
      assert.equal(built.status, 0, built.stderr);
      const output = readFileSync(path.join(dist, "suno-workbench.html"), "utf8");
      assert.match(output, /script-src 'sha256-[A-Za-z0-9+/=]+'/);
      assert.match(output, /style-src 'sha256-[A-Za-z0-9+/=]+'/);
      assert.match(output, /img-src data:/);
      assert.doesNotMatch(output, /'self'/);

      const checked = spawnSync(process.execPath, [checkScript, dist], { encoding: "utf8" });
      assert.equal(checked.status, 0, checked.stderr);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails the check when inline code does not match the policy", () => {
    const { root, dist } = createBuildDirectory();
    try {
      const policy = "default-src 'none'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'";
      writeFileSync(
        path.join(dist, "index.html"),
        `<head><meta http-equiv="Content-Security-Policy" content="${policy}"><script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css"></head>`
      );
      writeFileSync(path.join(dist, "assets", "app.js"), "console.log('app')");
      writeFileSync(path.join(dist, "assets", "app.css"), "body { color: red; }");
      assert.equal(spawnSync(process.execPath, [buildScript, dist], { encoding: "utf8" }).status, 0);
      const offlinePath = path.join(dist, "suno-workbench.html");
      writeFileSync(offlinePath, readFileSync(offlinePath, "utf8").replace("console.log('app')", "console.log('changed')"));

      const checked = spawnSync(process.execPath, [checkScript, dist], { encoding: "utf8" });
      assert.notEqual(checked.status, 0);
      assert.match(checked.stderr, /inline script is not allowed by script-src/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("build folder argument", () => {
  it("refuses a build folder outside the project and the temp folder", () => {
    for (const script of [buildScript, checkScript]) {
      const result = spawnSync(process.execPath, [script, "/"], { encoding: "utf8" });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Build folder must be inside the project or the temp folder/);
    }
  });
});

describe("offline build asset paths", () => {
  it("inlines assets contained in the build directory", () => {
    const { root, dist } = createBuildDirectory();
    try {
      writeFileSync(
        path.join(dist, "index.html"),
        '<script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css">'
      );
      writeFileSync(path.join(dist, "assets", "app.js"), "console.log('app')");
      writeFileSync(path.join(dist, "assets", "app.css"), "body { color: red; }");

      const result = spawnSync(process.execPath, [buildScript, dist], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      const output = readFileSync(path.join(dist, "suno-workbench.html"), "utf8");
      assert.match(output, /console\.log\('app'\)/);
      assert.match(output, /body \{ color: red; \}/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects assets that resolve outside the build directory", () => {
    const { root, dist } = createBuildDirectory();
    try {
      writeFileSync(path.join(dist, "index.html"), '<script src="../outside.js"></script><link rel="stylesheet" href="./assets/app.css">');
      writeFileSync(path.join(root, "outside.js"), "console.log('outside')");
      writeFileSync(path.join(dist, "assets", "app.css"), "body { color: red; }");

      const result = spawnSync(process.execPath, [buildScript, dist], { encoding: "utf8" });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Asset path is outside the build directory/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects an asset that is a symlink to a file outside the build directory", (t) => {
    const { root, dist } = createBuildDirectory();
    try {
      writeFileSync(
        path.join(dist, "index.html"),
        '<script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css">'
      );
      writeFileSync(path.join(root, "outside.js"), "console.log('outside')");
      writeFileSync(path.join(dist, "assets", "app.css"), "body { color: red; }");
      try {
        symlinkSync(path.join(root, "outside.js"), path.join(dist, "assets", "app.js"), "file");
      } catch (err) {
        // Windows only lets administrators or Developer Mode create symlinks.
        if ((err as NodeJS.ErrnoException).code === "EPERM") {
          t.skip("this system does not allow creating symlinks");
          return;
        }
        throw err;
      }

      const result = spawnSync(process.execPath, [buildScript, dist], { encoding: "utf8" });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Asset path is outside the build directory: \.\/assets\/app\.js/);
      assert.equal(existsSync(path.join(dist, "suno-workbench.html")), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
