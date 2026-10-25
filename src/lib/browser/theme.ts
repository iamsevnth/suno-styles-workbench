export type Theme = "light" | "dark";

/** localStorage key for the visitor's theme choice; public/theme-init.js reads the same key. */
export const THEME_KEY = "suno-workbench-theme";

/** Media query for the device setting; public/theme-init.js uses the same query. */
export const LIGHT_QUERY = "(prefers-color-scheme: light)";

/**
 * The rule public/theme-init.js applies before first paint, and useTheme applies after: a theme the
 * visitor picked wins; anything else (nothing saved, an unknown value, blocked storage) follows the
 * device setting.
 */
export function pickTheme(saved: string | null, deviceIsLight: boolean): Theme {
  if (saved === "light" || saved === "dark") return saved;
  return deviceIsLight ? "light" : "dark";
}
