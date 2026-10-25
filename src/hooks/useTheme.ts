import { useEffect, useState } from "react";

import { Theme, THEME_KEY } from "../lib/browser/theme.ts";

const PAGE_COLOR: Record<Theme, string> = { light: "#f3f6fb", dark: "#0a0a0b" };

function savedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

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
    return current === "light" || current === "dark" ? current : (savedTheme() ?? systemTheme());
  });

  useEffect(() => apply(theme), [theme]);

  // Follow the device setting live, but only while the visitor has not chosen a theme.
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!query) return;
    const onChange = () => {
      if (!savedTheme()) setTheme(query.matches ? "light" : "dark");
    };
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
