import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, it } from "node:test";

const scriptPath = fileURLToPath(new URL("../scripts/build-offline.mjs", import.meta.url));
const tempDir = mkdtempSync(path.join(tmpdir(), "build-offline-test-"));

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function createBuildDir(directory: string) {
  mkdirSync(path.join(directory, "assets"), { recursive: true });
  writeFileSync(
    path.join(directory, "index.html"),
    '<script src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css">'
  );
  writeFileSync(path.join(directory, "assets/app.js"), "console.log('ok');");
  writeFileSync(path.join(directory, "assets/app.css"), "body { color: black; }");
}

describe("offline build script", () => {
  it("does not allow a CLI argument to redirect its output", () => {
    const distDir = path.join(tempDir, "dist");
    const redirectedDir = path.join(tempDir, "redirected");
    createBuildDir(distDir);
    createBuildDir(redirectedDir);

    const result = spawnSync(process.execPath, [scriptPath, redirectedDir], {
      cwd: tempDir,
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(path.join(distDir, "suno-workbench.html")), true);
    assert.equal(existsSync(path.join(redirectedDir, "suno-workbench.html")), false);
  });
});
