import { useId, useMemo, useState } from "react";
import { downloadFile } from "../../lib/browser/download.ts";
import { extractConstraintIntent, parseKeyIntent, parseMeterIntent, parseTempoIntent } from "../../lib/suno/intent.ts";
import {
  analyzePromptFidelity, SUNO_FIELD_SOURCES,
  type FidelityFinding, type FidelityStatus,
} from "../../lib/suno/fidelity.ts";

interface FidelityInspectorProps {
  sourceText: string;
  styleText: string;
  excludeText: string;
  fixMode: boolean;
  label: string;
}
const LABELS: Record<FidelityStatus, string> = {
  matched: "Text Matched",
  different: "Explicit Difference",
  "not-found": "Not Detected",
  review: "Review Needed",
};
const SORT_ORDER: Record<FidelityStatus, number> = {
  different: 0,
  "not-found": 1,
  review: 2,
  matched: 3,
};
function pillClass(status: FidelityStatus): string {
  if (status === "matched") return "text-emerald-600 light:text-emerald-700";
  if (status === "different") return "text-red-400 light:text-red-700";
  return "text-amber-400 light:text-amber-700";
}
function initialFacts(text: string): string {
  const positive = extractConstraintIntent(text);
  const tempos = parseTempoIntent(positive.positiveText).mentions.map(x =>
    x.raw + " (" + x.role + ")").join(" · ");
  const key = parseKeyIntent(positive.positiveText);
  const meter = parseMeterIntent(positive.positiveText);
  const excluded = positive.exclusions.length;
  return [
    "Source length: " + text.length + " characters",
    "BPM references: " + (tempos || "none detected"),
    "Key: " + (key || "none detected"),
    "Meter: " + (meter || "none detected"),
    "Negative instructions detected: " + excluded + " (checked against the separate Exclude field)",
  ].join(" · ");
}
function FindingsTable({ findings }: { findings: FidelityFinding[] }) {
  return (
    <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
      <table className="w-full text-xs text-left">
        <thead className="bg-[var(--bg-subtle)] text-[var(--fg)]">
          <tr>
            <th scope="col" className="p-2.5 font-semibold">Source Requirement</th>
            <th scope="col" className="p-2.5 font-semibold">Result</th>
            <th scope="col" className="p-2.5 font-semibold">Observed Text / Explanation</th>
          </tr>
        </thead>
        <tbody>
          {findings.map(item => (
            <tr key={item.id} className="border-t border-[var(--border)] align-top">
              <td className="p-2.5 min-w-[150px] text-[var(--fg)]">
                <span className="font-semibold block">{item.requested}</span>
                <span className="text-[var(--fg-subtle)]">{item.category} · {item.method} match</span>
                <span className="text-[var(--fg-muted)] block mt-1 whitespace-pre-wrap break-words">
                  Source: {item.sourceEvidence}
                </span>
              </td>
              <td className={"p-2.5 min-w-[110px] font-semibold " + pillClass(item.status)}>
                {LABELS[item.status]}
              </td>
              <td className="p-2.5 min-w-[170px] text-[var(--fg-muted)]">
                {item.outputEvidence ? <span className="font-mono text-[var(--fg)] block mb-1 break-words">
                  Observed: {item.outputEvidence}
                </span> : null}
                {item.explanation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FidelityInspector({
  sourceText, styleText, excludeText, fixMode, label,
}: FidelityInspectorProps) {
  const referenceId = useId();
  const [expanded, setExpanded] = useState(false);
  const [showMatched, setShowMatched] = useState(false);
  const [referenceBrief, setReferenceBrief] = useState("");
  const comparisonSource = fixMode && referenceBrief.trim() ? referenceBrief : sourceText;
  const report = useMemo(() => {
    if (!comparisonSource.trim() || !styleText.trim()) return null;
    try {
      return { report: analyzePromptFidelity(comparisonSource, styleText, excludeText), error: "" };
    } catch (error) {
      return { report: null, error: error instanceof Error ? error.message : "Could not inspect the provided text." };
    }
  }, [comparisonSource, styleText, excludeText]);
  const preFixReport = useMemo(() => {
    if (!fixMode || !referenceBrief.trim() || !sourceText.trim()) return null;
    try { return analyzePromptFidelity(referenceBrief, sourceText, ""); } catch { return null; }
  }, [fixMode, referenceBrief, sourceText]);

  if (!report) {
    return <p className="text-xs text-[var(--fg-subtle)] p-4 border-t border-[var(--border)]">
      Source fidelity unavailable: the original input was not saved with this result. Regenerate to compare.
    </p>;
  }
  if (!report.report) {
    return <p className="text-xs text-[var(--danger)] p-4 border-t border-[var(--border)]">
      Fidelity analysis unavailable: {report.error}
    </p>;
  }
  const audit = report.report;
  const examined = audit.findings.length;
  const unresolved = audit.counts.different + audit.counts["not-found"] + audit.counts.review;
  const visible = [...audit.findings].sort((a, b) => SORT_ORDER[a.status] - SORT_ORDER[b.status])
    .filter(x => showMatched || x.status !== "matched");
  const exportReport = () => {
    downloadFile("suno-fidelity-v5.3.json", JSON.stringify({
      inspectorVersion: "5.3.0",
      generatedAt: new Date().toISOString(),
      sourceMode: fixMode ? "pre-fixed-styles" : "original-creative-brief",
      label, originalIntent: referenceBrief.trim() || undefined, source: sourceText,
      comparisonSource, output: styleText, exclude: excludeText, preFixReport, ...audit,
      officialSources: SUNO_FIELD_SOURCES,
    }, null, 2), "application/json;charset=utf-8");
  };

  return (
    <section className="border-t border-[var(--border)]" aria-label="Prompt Fidelity Inspector">
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(x => !x)}
        className="flex w-full items-center justify-between gap-2 p-4 text-left text-xs text-[var(--fg)] hover:bg-[var(--bg-subtle)]">
        <span>
          <strong className="text-sm">Prompt Fidelity Inspector</strong>
          <span className="block text-[var(--fg-subtle)] mt-1">
            {examined} explicit source checks · {audit.counts.matched} text matches · {unresolved} require review
          </span>
        </span>
        <span aria-hidden="true">{expanded ? "▴" : "▾"}</span>
      </button>
      {expanded && (
        <div className="p-4 pt-0 flex flex-col gap-4">
          <div className="rounded-lg bg-[var(--bg-subtle)] p-3 text-xs text-[var(--fg-muted)]">
            <strong className="text-[var(--fg)] block mb-1">Measured: textual source fidelity only</strong>
            Explicit source-to-output text comparisons, not a prompt-quality score.
            <strong> A text match does not mean Suno produced the intended sound.</strong>
            Undetected wording may be a paraphrase, and unsupported concepts are not counted as retained.
            This analysis does not use a trained AI model or listening data.
          </div>

          {fixMode && (
            <div className="border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--fg-muted)]">
              <h4 className="font-semibold text-[var(--fg)] mb-1">Before Fix — original text snapshot</h4>
              <p>{initialFacts(sourceText)}</p>
              <p className="mt-2 text-[var(--fg-subtle)]">
                Without a separate original-intent brief, the pre-Fix prompt is the only available baseline; its fidelity to an earlier intent cannot be evaluated.
                A negative instruction written in Styles is not proof that Suno's separate Exclude field was configured.
              </p>
            </div>
          )}

          {fixMode && (
            <div className="border border-[var(--border)] rounded-lg p-3 text-xs flex flex-col gap-2">
              <label htmlFor={referenceId} className="font-semibold text-[var(--fg)]">
                Optional Original Intent / Brief (before the pre-Fix prompt)
              </label>
              <textarea id={referenceId} rows={4} value={referenceBrief}
                onChange={e => setReferenceBrief(e.target.value)}
                placeholder="If your original creative brief is available, paste it here to audit both pre-Fix and fixed Styles against the same original instructions."
                className="w-full rounded-lg p-2 text-xs font-mono bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] resize-y"/>
              <p className="text-[var(--fg-subtle)]">Optional and stored only in this open inspector session. No compiler changes or server requests. If omitted, the pre-Fix prompt remains the sole reference.</p>
              {preFixReport && (
                <div className="space-y-2">
                  <strong className="block text-[var(--fg)]">Original Brief vs. Pre-Fix Prompt</strong>
                  <p className="text-[var(--fg-muted)]">Before fix: {preFixReport.counts.matched} text matches · {preFixReport.counts.different} explicit differences · {preFixReport.counts["not-found"]} not detected · {preFixReport.counts.review} review needed.</p>
                  <p className="text-[var(--fg-subtle)]">The pre-Fix Exclude field was not provided, so absence of exclusions here cannot establish the settings used for the earlier generation.</p>
                  <FindingsTable findings={preFixReport.findings} />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-[var(--fg)]">
              {fixMode ? "Original Pre-Fix Prompt" : "Original Creative Brief"}
              <textarea rows={7} readOnly value={sourceText}
                className="w-full mt-1 border border-[var(--border)] bg-[var(--bg)] rounded-lg p-2 text-xs font-mono text-[var(--fg-muted)] resize-y"/>
            </label>
            <label className="text-xs font-semibold text-[var(--fg)]">
              {fixMode ? "Fixed Styles Prompt" : "Generated Styles Prompt"}
              <textarea rows={7} readOnly value={styleText}
                className="w-full mt-1 border border-[var(--border)] bg-[var(--bg)] rounded-lg p-2 text-xs font-mono text-[var(--fg-muted)] resize-y"/>
            </label>
          </div>
          {excludeText.trim() && (
            <p className="text-xs text-[var(--fg-muted)]">
              <strong className="text-[var(--fg)]">Separate Exclude field:</strong> {excludeText}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-[var(--fg)]">
              Findings · {audit.counts.matched} matched · {audit.counts.different} different · {audit.counts["not-found"]} not detected · {audit.counts.review} uncertain
            </h4>
            <div className="flex items-center gap-2">
              <label className="flex gap-1 items-center text-xs text-[var(--fg-muted)]">
                <input type="checkbox" checked={showMatched} onChange={e => setShowMatched(e.target.checked)}/>
                Show Matches
              </label>
              <button type="button" onClick={exportReport}
                className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-medium text-[var(--fg)] hover:bg-[var(--bg-subtle)]">
                Export Findings JSON
              </button>
            </div>
          </div>

          {visible.length > 0 ? <FindingsTable findings={visible} /> :
            <p className="rounded-lg border border-[var(--border)] p-3 text-xs text-[var(--fg-muted)]">
              {examined === 0
                ? "No supported explicit musical facts were extracted. This is not a confirmation of complete source fidelity."
                : "No unresolved findings among recognized source facts. Show Matches to inspect the evidence; unrecognized intent still requires review."}
            </p>}
          <div className="text-xs text-[var(--fg-subtle)] space-y-2 border-t border-[var(--border)] pt-3">
            {audit.caveats.map((s, i) => <p key={i}>• {s}</p>)}
            <strong className="block text-[var(--fg)]">Official field-behavior references (not audio benchmarks)</strong>
            {SUNO_FIELD_SOURCES.map(source => (
              <p key={source.id}>
                <a href={source.url} target="_blank" rel="noopener noreferrer"
                  className="text-[var(--link)] underline underline-offset-2">{source.label}</a>
                {" — "}{source.claim}
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
