import React, { useState } from "react";
import { SKILLS, skillById } from "../../lib/suno/skills/catalog.ts";
import { runSkill, SkillReport } from "../../lib/suno/skills/run.ts";
import { ShowDialog } from "../Dialog.tsx";
import SkillReportView from "./SkillReportView.tsx";

const DEFAULT_SKILL = "optimizer";

function initialFields(id: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const f of skillById(id)?.fields ?? []) {
    fields[f.key] = f.kind === "select" && f.options?.[0] ? f.options[0].value : "";
  }
  return fields;
}

const FIELD_CLASS = "w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] text-xs";

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
              className={`text-left rounded-[var(--r-md)] border p-3 transition-all ${
                selected
                  ? "border-[var(--border-strong)] bg-[var(--bg-elevated)]"
                  : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]"
              }`}
            >
              <strong className="block text-sm font-semibold text-[var(--fg)]">{s.title}</strong>
              <span className="block text-xs text-[var(--fg-muted)] mt-1 leading-relaxed">{s.blurb}</span>
              <span className="block font-mono text-[10px] tracking-wider uppercase text-[var(--fg-subtle)] mt-1.5">{s.pack}</span>
            </button>
          );
        })}
      </section>

      {skill && (
        <section
          aria-label={skill.title}
          className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] p-5 flex flex-col gap-5"
        >
          <div>
            <h2 className="text-base font-semibold text-[var(--fg)]">{skill.title}</h2>
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
                    <select id={id} value={value} onChange={(e) => setField(f.key, e.target.value)} className={`${FIELD_CLASS} h-10 px-3`}>
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
              className="inline-flex items-center justify-center h-10 rounded-[var(--r-md)] bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] font-semibold text-xs transition-colors self-start px-5"
            >
              {skill.runLabel}
            </button>
          </form>

          {report && <SkillReportView report={report} showDialog={showDialog} />}
        </section>
      )}
    </div>
  );
}
