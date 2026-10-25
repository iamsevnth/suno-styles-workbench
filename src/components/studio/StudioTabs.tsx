import { LIBRARY_STATS } from "../../lib/suno/families.ts";
import { hrefFor, StudioRouteId } from "../../routes.ts";
import { IconTile, TileColor } from "../content/Content.tsx";
import type { IconName } from "../icons/icon-data.ts";

interface StudioTab {
  route: StudioRouteId;
  title: string;
  subtitle: string;
  badge: string;
  icon: IconName;
  tile: TileColor;
}

export const STUDIO_TABS: StudioTab[] = [
  {
    route: "styles",
    title: "Styles Compiler",
    subtitle: "925–975 character Styles prompts",
    badge: `${LIBRARY_STATS.genres} Genres`,
    icon: "audio",
    tile: "blue",
  },
  {
    route: "lyrics",
    title: "Lyrics Studio",
    subtitle: "Section builder & American phonetics",
    badge: "Lyrics & Vocal",
    icon: "music",
    tile: "violet",
  },
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
            {isActive && <span className="tab-active-bar absolute top-0 left-0 right-0 h-[3px]" aria-hidden="true" />}
            <span className="flex items-center gap-3 min-w-0">
              <span className="hidden sm:flex">
                <IconTile icon={tab.icon} color={tab.tile} size={34} />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="font-semibold text-sm text-[var(--fg)]">{tab.title}</span>
                <span className="text-[11px] text-[var(--fg-subtle)] mt-0.5">{tab.subtitle}</span>
              </span>
            </span>
            <span
              className={`hidden sm:inline text-[11px] px-2 py-0.5 rounded-md font-semibold tint tile-${tab.tile} ${
                isActive ? "" : "opacity-80"
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
