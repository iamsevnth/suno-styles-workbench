import { hrefFor, StudioRouteId } from "../../routes.ts";

interface StudioTab {
  route: StudioRouteId;
  title: string;
  subtitle: string;
  badge: string;
}

export const STUDIO_TABS: StudioTab[] = [
  { route: "styles", title: "Styles Compiler", subtitle: "925–975 character Styles prompts", badge: "258 Genres" },
  { route: "lyrics", title: "Lyrics Studio", subtitle: "Section builder & American phonetics", badge: "Lyrics & Vocal" },
  { route: "skills", title: "Skills Studio", subtitle: "8 production playbooks & sliders", badge: "Playbooks" },
];

export default function StudioTabs({ active }: { active: StudioRouteId }) {
  return (
    <nav
      className="flex items-stretch border-b border-[var(--border)] bg-[var(--bg)] overflow-x-auto"
      aria-label="Studio tools"
    >
      {STUDIO_TABS.map((tab) => {
        const isActive = tab.route === active;
        return (
          <a
            key={tab.route}
            href={hrefFor(tab.route)}
            aria-current={isActive ? "page" : undefined}
            className={`flex-1 min-w-[180px] sm:min-w-[240px] px-5 py-3.5 text-left border-r last:border-r-0 border-[var(--border)] transition-all relative flex items-center justify-between gap-3 ${
              isActive
                ? "bg-[var(--bg-elevated)] text-[var(--fg)] shadow-sm"
                : "bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]/60"
            }`}
          >
            {isActive && <span className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />}
            <span className="flex flex-col">
              <span className="font-semibold text-sm text-[var(--fg)]">{tab.title}</span>
              <span className="text-[11px] text-[var(--fg-subtle)] mt-0.5">{tab.subtitle}</span>
            </span>
            <span
              className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded font-mono ${
                isActive
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold"
                  : "bg-[var(--bg-subtle)] text-[var(--fg-subtle)]"
              }`}
            >
              {tab.badge}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
