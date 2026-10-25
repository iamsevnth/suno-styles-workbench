import { hrefFor, NAV_ITEMS, REPO_URL, RouteId } from "../../routes.ts";
import OfflineDownloadLink from "./OfflineDownloadLink.tsx";
import { LogoMark } from "./Logo.tsx";
import Icon from "../icons/Icon.tsx";
import ThemeToggle from "./ThemeToggle.tsx";

export default function SiteHeader({ route }: { route: RouteId }) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/85 backdrop-blur-md sticky top-0 z-40">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-[var(--accent)] focus:px-3 focus:py-1.5 focus:text-[var(--accent-fg)] focus:text-xs"
      >
        Skip to content
      </a>
      <div className="max-w-[76rem] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <a href={hrefFor("home")} className="flex items-center gap-2.5" aria-label="Suno Workbench home">
          <LogoMark height={30} />
          <span className="font-bold tracking-tight text-sm text-[var(--fg)]">SUNO WORKBENCH</span>
        </a>

        <div className="flex items-center gap-2 sm:order-last">
          <OfflineDownloadLink className="hidden sm:inline-flex" />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs font-medium h-8 px-3 transition-colors"
          >
            <Icon name="github" size={14} />
            GitHub
          </a>
          <ThemeToggle />
        </div>

        <nav aria-label="Main" className="w-full sm:w-auto overflow-x-auto -mx-1">
          <ul className="flex items-center gap-1 px-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.route === route;
              return (
                <li key={item.route}>
                  <a
                    href={hrefFor(item.route)}
                    aria-current={isActive ? "page" : undefined}
                    className={`block whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)] font-semibold"
                        : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]/60"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
