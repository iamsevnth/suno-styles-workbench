import { copyToClipboard } from "../../lib/browser/clipboard.ts";
import { SkillReport } from "../../lib/suno/skills/run.ts";
import { toTitleCase } from "../../lib/suno/title-case.ts";
import { ShowDialog } from "../Dialog.tsx";

function reportAsText(r: SkillReport): string {
  const lines = [`# ${r.title}`, "", r.exclusion, "", ...r.sections.flatMap((s) => [`## ${s.heading}`, s.body, ""])];
  if (r.sliders?.length) {
    lines.push("## Slider Starting Points");
    for (const s of r.sliders) {
      lines.push(`${s.label}: Weirdness ${s.weirdness} · Style ${s.style} · Audio ${s.audio} — ${s.why}`);
    }
    lines.push("");
  }
  if (r.styles?.length) {
    lines.push("## Compiled Styles");
    for (const p of r.styles) lines.push(`${p.title}\n\n${p.styles}\n`);
  }
  lines.push(r.verified);
  return lines.join("\n");
}

interface SkillReportViewProps {
  report: SkillReport;
  showDialog: ShowDialog;
}

export default function SkillReportView({ report, showDialog }: SkillReportViewProps) {
  const copy = async (text: string, success: string) => {
    const ok = await copyToClipboard(text);
    showDialog(ok ? "ok" : "error", ok ? "Copied" : "Clipboard Blocked", ok ? success : "Clipboard access is blocked. Select the text and copy it manually.");
  };

  return (
    <div className="border-t border-[var(--border)] pt-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--fg)]">{toTitleCase(report.title)}</h3>
        <button
          type="button"
          onClick={() => copy(reportAsText(report), "The playbook is on your clipboard.")}
          className="h-8 px-2.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          Copy Playbook
        </button>
      </div>

      <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--fg-muted)] whitespace-pre-wrap leading-relaxed">
        {report.exclusion}
      </div>

      {report.sections.map((s) => (
        <article key={s.heading} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h4 className="label-caps-sm">{s.heading}</h4>
            <button
              type="button"
              onClick={() => copy(s.body, "Section copied.")}
              className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              Copy
            </button>
          </div>
          <p className="whitespace-pre-wrap text-xs text-[var(--fg-muted)] leading-relaxed">{s.body}</p>
        </article>
      ))}

      {report.sliders && report.sliders.length > 0 && (
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {report.sliders.map((sl) => (
            <div key={sl.label} className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-3 text-xs">
              <strong className="block text-[var(--fg)] font-semibold">{sl.label}</strong>
              <p className="font-mono text-[var(--fg-muted)] text-[11px] mt-1.5 leading-snug">
                Weirdness {sl.weirdness}
                <br />
                Style {sl.style}
                <br />
                Audio {sl.audio}
              </p>
              <p className="text-[11px] text-[var(--fg-subtle)] mt-2 leading-relaxed">{sl.why}</p>
            </div>
          ))}
        </div>
      )}

      {report.styles && report.styles.length > 0 && (
        <div className="flex flex-col gap-2">
          {report.styles.map((p) => (
            <article key={p.styles} className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-[var(--fg)] font-semibold">{p.title}</strong>
                <button
                  type="button"
                  onClick={() => copy(p.styles, "This style is on your clipboard. Paste it into Suno's Styles field.")}
                  className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                >
                  Copy Style
                </button>
              </div>
              <div className="text-[10px] text-[var(--fg-subtle)] mt-0.5">{p.characters} total characters</div>
              <p className="mt-2 text-xs text-[var(--fg-muted)] whitespace-pre-wrap leading-relaxed">{p.styles}</p>
            </article>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[var(--fg-subtle)]">{report.verified}</p>
    </div>
  );
}
