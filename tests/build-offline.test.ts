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

/** Runs the CSP check after copying index.html to each page file, as build-routes.mjs does. */
function runCheck(dist: string) {
  const index = readFileSync(path.join(dist, "index.html"), "utf8");
  for (const file of ["compiler.html", "lyrics.html", "skills.html", "guide.html", "404.html"]) {
    writeFileSync(path.join(dist, file), index);
  }
  return spawnSync(process.execPath, [checkScript, dist], { encoding: "utf8" });
}

describe("offline build Content Security Policy", () => {
  it("replaces 'self' with hashes of the inlined script and stylesheet", () => {
    const { root, dist } = createBuildDirectory();
    try {
      // Vite writes the policy's quotes as &#39; inside the attribute.
      const policy =
        "default-src &#39;none&#39;; script-src &#39;self&#39;; style-src &#39;self&#39;; img-src &#39;self&#39; data:; object-src &#39;none&#39;; base-uri &#39;none&#39;";
      writeFileSync(
        path.join(dist, "index.html"),
        `<head><meta http-equiv="Content-Security-Policy" content="${policy}"><script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css"></head>`,
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

      const checked = runCheck(dist);
      assert.equal(checked.status, 0, checked.stderr);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("embeds web fonts and allows only data: fonts in the offline file", () => {
    const { root, dist } = createBuildDirectory();
    try {
      const policy =
        "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'";
      writeFileSync(
        path.join(dist, "index.html"),
        `<head><meta http-equiv="Content-Security-Policy" content="${policy}"><script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css"></head>`,
      );
      writeFileSync(path.join(dist, "assets", "app.js"), "console.log('app')");
      writeFileSync(path.join(dist, "assets", "font.woff2"), Buffer.from([0x77, 0x4f, 0x46, 0x32]));
      writeFileSync(
        path.join(dist, "assets", "app.css"),
        '@font-face { font-family: X; src: url("./font.woff2") format("woff2"); }',
      );

      const built = spawnSync(process.execPath, [buildScript, dist], { encoding: "utf8" });
      assert.equal(built.status, 0, built.stderr);
      const output = readFileSync(path.join(dist, "suno-workbench.html"), "utf8");
      assert.match(output, /url\("data:font\/woff2;base64,d09GMg=="\)/);
      assert.match(output, /font-src data:/);
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
        `<head><meta http-equiv="Content-Security-Policy" content="${policy}"><script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css"></head>`,
      );
      writeFileSync(path.join(dist, "assets", "app.js"), "console.log('app')");
      writeFileSync(path.join(dist, "assets", "app.css"), "body { color: red; }");
      assert.equal(spawnSync(process.execPath, [buildScript, dist], { encoding: "utf8" }).status, 0);
      const offlinePath = path.join(dist, "suno-workbench.html");
      writeFileSync(
        offlinePath,
        readFileSync(offlinePath, "utf8").replace("console.log('app')", "console.log('changed')"),
      );

      const checked = runCheck(dist);
      assert.notEqual(checked.status, 0);
      assert.match(checked.stderr, /inline script is not allowed by script-src/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("offline build script escaping", () => {
  function build(js: string) {
    const { root, dist } = createBuildDirectory();
    writeFileSync(
      path.join(dist, "index.html"),
      '<script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css">',
    );
    writeFileSync(path.join(dist, "assets", "app.js"), js);
    writeFileSync(path.join(dist, "assets", "app.css"), "a::after { content: '</style>'; }");
    const result = spawnSync(process.execPath, [buildScript, dist], { encoding: "utf8" });
    const output = result.status === 0 ? readFileSync(path.join(dist, "suno-workbench.html"), "utf8") : "";
    rmSync(root, { recursive: true, force: true });
    return { result, output };
  }

  it("leaves no sequence that could end or confuse the inline script or style", () => {
    const { result, output } = build(
      "const t = 'İİ'; const d = document.createElement('div'); d.innerHTML = \"<script></script>\"; const c = `<!-- <SCRIPT>`; console.log(/<\\/script>/i.test(c), d, c);",
    );
    assert.equal(result.status, 0, result.stderr);
    const inside = output.slice(output.indexOf('<script type="module">') + 22, output.lastIndexOf("</script>"));
    assert.doesNotMatch(inside, /<\/?script|<!--/i);
    assert.match(inside, /\\x3Cscript>\\x3C\/script>/);
    assert.doesNotMatch(output.slice(output.indexOf("<style>") + 7, output.lastIndexOf("</style>")), /<\/style/i);
  });

  it("keeps a classic script classic so it still runs before the page paints", () => {
    const { root, dist } = createBuildDirectory();
    try {
      writeFileSync(
        path.join(dist, "index.html"),
        '<head><script src="./theme-init.js"></script><script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css"></head>',
      );
      writeFileSync(path.join(dist, "theme-init.js"), "document.documentElement.dataset.theme = 'dark';");
      writeFileSync(path.join(dist, "assets", "app.js"), "console.log('app')");
      writeFileSync(path.join(dist, "assets", "app.css"), "body { color: red; }");
      const result = spawnSync(process.execPath, [buildScript, dist], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      const output = readFileSync(path.join(dist, "suno-workbench.html"), "utf8");
      assert.match(
        output,
        /<script>document\.documentElement\.dataset\.theme = 'dark';<\/script><script type="module">/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails the build when escaping would change code outside a string", () => {
    const { result } = build("const script = 2; const a = 1; console.log(a<script);");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /no longer parses after escaping/);
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
        '<script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css">',
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
      writeFileSync(
        path.join(dist, "index.html"),
        '<script src="../outside.js"></script><link rel="stylesheet" href="./assets/app.css">',
      );
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
        '<script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css">',
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
