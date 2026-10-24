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
