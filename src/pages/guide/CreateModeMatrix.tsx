export default function CreateModeMatrix() {
  const modes = [
    ["Safer / Looser", "Conventional exploration", "Less surprising choices with more freedom to reinterpret the Styles text.", "tile-cyan"],
    ["Safer / Stronger", "Controlled direction", "More conventional choices, but closely guided by your Styles text.", "tile-green"],
    ["Chaotic / Looser", "Open discovery", "High variation with comparatively little Styles constraint.", "tile-magenta"],
    ["Chaotic / Stronger", "Adventurous within direction", "Unexpected timbres and structures while retaining stronger style guidance.", "tile-violet"],
  ] as const;
  return (
    <figure className="guide-create-matrix" aria-label="Illustrative interaction of Weirdness and Style Influence">
      <figcaption>
        <strong>Weirdness × Style Influence</strong>
        <span>Interpretive producer map — not an official Suno preset</span>
      </figcaption>
      <div className="guide-create-matrix-grid">
        {modes.map(([axis,title,detail,color])=>(
          <div key={title} className={`guide-create-matrix-cell tint ${color}`}>
            <span>{axis}</span><strong>{title}</strong><p>{detail}</p>
          </div>
        ))}
      </div>
      <p className="guide-live-chart-explanation">
        Horizontal comparison: Loose versus Strong Style Influence. Vertical comparison: Safe versus Chaos Weirdness.
        Suno documents 50% Weirdness as normal, but does not prescribe these quadrants as fixed outcome guarantees.
        Variety is a separate control; 0 retains exact style tags.
      </p>
    </figure>
  );
}
