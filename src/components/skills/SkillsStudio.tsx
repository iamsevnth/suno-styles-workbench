import React, { useState } from "react";
import { SKILLS, skillById } from "../../lib/suno/skills/catalog.ts";
import { runSkill, SkillReport } from "../../lib/suno/skills/run.ts";
import { ShowDialog } from "../Dialog.tsx";
import SkillReportView from "./SkillReportView.tsx";
import { headlineCase } from "../../lib/text/headline-case.ts";
import Icon from "../icons/Icon.tsx";
import { IconTile, TileColor } from "../content/Content.tsx";
import type { IconName } from "../icons/icon-data.ts";

const DEFAULT_SKILL = "optimizer";

function initialFields(id: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const f of skillById(id)?.fields ?? []) {
    fields[f.key] = f.kind === "select" && f.options?.[0] ? f.options[0].value : "";
  }
  return fields;
}

const FIELD_CLASS =
  "w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--input-bg)] text-[var(--fg)] text-xs";

/** Icon and tile color per playbook, matching the mockups. */
const SKILL_LOOK: Record<string, [IconName, TileColor]> = {
  optimizer: ["target", "violet"],
  covers: ["music", "magenta"],
  mashups: ["layers", "orange"],
  lyrics: ["pen", "blue"],
  editor: ["sliders", "cyan"],
  studio: ["play", "violet"],
  rights: ["shieldPlain", "amber"],
  current: ["file", "blue"],
};

export default function SkillsStudio({ showDialog }: { showDialog: ShowDialog }) {
  const [skillId, setSkillId] = useState(DEFAULT_SKILL);
  const [fields, setFields] = useState<Record<string, string>>(() => initialFields(DEFAULT_SKILL));
  const [report, setReport] = useState<SkillReport | null>(null);
  const [error, setError] = useState("");
  const skill = skillById(skillId);

  const selectSkill = (id: string) => {
    setSkillId(id);
    setFields(initialFields(id));
    setReport(null);
    setError("");
  };

  const setField = (key: string, value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill) return;
    const missing = skill.fields.filter((f) => f.required && !String(fields[f.key] || "").trim());
    if (missing.length) {
      setError(`Fill ${missing.map((m) => m.label).join(", ")} first.`);
      setReport(null);
      return;
    }
    setError("");
    try {
      setReport(runSkill(skillId, fields));
    } catch {
      setError("Could not run this skill on that input.");
      setReport(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-8">
      <section aria-label="Playbooks" className="flex flex-col gap-2">
        {SKILLS.map((s) => {
          const selected = s.id === skillId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSkill(s.id)}
              aria-pressed={selected}
              className={`group text-left rounded-[var(--r-md)] border p-3 transition-all flex items-center gap-3 ${
                selected
                  ? "border-[var(--border-strong)] light:border-[#a98af5] bg-[var(--bg-elevated)] light:bg-[#f7f3ff] light:shadow-[inset_3px_0_0_#6005e7]"
                  : "border-[var(--border)] bg-[var(--bg)] light:bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]"
              }`}
            >
              <IconTile icon={SKILL_LOOK[s.id]?.[0] ?? "file"} color={SKILL_LOOK[s.id]?.[1] ?? "blue"} size={44} />
              <span className="flex-1 min-w-0">
                <strong className="block text-sm font-semibold text-[var(--fg)]">{s.title}</strong>
                <span className="block text-xs text-[var(--fg-muted)] mt-1 leading-relaxed">{s.blurb}</span>
                <span className="label-caps-sm block mt-1.5 light:text-[var(--tile-violet-fg)]">{s.pack}</span>
              </span>
              <Icon name="chevronRight" size={16} className="text-[var(--fg-subtle)] shrink-0" />
            </button>
          );
        })}
      </section>

      {skill && (
        <section aria-label={skill.title} className="surface rounded-[var(--r-xl)] p-5 flex flex-col gap-5">
          <div>
            <h2 className="flex items-center gap-3 text-lg font-bold text-[var(--fg)]">
              <IconTile
                icon={SKILL_LOOK[skill.id]?.[0] ?? "file"}
                color={SKILL_LOOK[skill.id]?.[1] ?? "blue"}
                size={36}
              />
              {headlineCase(skill.title)}
            </h2>
            <p className="text-xs text-[var(--fg-muted)] mt-1">{skill.blurb}</p>
          </div>

          <form onSubmit={run} className="flex flex-col gap-4">
            {skill.fields.map((f) => {
              const id = `sf-${f.key}`;
              const value = fields[f.key] ?? "";
              return (
                <div key={f.key}>
                  <label htmlFor={id} className="block text-xs font-medium mb-1 text-[var(--fg)]">
                    {f.label}
                  </label>
                  {f.kind === "select" ? (
                    <select
                      id={id}
                      value={value}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className={`${FIELD_CLASS} h-10 px-3`}
                    >
                      {(f.options || []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.kind === "textarea" ? (
                    <textarea
                      id={id}
                      rows={f.rows || 3}
                      value={value}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder || ""}
                      className={`${FIELD_CLASS} p-2.5 resize-y`}
                    />
                  ) : (
                    <input
                      type="text"
                      id={id}
                      value={value}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder || ""}
                      className={`${FIELD_CLASS} h-10 px-3`}
                    />
                  )}
                </div>
              );
            })}

            {error && (
              <p className="text-xs text-[var(--danger)]" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary inline-flex items-center justify-center gap-2 h-11 rounded-[var(--r-md)] font-semibold text-sm transition-all self-start px-6"
            >
              <Icon name="sparkles" size={16} />
              {skill.runLabel}
            </button>
          </form>

          {report && <SkillReportView report={report} showDialog={showDialog} />}
        </section>
      )}
    </div>
  );
}
