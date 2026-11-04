import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (filename: string) => readFileSync(path.join(root, filename), "utf8");
const asset = "suno-workbench-sevnthlabs-v5.3.html";

describe("official v5.3 release packaging contract", () => {
  it("matches the version in the package, lockfile and release documentation", () => {
    const pkg = JSON.parse(load("package.json"));
    const lock = JSON.parse(load("package-lock.json"));
    assert.equal(pkg.version, "5.3.0");
    assert.equal(lock.version, "5.3.0");
    assert.equal(lock.packages[""].version, "5.3.0");
    const notes = load("docs/releases/v5.3.0.md");
    assert.ok(notes.includes(asset));
    assert.ok(notes.includes(asset + ".sha256"));
  });

  it("provides a trusted, minimally privileged release workflow after successful production deploy", () => {
    const workflow = load(".github/workflows/release-v53.yml");
    assert.match(workflow, /workflow_run:/);
    assert.match(workflow, /workflows: \["Test and deploy"\]/);
    assert.match(workflow, /github\.event\.workflow_run\.conclusion == 'success'/);
    assert.match(workflow, /github\.event\.workflow_run\.event == 'push'/);
    assert.match(workflow, /github\.event\.workflow_run\.head_repository\.full_name == github\.repository/);
    assert.match(workflow, /contents: write/);
    assert.match(workflow, /persist-credentials: false/);
    assert.match(workflow, /npm run lint/);
    assert.match(workflow, /npm test/);
    assert.match(workflow, /npm run build/);
    assert.match(workflow, /cmp -s dist\/suno-workbench\.html/);
    assert.match(workflow, /sha256sum --check/);
    assert.match(workflow, /gh release create/);
    assert.ok(workflow.includes(asset));
    assert.ok(workflow.includes(asset + ".sha256"));
    assert.ok(workflow.includes("suno-workbench-sevnthlabs-v5.3"));
    assert.ok(workflow.includes("v5.3.0"));
    assert.match(workflow, /--target "\$COMMIT_SHA"/);
    assert.match(workflow, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/);
    assert.doesNotMatch(workflow, /pull_request:/);
  });

  it("the offline builder produces the expected complete local HTML before the release rename", () => {
    const builder = load("scripts/build-offline.mjs");
    const csp = load("scripts/check-csp.mjs");
    const packageJson = JSON.parse(load("package.json"));
    assert.match(builder, /suno-workbench\.html/);
    assert.match(builder, /CSP_META/);
    assert.ok(packageJson.scripts.build.includes("build-offline.mjs"));
    assert.ok(packageJson.scripts.build.includes("check-csp.mjs"));
    assert.ok(csp.length > 1000);
  });
});
