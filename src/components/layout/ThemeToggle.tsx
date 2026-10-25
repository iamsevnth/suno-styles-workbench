import { useTheme } from "../../hooks/useTheme.ts";
import Icon from "../icons/Icon.tsx";

/** Sun/moon button that switches between light and dark mode. */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)] h-8 w-8 transition-colors"
    >
      <Icon name={theme === "light" ? "moon" : "sun"} size={16} />
    </button>
  );
}
