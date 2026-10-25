import { ShowDialog } from "../Dialog.tsx";
import { useStylesWorkbench } from "../../hooks/useStylesWorkbench.ts";
import { hrefFor } from "../../routes.ts";
import BriefPanel from "./BriefPanel.tsx";
import HistoryPanel from "./HistoryPanel.tsx";
import PromptCard from "./PromptCard.tsx";
import Icon from "../icons/Icon.tsx";
import { IconTile } from "../content/Content.tsx";

const SMALL_BUTTON =
  "h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] font-medium transition-colors";

export default function StylesWorkbench({ showDialog }: { showDialog: ShowDialog }) {
  const wb = useStylesWorkbench(showDialog);
  const heading =
    wb.prompts.length === 0
      ? "No Variations Yet"
      : `${wb.prompts.length} Prompt${wb.prompts.length === 1 ? "" : "s"}${wb.generation > 0 ? ` · Run ${wb.generation}` : ""}`;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
        <BriefPanel wb={wb} />

        <section aria-label="Results" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--fg)]">
              <Icon name="zap" size={16} className="text-[var(--tile-violet-fg)]" />
              {heading}
            </h2>
            {wb.prompts.length > 0 && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={wb.downloadAllPrompts} className={`${SMALL_BUTTON} hover:bg-[var(--bg-subtle)]`}>
                  Download All Prompts
                </button>
                <button
                  type="button"
                  onClick={wb.clearResults}
                  className={`${SMALL_BUTTON} hover:bg-red-500/10 hover:border-red-400/40 hover:text-red-300 light:hover:text-red-700`}
                >
                  Clear Results
                </button>
              </div>
            )}
          </div>

          {wb.prompts.length === 0 ? (
            <div className="surface rounded-[var(--r-xl)] p-6 text-sm text-[var(--fg-muted)] flex gap-4">
              <IconTile icon="layers" color="violet" size={44} />
              <div>
              <strong className="block text-[var(--fg)] text-base mb-1.5">Blank Canvas</strong>
              <p>
                Type a creative brief (or click an example to fill it), then press{" "}
                <span className="text-[var(--fg)] font-medium">Generate Styles</span>. Each result is ready to paste into
                Suno's Styles field.
              </p>
              <p className="text-xs text-[var(--fg-subtle)] mt-3">
                In Suno, set Variety to Off so your Styles text is used word for word.{" "}
                <a href={hrefFor("guide")} className="underline underline-offset-2 hover:text-[var(--fg)] text-[var(--link)]">
                  Read the settings guide
                </a>
                .
              </p>
              </div>
            </div>
          ) : (
            wb.prompts.map((p) => <PromptCard key={p.plan.recipeId} prompt={p} onCopy={wb.copyStyle} />)
          )}
        </section>
      </div>

      <HistoryPanel history={wb.history} onCopy={wb.copyStyle} onExport={wb.exportHistory} onClear={wb.clearHistory} />
    </>
  );
}
