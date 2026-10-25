import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { runInNewContext } from "node:vm";
import { THEME_KEY } from "../src/lib/browser/theme.ts";

const script = readFileSync(new URL("../public/theme-init.js", import.meta.url), "utf8");

/** Runs public/theme-init.js against a fake page and returns the theme it applied. */
function initialTheme(stored: string | null, systemLight: boolean, storageThrows = false): string | null {
  let applied: string | null = null;
  runInNewContext(script, {
    window: {
      localStorage: {
        getItem: (key: string) => {
          if (storageThrows) throw new Error("blocked");
          return key === THEME_KEY ? stored : null;
        },
      },
      matchMedia: (query: string) => ({ matches: systemLight && query.includes("light") }),
    },
    document: { documentElement: { setAttribute: (_name: string, value: string) => (applied = value) } },
  });
  return applied;
}

describe("theme before first paint", () => {
  it("uses the theme the visitor picked", () => {
    assert.equal(initialTheme("light", false), "light");
    assert.equal(initialTheme("dark", true), "dark");
  });

  it("follows the device setting until the visitor picks one", () => {
    assert.equal(initialTheme(null, true), "light");
    assert.equal(initialTheme(null, false), "dark");
  });

  it("ignores an unknown stored value and blocked storage", () => {
    assert.equal(initialTheme("sepia", true), "light");
    assert.equal(initialTheme(null, false, true), "dark");
  });
});
