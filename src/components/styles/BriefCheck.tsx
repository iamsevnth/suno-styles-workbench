import { useDeferredValue, useMemo } from "react";
import { parseUserInput } from "../../lib/suno/parse.ts";
import { lintBrief } from "../../lib/suno/lint.ts";
import type { ParsedInput, SonicPlan } from "../../lib/suno/types.ts";
import Icon from "../icons/Icon.tsx";

/**
 * Checks the brief as it is typed. It only reads the brief; nothing is generated. After a
 * generation of the same brief, the genre advice names the roles the engine chose.
 */
export default function BriefCheck({ input, profileEnabled, instrumentalDefault, parsed, plan }: {
  input: string;
  profileEnabled: boolean;
  instrumentalDefault?: boolean;
  parsed: ParsedInput | null;
  plan?: SonicPlan;
}) {
  const text = useDeferredValue(input);
  const findings = useMemo(() => {
    if (!text.trim()) return [];
    try {
      const fresh = parseUserInput(text, { profileEnabled, instrumentalDefault });
      // The parser strips exclusions from raw, so compare those too before reusing the plan.
      const same = !!parsed && parsed.raw === fresh.raw &&
        (parsed.exclusions ?? []).join("|") === (fresh.exclusions ?? []).join("|");
      return lintBrief(fresh, same ? plan : undefined);
    } catch {
      return [];
    }
  }, [text, profileEnabled, instrumentalDefault, parsed, plan]);

  if (!text.trim()) return null;
  return (
    <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] light:bg-[var(--bg-subtle)] p-3 text-xs text-[var(--fg-muted)]" aria-label="Brief Check">
      <div className="flex items-center gap-2 font-semibold text-sm text-[var(--fg)]">
        <Icon name="lightbulb" size={16} className="text-[var(--tile-violet-fg)]" />
        Brief Check
        <span className="ml-auto font-normal text-[11px] text-[var(--fg-subtle)]">
          {findings.length ? `${findings.length} ${findings.length === 1 ? "note" : "notes"}` : "No conflicts found"}
        </span>
      </div>
      {findings.length > 0 && (
        <ul className="list-none m-0 mt-2 p-0 flex flex-col gap-2">
          {findings.map((f) => (
            <li key={f.id} className="flex gap-2" data-lint={f.id}>
              <span
                className={`mt-1 w-2 h-2 rounded-full shrink-0 ${f.severity === "warning" ? "bg-[var(--warn)]" : "bg-[var(--tile-violet-fg)]"}`}
                aria-hidden="true"
              />
              <div>
                <div className="text-[var(--fg)] font-medium">
                  {f.title}
                  <span className="sr-only"> ({f.severity})</span>
                </div>
                <p className="m-0">{f.message}</p>
                <p className="m-0 mt-0.5 text-[var(--fg)]">Try: {f.fix}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
