import { VOCAL_BUDGET } from "../../lib/suno/render.ts";
export default function LiveVocalBudget() {
  const rows = [["Compact vocal sentence", VOCAL_BUDGET.compact], ["Detailed vocal sentence", VOCAL_BUDGET.detailed]] as const;
  return (
    <figure className="guide-vocal-budget" aria-label="Current vocal character budgets">
      <figcaption><strong>Live v4 Vocal Budgets</strong><span>From the active Styles renderer</span></figcaption>
      {rows.map(([name,amount])=>(
        <div className="guide-vocal-budget-row" key={name}>
          <span>{name}</span>
          <div className="guide-live-chart-track" aria-hidden="true">
            <div className="guide-vocal-budget-fill" style={{width:`${amount/VOCAL_BUDGET.detailed*100}%`}} />
          </div>
          <strong>{amount} max</strong>
        </div>
      ))}
      <p>The manuscript's five-tier figure is an older editorial model. The current renderer enforces compact and detailed vocal-sentence budgets; an instrumental output has no singer sentence. The remaining Styles space is for music and production.</p>
    </figure>
  );
}
