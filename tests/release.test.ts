import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (filename: string) => readFileSync(path.join(root, filename), "utf8");
const version: string = JSON.parse(load("package.json")).version;
const asset = `suno-workbench-sevnthlabs-v${version}.html`;

describe("official release packaging contract", () => {
  it("matches the version in the package, lockfile, README, Guide and release notes", () => {
    const lock = JSON.parse(load("package-lock.json"));
    assert.match(version, /^\d+\.\d+\.\d+$/);
    assert.equal(lock.version, version);
    assert.equal(lock.packages[""].version, version);
    const notes = load(`docs/releases/v${version}.md`);
    assert.ok(notes.includes(asset));
    assert.ok(notes.includes(asset + ".sha256"));
    assert.ok(load("README.md").includes(`The current package version is **${version}**`));
    assert.ok(load("README.md").includes(`releases/tag/v${version}`));
    assert.ok(load("src/content/guide/verified/current-workbench.md").includes(asset));
    assert.ok(load("src/content/guide/verified/reconciliation.md").includes(`**v${version}**`));
  });

  it("provides a trusted, minimally privileged release workflow after successful production deploy", () => {
    const workflow = load(".github/workflows/release.yml");
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
    // The version is read from package.json, never hard-coded.
    assert.ok(workflow.includes('ASSET="suno-workbench-sevnthlabs-v${VERSION}.html"'));
    assert.ok(workflow.includes('TAG="v${VERSION}"'));
    assert.ok(workflow.includes('--notes-file "docs/releases/v${VERSION}.md"'));
    assert.doesNotMatch(workflow, /sevnthlabs-v\d|TAG="v\d|"\d+\.\d+\.\d+"/);
    assert.match(workflow, /isDraft/);
    assert.ok(workflow.includes('"dist/$ASSET.sha256"'));
    assert.ok(workflow.includes('sha256sum "$ASSET" > "$ASSET.sha256"'));
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
