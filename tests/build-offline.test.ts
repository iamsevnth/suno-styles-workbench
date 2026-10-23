import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const scriptPath = fileURLToPath(new URL("../scripts/build-offline.mjs", import.meta.url));

describe("offline build asset paths", () => {
  it("inlines assets from the build directory", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "offline-build-"));
    const dist = path.join(tempDir, "dist");
    mkdirSync(path.join(dist, "assets"), { recursive: true });

    try {
      writeFileSync(path.join(dist, "index.html"), '<script src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css">');
      writeFileSync(path.join(dist, "assets/app.js"), "app script");
      writeFileSync(path.join(dist, "assets/app.css"), "app styles");
      execFileSync(process.execPath, [scriptPath, dist]);
      const output = readFileSync(path.join(dist, "suno-workbench.html"), "utf8");

      assert.match(output, /app script/);
      assert.match(output, /app styles/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects asset paths that escape the build directory", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "offline-build-"));
    const dist = path.join(tempDir, "dist");
    mkdirSync(dist);

    try {
      writeFileSync(path.join(tempDir, "secret.js"), "outside asset");
      writeFileSync(path.join(dist, "index.html"), '<script src="../secret.js"></script><link rel="stylesheet" href="style.css">');
      writeFileSync(path.join(dist, "style.css"), "styles");
      const result = spawnSync(process.execPath, [scriptPath, dist], { encoding: "utf8" });

      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /outside the build directory/);
      assert.equal(existsSync(path.join(dist, "suno-workbench.html")), false);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects symlinks that point outside the build directory", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "offline-build-"));
    const dist = path.join(tempDir, "dist");
    mkdirSync(dist);

    try {
      writeFileSync(path.join(tempDir, "secret.js"), "outside asset");
      symlinkSync(path.join(tempDir, "secret.js"), path.join(dist, "app.js"));
      writeFileSync(path.join(dist, "index.html"), '<script src="app.js"></script><link rel="stylesheet" href="style.css">');
      writeFileSync(path.join(dist, "style.css"), "styles");
      const result = spawnSync(process.execPath, [scriptPath, dist], { encoding: "utf8" });

      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /outside the build directory/);
      assert.equal(existsSync(path.join(dist, "suno-workbench.html")), false);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
