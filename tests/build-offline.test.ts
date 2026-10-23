import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import path from "node:path";

describe("offline build path", () => {
  it("rejects build directories outside the repository", () => {
    const result = spawnSync(
      process.execPath,
      [path.resolve("scripts/build-offline.mjs"), ".."],
      { encoding: "utf8" },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Build directory must be inside the repository/);
  });
});
