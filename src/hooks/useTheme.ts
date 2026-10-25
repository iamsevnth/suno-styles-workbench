import { useEffect, useState } from "react";

import { LIGHT_QUERY, pickTheme, Theme, THEME_KEY } from "../lib/browser/theme.ts";

const PAGE_COLOR: Record<Theme, string> = { light: "#f3f6fb", dark: "#0a0a0b" };

function savedValue(): string | null {
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

const deviceIsLight = () => Boolean(window.matchMedia?.(LIGHT_QUERY).matches);

function apply(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", PAGE_COLOR[theme]);
}

/**
 * The page's color theme. It follows the device setting until the visitor picks one with the toggle;
 * that choice is remembered in this browser (localStorage) and is never sent anywhere.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const current = document.documentElement.getAttribute("data-theme");
    return current === "light" || current === "dark" ? current : pickTheme(savedValue(), deviceIsLight());
  });

  useEffect(() => apply(theme), [theme]);

  // Follow the device setting live, but only while the visitor has not chosen a theme.
  useEffect(() => {
    const query = window.matchMedia?.(LIGHT_QUERY);
    if (!query) return;
    const onChange = () => setTheme(pickTheme(savedValue(), query.matches));
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked: the theme still switches for this visit.
    }
    setTheme(next);
  };

  return { theme, toggle };
}
