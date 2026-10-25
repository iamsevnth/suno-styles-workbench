import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { LIGHT_QUERY, pickTheme, THEME_KEY } from "../src/lib/browser/theme.ts";

describe("choosing the theme", () => {
  it("uses the theme the visitor picked", () => {
    assert.equal(pickTheme("light", false), "light");
    assert.equal(pickTheme("dark", true), "dark");
  });

  it("follows the device setting until the visitor picks one", () => {
    assert.equal(pickTheme(null, true), "light");
    assert.equal(pickTheme(null, false), "dark");
  });

  it("ignores an unknown stored value", () => {
    assert.equal(pickTheme("sepia", true), "light");
    assert.equal(pickTheme("", false), "dark");
  });
});

describe("pre-paint script", () => {
  // public/theme-init.js runs before the app's code loads, so it repeats pickTheme's rule in plain
  // JavaScript. These checks keep the two in step: same storage key, same query, same values.
  const script = readFileSync(new URL("../public/theme-init.js", import.meta.url), "utf8");

  it("reads the same storage key and device setting as the app", () => {
    assert.ok(script.includes(`"${THEME_KEY}"`), "storage key");
    assert.ok(script.includes(`"${LIGHT_QUERY}"`), "media query");
  });

  it("accepts only light or dark and sets data-theme", () => {
    assert.match(script, /theme !== "light" && theme !== "dark"/);
    assert.match(script, /setAttribute\("data-theme", theme\)/);
    assert.match(script, /try \{[\s\S]*localStorage[\s\S]*\} catch/);
  });
});
