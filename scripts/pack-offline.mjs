import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';

const bundle = await esbuild.build({
  entryPoints: ['src/offline/entry.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'Suno',
  write: false,
  target: 'es2022',
});

const sunoCoreJs = bundle.outputFiles[0].text;

const uiJs = `
(function () {
  const S = window.Suno;
  const STORAGE_KEY = "suno-styles-generator:v1";
  const HISTORY_KEY = "suno-styles-history:v1";
  const SUGGEST_KEY = "suno-styles-suggestions:v1";
  const DEFAULT_COUNT = 3;

  const state = {
    view: "styles",
    input: "",
    count: DEFAULT_COUNT,
    profileEnabled: true,
    generation: 0,
    seedUsed: 0,
    prompts: [],
    parsed: null,
    lastAction: "",
    suggestions: [S.SURPRISE_BRIEF],
    history: [],
    historyOpen: true,
    expandedPlans: {},
    openHistory: {},
    cliOpen: false,
    skillId: "optimizer",
    skillFields: {},
    skillReport: null,
    skillError: "",
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => {
      if (c === "&") return "&";
      if (c === "<") return "<";
      if (c === ">") return ">";
      if (c === '"') return "&#34;";
      return "&#39;";
    });
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function saveJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      /* ignore */
    }
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fall through */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }

  function showDialog(kind, title, body) {
    const m = $("#modal");
    $("#modal-title").textContent = title;
    $("#modal-body").textContent = body;
    $("#modal-ok").textContent = kind === "ok" ? "OK" : "Got It";
    m.classList.remove("hidden");
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function initSkillFields(id) {
    const def = S.skillById(id);
    const out = {};
    for (const f of def.fields) {
      out[f.key] = f.kind === "select" && f.options?.[0] ? f.options[0].value : "";
    }
    state.skillFields = out;
  }

  function hydrate() {
    const snap = loadJSON(STORAGE_KEY, null);
    if (snap) {
      state.input = snap.input || "";
      state.count = snap.count || DEFAULT_COUNT;
      state.profileEnabled = snap.profileEnabled !== false;
      state.generation = snap.generation || 0;
      state.seedUsed = snap.seedUsed || 0;
      state.lastAction = snap.lastAction || "";
      if (snap.hasResults && snap.result?.prompts?.length) {
        state.prompts = snap.result.prompts;
        state.parsed = snap.result.parsed;
      }
    }
    const chips = loadJSON(SUGGEST_KEY, null);
    if (Array.isArray(chips) && chips.length) {
      state.suggestions = chips[0] === S.SURPRISE_BRIEF ? chips : [S.SURPRISE_BRIEF, ...chips];
    } else {
      state.suggestions = S.pickSuggestions(Date.now() >>> 0);
      saveJSON(SUGGEST_KEY, state.suggestions);
    }
    const hist = loadJSON(HISTORY_KEY, []);
    state.history = Array.isArray(hist) ? hist : [];
    initSkillFields(state.skillId);
  }

  function persistSession() {
    saveJSON(STORAGE_KEY, {
      input: state.input,
      count: state.count,
      profileEnabled: state.profileEnabled,
      generation: state.generation,
      seedUsed: state.seedUsed,
      lastAction: state.lastAction,
      hasResults: state.prompts.length > 0,
      result: state.prompts.length ? { prompts: state.prompts, parsed: state.parsed } : undefined,
    });
  }

  function setView(v) {
    state.view = v;
    location.hash = v === "skills" ? "skills" : "styles";
    render();
  }

  function runGenerate() {
    const brief = ($("#brief")?.value ?? state.input).trim();
    state.input = brief;
    if (!brief) {
      state.lastAction = "Enter a creative brief first — nothing was generated.";
      render();
      return;
    }
    try {
      const seed = (Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0;
      const avoidFingerprints = state.history
        .filter((e) => e.brief.trim() === brief)
        .flatMap((e) => (e.prompts || []).map((p) => p.recipeId).filter(Boolean))
        .slice(-80);
      const out = S.generateStylesPrompts(brief, {
        count: state.count,
        profileEnabled: state.profileEnabled,
        seed,
        avoidFingerprints,
      });
      state.seedUsed = seed;
      state.prompts = out.prompts;
      state.parsed = out.parsed;
      state.generation += 1;
      state.expandedPlans = {};
      const entry = {
        id: Date.now() + "-" + seed,
        createdAt: new Date().toISOString(),
        brief,
        seed,
        profileEnabled: state.profileEnabled,
        prompts: out.prompts.map((p) => ({
          title: p.title,
          styles: p.styles,
          characters: p.characters,
          bpm: p.bpm,
          score: p.score,
          primaryGenre: p.plan.primaryGenre,
          secondaryGenre: p.plan.secondaryGenre,
          accentGenre: p.plan.accentGenre,
          recipeId: p.plan.recipeId,
        })),
      };
      state.history = [...state.history, entry];
      saveJSON(HISTORY_KEY, state.history);
      const head = out.prompts[0]?.styles.slice(0, 48).replace(/\\s+/g, " ") ?? "";
      const bpmNote = out.parsed.bpm != null ? out.parsed.bpm + " BPM" : "BPM inferred";
      state.lastAction = "seed " + seed + " · " + bpmNote + " · " + out.prompts.length + " styles · \\"" + head + "...\\"";
      persistSession();
      render();
    } catch (err) {
      state.lastAction = "Generate failed: " + (err && err.message ? err.message : "unknown error") + ". Try again.";
      persistSession();
      render();
    }
  }

  function resetAll() {
    state.input = "";
    state.count = DEFAULT_COUNT;
    state.profileEnabled = true;
    state.generation = 0;
    state.seedUsed = 0;
    state.prompts = [];
    state.parsed = null;
    state.expandedPlans = {};
    state.lastAction = "Reset — brief and current variations cleared. History kept.";
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    persistSession();
    render();
    $("#brief")?.focus();
  }

  function refreshSuggestions() {
    state.suggestions = S.pickSuggestions((Math.random() * 1e9) >>> 0);
    saveJSON(SUGGEST_KEY, state.suggestions);
    state.lastAction = "Example briefs refreshed — click one to fill the brief box.";
    persistSession();
    render();
  }

  function applySuggestion(text) {
    state.input = text;
    persistSession();
    render();
    const ta = $("#brief");
    if (ta) {
      ta.value = text;
      ta.focus();
    }
    state.lastAction = "Brief filled from an example — press Generate Styles to compile.";
    persistSession();
    const sl = $("#status-line");
    if (sl) sl.textContent = state.lastAction;
  }

  function copyAllPrompts() {
    if (!state.prompts.length) return;
    const text = S.formatAllPromptsTxt(state.prompts);
    const filename = "suno-styles-" + S.historyFileStamp() + ".txt";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    copyText(text).then((ok) => {
      showDialog(
        "ok",
        ok ? "Copied All Prompts" : "Prompts Downloaded",
        ok
          ? filename + " was downloaded. The same pack is on your clipboard."
          : filename + " was saved. Clipboard access is blocked — open the text file if you need to paste."
      );
    });
    state.lastAction = "Downloaded " + filename;
    persistSession();
    render();
  }

  function exportHistory() {
    if (!state.history.length) return;
    const filename = "suno-history-" + S.historyFileStamp() + ".json";
    downloadJson(filename, {
      exportedAt: new Date().toISOString(),
      count: state.history.length,
      entries: state.history,
    });
    state.lastAction = "Exported " + filename;
    persistSession();
    render();
  }

  function clearHistory() {
    state.history = [];
    state.openHistory = {};
    saveJSON(HISTORY_KEY, []);
    state.lastAction = "History cleared.";
    persistSession();
    render();
  }

  function runSkill() {
    const def = S.skillById(state.skillId);
    const missing = def.fields.filter((f) => f.required && !String(state.skillFields[f.key] || "").trim());
    if (missing.length) {
      state.skillError = "Fill " + missing.map((m) => m.label).join(", ") + " first.";
      state.skillReport = null;
      render();
      return;
    }
    state.skillError = "";
    try {
      state.skillReport = S.runSkill(state.skillId, state.skillFields);
    } catch (e) {
      state.skillError = "Could not run this skill on that input.";
      state.skillReport = null;
    }
    render();
  }

  function reportText(r) {
    const bits = ["# " + r.title, "", r.exclusion, "", ...r.sections.flatMap((s) => ["## " + s.heading, s.body, ""])];
    if (r.sliders?.length) {
      bits.push("## Slider Starting Points");
      for (const s of r.sliders) {
        bits.push(s.label + ": Weirdness " + s.weirdness + " · Style " + s.style + " · Audio " + s.audio + " — " + s.why);
      }
      bits.push("");
    }
    if (r.styles?.length) {
      bits.push("## Compiled Styles");
      for (const p of r.styles) bits.push(p.title + "\\n\\n" + p.styles + "\\n");
    }
    bits.push(r.verified);
    return bits.join("\\n");
  }

  function navHtml() {
    return \`<nav class="nav" aria-label="Primary">
      <a href="#styles" class="\${state.view === "styles" ? "on" : ""}" data-view="styles">Styles Compiler</a>
      <a href="#skills" class="\${state.view === "skills" ? "on" : ""}" data-view="skills">Skills Studio</a>
    </nav>\`;
  }

  function stylesView() {
    const parsed = state.parsed;
    const prompts = state.prompts;
    const chips = state.suggestions
      .map(
        (ex, i) =>
          \`<button type="button" class="chip" data-sug-i="\${i}">\${
            i === 0 ? \`<span class="tag">Always Available</span>\` : ""
          }\${esc(ex)}</button>\`
      )
      .join("");

    const cards = !prompts.length
      ? \`<div class="panel empty"><strong>Blank Canvas</strong><p>Type a creative brief (or click an example to fill it), then press <span style="color:var(--fg)">Generate Styles</span>. Nothing else compiles prompts.</p><p class="status" style="margin-top:0.75rem">Use Reset to wipe the brief and current results. History stays until you clear it.</p></div>\`
      : prompts
          .map((p, idx) => {
            const open = !!state.expandedPlans[idx];
            const plan = p.plan || {};
            return \`<article class="panel">
              <div class="card-h">
                <div>
                  <h3 class="title">\${esc(S.toTitleCase(p.title))}</h3>
                  <div style="margin-top:0.35rem"><span class="badge">\${p.characters} total characters</span></div>
                  \${
                    p.issues?.length
                      ? \`<p class="warn" style="margin-top:0.4rem">\${esc(p.issues.join(" · "))}</p>\`
                      : ""
                  }
                </div>
                <button type="button" class="btn btn-ghost" data-copy-style="\${idx}">Add Style to Clipboard</button>
              </div>
              <div class="card-b"><p>\${esc(p.styles)}</p></div>
              <button type="button" class="plan-btn" data-toggle-plan="\${idx}">
                <span>Sonic Plan · \${esc(plan.primaryGenre || "")}\${
                  plan.secondaryGenre ? " × " + esc(plan.secondaryGenre) : ""
                }\${plan.accentGenre ? " × " + esc(plan.accentGenre) : ""}</span>
                <span>\${open ? "▴" : "▾"}</span>
              </button>
              \${
                open
                  ? \`<div class="plan-grid">
                \${planRow("BPM", String(plan.bpm ?? ""))}
                \${planRow("Mood", plan.moodPrimary || "—")}
                \${planRow("Metric Feel", plan.metricFeel || "—")}
                \${planRow("Rhythm Donor", plan.donors?.rhythm || "—")}
                \${planRow("Bass Donor", plan.donors?.bass || "—")}
                \${planRow("Bass Stack", (plan.bass || []).slice(0, 3).join(", "))}
                \${planRow("Variant Axes", (plan.variantAxes || []).join(" · "))}
                \${planRow(
                  "Vocals",
                  plan.vocals?.present
                    ? \`\${plan.vocals.presentation || "lead"} \${plan.vocals.timbre || ""} \${plan.vocals.style || ""}\`.trim()
                    : "instrumental"
                )}
              </div>\`
                  : ""
              }
            </article>\`;
          })
          .join("");

    const hist = state.history.length
      ? [...state.history]
          .reverse()
          .map((entry) => {
            const open = !!state.openHistory[entry.id];
            return \`<div class="hist-item">
              <button type="button" class="open" data-hist="\${esc(entry.id)}">
                <div class="brief">\${esc(entry.brief)}</div>
                <div class="meta">\${esc(new Date(entry.createdAt).toLocaleString())} · \${entry.prompts.length} styles · seed \${entry.seed}</div>
              </button>
              \${
                open
                  ? \`<div style="border-top:1px solid var(--border);padding:0.75rem;display:flex;flex-direction:column;gap:0.75rem">
                \${entry.prompts
                  .map(
                    (p, i) => \`<div>
                    <div class="row-between">
                      <p style="font-size:0.75rem;font-weight:500">\${esc(S.toTitleCase(p.title))}</p>
                      <button type="button" class="tiny" data-copy-hist="\${esc(entry.id)}:\${i}">Add Style to Clipboard</button>
                    </div>
                    <p style="white-space:pre-wrap;font-size:0.75rem;color:var(--fg-muted);margin-top:0.35rem">\${esc(p.styles)}</p>
                  </div>\`
                  )
                  .join("")}
              </div>\`
                  : ""
              }
            </div>\`;
          })
          .join("")
      : \`<p class="status">No styles generated this session yet.</p>\`;

    return \`
      <header class="header"><div class="wrap header-inner">
        <div>
          <div class="eyebrow">Styles Field Compiler</div>
          <h1>Suno Styles Generator</h1>
          <p class="lede">Starts blank. Generate Styles is the only action that compiles prompts. Reset clears the brief — session history stays in the list below. Covers, lyrics, Editor, and Studio live in Skills Studio.</p>
        </div>
        <div class="header-actions">
          \${navHtml()}
          <button type="button" class="btn" id="cli-toggle">Windows Terminal ▾</button>
        </div>
      </div></header>
      <div class="cli \${state.cliOpen ? "" : "hidden"}"><div class="wrap">
        <p>This offline file is the full app. The Node CLI still exists in the original project if you have it:</p>
        <pre>npm run suno -- "Future Bass + UKG"
npm run suno -- "140 BPM dark" -n 5
npm run suno -- --no-profile "92 BPM neo-soul, male vocal"</pre>
      </div></div>
      <main class="wrap grid">
        <section class="panel panel-pad">
          <div>
            <label for="brief">Enter Your Creative Brief Here</label>
            <textarea id="brief" rows="8" placeholder="Start here — e.g. Trap + Baile Funk + Deep Dubstep, kinetic, 140 BPM">\${esc(state.input)}</textarea>
          </div>
          <div>
            <div class="row-between">
              <p class="label" style="margin:0">Example Briefs (Click to Add to the Brief Box)</p>
              <button type="button" class="btn btn-ghost" id="refresh-sug">Refresh</button>
            </div>
            <div class="chips">\${chips}</div>
          </div>
          <div class="two">
            <div>
              <label for="count">Variants</label>
              <div class="row" style="align-items:center">
                <input id="count" type="range" min="1" max="6" value="\${state.count}" />
                <span class="mono" style="width:1.5rem">\${state.count}</span>
              </div>
            </div>
            <div>
              <label class="profile">
                <span>Hybrid Bass Profile</span>
                <input type="checkbox" id="profile" \${state.profileEnabled ? "checked" : ""} />
              </label>
            </div>
          </div>
          <div class="row">
            <button type="button" class="btn btn-primary grow" id="generate">Generate Styles</button>
            <button type="button" class="btn btn-danger" id="reset">Reset</button>
          </div>
          <p class="status" id="status-line">\${esc(state.lastAction)}</p>
          <div class="intent">
            <div class="t">Parsed Intent</div>
            \${
              !prompts.length && !state.input.trim()
                ? \`<p style="color:var(--fg-subtle)">Waiting for a brief — nothing loaded by default.</p>\`
                : \`<div class="mono">
                <div>Genres: <span style="color:var(--fg)">\${esc(
                  parsed?.genres?.join(" · ") || (state.input.trim() ? "will infer on generate" : "—")
                )}</span></div>
                <div>BPM: <span style="color:var(--fg)">\${parsed?.bpm ?? "—"}</span> · Moods: <span style="color:var(--fg)">\${esc(
                  (parsed?.moods || []).slice(0, 4).join(", ") || "—"
                )}</span></div>
                <div>Mode: <span style="color:var(--fg)">\${esc(parsed?.mode || "—")}</span> · Profile: <span style="color:var(--fg)">\${
                  state.profileEnabled ? "on" : "off"
                }</span> · Seed: <span style="color:var(--fg)">\${state.seedUsed || "—"}</span></div>
              </div>\`
            }
          </div>
          <ul class="notes">
            <li><span class="dot"></span>Only Generate Styles compiles prompts — profile, examples, and sliders never do</li>
            <li><span class="dot"></span>Export History downloads a uniquely dated JSON file to your computer</li>
            <li><span class="dot"></span>96 Mateus library genres + 40 hybrid formulas · 925–975 total characters · integer BPM · no artist names</li>
          </ul>
        </section>
        <section style="display:flex;flex-direction:column;gap:1rem">
          <div class="row-between">
            <h2 style="font-size:0.875rem;font-weight:500;color:var(--fg-muted)">\${
              prompts.length === 0 ? "No Variations Yet" : prompts.length + " Prompt" + (prompts.length === 1 ? "" : "s")
            }\${state.generation > 0 ? " · gen " + state.generation : ""}</h2>
            \${prompts.length ? \`<div class="row"><button type="button" class="btn btn-ghost" id="copy-all">Copy All Prompts</button><button type="button" class="btn btn-ghost btn-danger" id="clear-results">Clear Results</button></div>\` : ""}
          </div>
          \${cards}
        </section>
      </main>
      <section class="wrap history">
        <div class="panel panel-pad">
          <div class="row-between">
            <button type="button" class="tiny" id="hist-toggle" style="font-size:0.875rem;font-weight:500;color:var(--fg)">Session History · \${state.history.length}</button>
            <div class="row">
              <button type="button" class="btn btn-ghost" id="export-hist" \${state.history.length ? "" : "disabled"}>Export History</button>
              <button type="button" class="btn btn-ghost btn-danger" id="clear-hist" \${state.history.length ? "" : "disabled"}>Clear History</button>
            </div>
          </div>
          <p class="status">Every Generate Styles run is listed here. Export History downloads a dated JSON file so nothing overwrites a previous export. This offline file cannot write a logs folder; downloads are the archive.</p>
          \${state.historyOpen ? hist : ""}
        </div>
      </section>
      <footer class="wrap footer">Paste each Styles block into the Suno Styles field. Lyrics stay independent. BPM and character counts are verified before display.</footer>
    \`;
  }

  function planRow(k, v) {
    return \`<div class="plan-cell"><div class="k">\${esc(k)}</div><div class="v">\${esc(v)}</div></div>\`;
  }

  function skillsView() {
    const def = S.skillById(state.skillId);
    const list = S.SKILLS.map((s) => {
      const on = s.id === state.skillId;
      return \`<button type="button" class="skill-item \${on ? "on" : ""}" data-skill="\${s.id}">
        <strong>\${esc(s.title)}</strong>
        <div class="blurb">\${esc(s.blurb)}</div>
        <div class="pack">\${esc(s.pack)}</div>
      </button>\`;
    }).join("");

    const fields = def.fields
      .map((f) => {
        const val = state.skillFields[f.key] ?? "";
        if (f.kind === "select") {
          const opts = (f.options || [])
            .map((o) => \`<option value="\${esc(o.value)}" \${o.value === val ? "selected" : ""}>\${esc(o.label)}</option>\`)
            .join("");
          return \`<div class="field"><label for="sf-\${f.key}">\${esc(f.label)}</label><select id="sf-\${f.key}" data-sk="\${f.key}">\${opts}</select></div>\`;
        }
        if (f.kind === "textarea") {
          return \`<div class="field"><label for="sf-\${f.key}">\${esc(f.label)}</label><textarea id="sf-\${f.key}" rows="\${f.rows || 3}" data-sk="\${f.key}" placeholder="\${esc(f.placeholder || "")}">\${esc(val)}</textarea></div>\`;
        }
        return \`<div class="field"><label for="sf-\${f.key}">\${esc(f.label)}</label><input type="text" id="sf-\${f.key}" data-sk="\${f.key}" value="\${esc(val)}" placeholder="\${esc(f.placeholder || "")}" /></div>\`;
      })
      .join("");

    const r = state.skillReport;
    let report = "";
    if (r) {
      report = \`<div class="report">
        <div class="row-between">
          <h3>\${esc(S.toTitleCase(r.title))}</h3>
          <button type="button" class="btn btn-ghost" id="copy-playbook">Add Playbook to Clipboard</button>
        </div>
        <div class="intent" style="white-space:pre-wrap">\${esc(r.exclusion)}</div>
        \${r.sections
          .map(
            (s, i) => \`<article>
            <div class="row-between"><h4>\${esc(s.heading)}</h4><button type="button" class="tiny" data-copy-sec="\${i}">Copy</button></div>
            <p>\${esc(s.body)}</p>
          </article>\`
          )
          .join("")}
        \${
          r.sliders?.length
            ? \`<div class="sliders">\${r.sliders
                .map(
                  (s) => \`<div class="slider-card"><strong>\${esc(s.label)}</strong>
                  <p class="mono" style="margin-top:0.5rem;color:var(--fg-muted)">Weirdness \${esc(s.weirdness)}<br>Style \${esc(s.style)}<br>Audio \${esc(s.audio)}</p>
                  <p class="why">\${esc(s.why)}</p></div>\`
                )
                .join("")}</div>\`
            : ""
        }
        \${
          r.styles?.length
            ? \`<div>\${r.styles
                .map(
                  (p, i) => \`<article class="intent" style="margin-top:0.5rem">
                  <div class="row-between"><strong style="color:var(--fg);font-size:0.75rem">\${esc(p.title)}</strong>
                  <button type="button" class="tiny" data-copy-skstyle="\${i}">Add Style to Clipboard</button></div>
                  <p style="margin-top:0.25rem">\${p.characters} total characters</p>
                  <p style="margin-top:0.5rem">\${esc(p.styles)}</p>
                </article>\`
                )
                .join("")}</div>\`
            : ""
        }
        <p class="status">\${esc(r.verified)}</p>
      </div>\`;
    }

    return \`
      <header class="header"><div class="wrap header-inner">
        <div>
          <div class="eyebrow">Suno Expert Packs</div>
          <h1>Skills Studio</h1>
          <p class="lede">Eight installed playbooks: optimize prompts, plan covers and mashups, write lyrics, run Editor/Studio checklists, and gate rights. Styles compilation still lives on the Styles Compiler page.</p>
        </div>
        <div class="header-actions">\${navHtml()}</div>
      </div></header>
      <main class="wrap grid">
        <section class="skill-list">\${list}</section>
        <section class="panel panel-pad">
          <div>
            <h2 style="font-size:1rem">\${esc(def.title)}</h2>
            <p class="lede" style="margin:0.35rem 0 0">\${esc(def.blurb)}</p>
          </div>
          <form id="skill-form">\${fields}
            \${state.skillError ? \`<p class="warn">\${esc(state.skillError)}</p>\` : ""}
            <button type="submit" class="btn btn-primary">\${esc(def.runLabel)}</button>
          </form>
          \${report}
        </section>
      </main>
    \`;
  }

  function bind() {
    document.querySelectorAll("[data-view]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        setView(a.getAttribute("data-view"));
      });
    });
    $("#modal-ok")?.addEventListener("click", () => $("#modal").classList.add("hidden"));
    $("#modal-x")?.addEventListener("click", () => $("#modal").classList.add("hidden"));

    if (state.view === "styles") {
      $("#brief")?.addEventListener("input", (e) => {
        state.input = e.target.value;
      });
      $("#count")?.addEventListener("input", (e) => {
        state.count = Number(e.target.value);
        persistSession();
        const n = e.target.parentElement.querySelector(".mono");
        if (n) n.textContent = String(state.count);
      });
      $("#profile")?.addEventListener("change", (e) => {
        state.profileEnabled = e.target.checked;
        state.lastAction = e.target.checked
          ? "Hybrid bass profile on — used on the next Generate Styles."
          : "Hybrid bass profile off — used on the next Generate Styles.";
        persistSession();
        const sl = $("#status-line");
        if (sl) sl.textContent = state.lastAction;
      });
      $("#generate")?.addEventListener("click", runGenerate);
      $("#reset")?.addEventListener("click", resetAll);
      $("#clear-results")?.addEventListener("click", resetAll);
      $("#copy-all")?.addEventListener("click", () => void copyAllPrompts());
      $("#refresh-sug")?.addEventListener("click", refreshSuggestions);
      $("#cli-toggle")?.addEventListener("click", () => {
        state.cliOpen = !state.cliOpen;
        render();
      });
      document.querySelectorAll("[data-sug-i]").forEach((b) => {
        b.addEventListener("click", () => applySuggestion(state.suggestions[Number(b.getAttribute("data-sug-i"))]));
      });
      document.querySelectorAll("[data-copy-style]").forEach((b) => {
        b.addEventListener("click", async () => {
          const p = state.prompts[Number(b.getAttribute("data-copy-style"))];
          if (!p) return;
          const ok = await copyText(p.styles);
          showDialog(
            ok ? "ok" : "error",
            ok ? "Added to Clipboard" : "Clipboard Access Blocked",
            ok
              ? "This style was copied to your clipboard. You can paste it into the Suno Styles field."
              : "This browser is not allowing the file to copy text. Allow clipboard access for local files, or select the style text and copy it manually (Ctrl+C / Cmd+C)."
          );
        });
      });
      document.querySelectorAll("[data-toggle-plan]").forEach((b) => {
        b.addEventListener("click", () => {
          const idx = Number(b.getAttribute("data-toggle-plan"));
          state.expandedPlans[idx] = !state.expandedPlans[idx];
          render();
        });
      });
      $("#hist-toggle")?.addEventListener("click", () => {
        state.historyOpen = !state.historyOpen;
        render();
      });
      $("#export-hist")?.addEventListener("click", exportHistory);
      $("#clear-hist")?.addEventListener("click", clearHistory);
      document.querySelectorAll("[data-hist]").forEach((b) => {
        b.addEventListener("click", () => {
          const id = b.getAttribute("data-hist");
          state.openHistory[id] = !state.openHistory[id];
          render();
        });
      });
      document.querySelectorAll("[data-copy-hist]").forEach((b) => {
        b.addEventListener("click", async () => {
          const [id, i] = b.getAttribute("data-copy-hist").split(":");
          const entry = state.history.find((h) => h.id === id);
          const p = entry?.prompts[Number(i)];
          if (!p) return;
          const ok = await copyText(p.styles);
          showDialog(
            ok ? "ok" : "error",
            ok ? "Added to Clipboard" : "Clipboard Access Blocked",
            ok ? "This style was copied to your clipboard." : "Allow clipboard access or copy the text manually."
          );
        });
      });
    } else {
      document.querySelectorAll("[data-skill]").forEach((b) => {
        b.addEventListener("click", () => {
          state.skillId = b.getAttribute("data-skill");
          initSkillFields(state.skillId);
          state.skillReport = null;
          state.skillError = "";
          render();
        });
      });
      document.querySelectorAll("[data-sk]").forEach((inp) => {
        inp.addEventListener("input", () => {
          state.skillFields[inp.getAttribute("data-sk")] = inp.value;
        });
        inp.addEventListener("change", () => {
          state.skillFields[inp.getAttribute("data-sk")] = inp.value;
        });
      });
      $("#skill-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        document.querySelectorAll("[data-sk]").forEach((inp) => {
          state.skillFields[inp.getAttribute("data-sk")] = inp.value;
        });
        runSkill();
      });
      $("#copy-playbook")?.addEventListener("click", async () => {
        if (!state.skillReport) return;
        const ok = await copyText(reportText(state.skillReport));
        showDialog(
          ok ? "ok" : "error",
          ok ? "Added to Clipboard" : "Clipboard Access Blocked",
          ok ? "The selected text is on your clipboard." : "Allow clipboard access or copy manually."
        );
      });
      document.querySelectorAll("[data-copy-sec]").forEach((b) => {
        b.addEventListener("click", async () => {
          const s = state.skillReport?.sections[Number(b.getAttribute("data-copy-sec"))];
          if (!s) return;
          const ok = await copyText(s.body);
          showDialog(ok ? "ok" : "error", ok ? "Added to Clipboard" : "Clipboard Access Blocked", ok ? "Copied." : "Copy failed.");
        });
      });
      document.querySelectorAll("[data-copy-skstyle]").forEach((b) => {
        b.addEventListener("click", async () => {
          const p = state.skillReport?.styles?.[Number(b.getAttribute("data-copy-skstyle"))];
          if (!p) return;
          const ok = await copyText(p.styles);
          showDialog(
            ok ? "ok" : "error",
            ok ? "Added to Clipboard" : "Clipboard Access Blocked",
            ok ? "This style was copied to your clipboard." : "Copy failed."
          );
        });
      });
    }
  }

  function render() {
    const root = $("#app");
    root.innerHTML = state.view === "skills" ? skillsView() : stylesView();
    bind();
  }

  window.addEventListener("hashchange", () => {
    const v = location.hash.replace("#", "") === "skills" ? "skills" : "styles";
    if (v !== state.view) {
      state.view = v;
      render();
    }
  });

  hydrate();
  if (location.hash.replace("#", "") === "skills") state.view = "skills";
  render();
})();
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Suno Workbench (Offline)</title>
  <meta name="description" content="Offline Suno Styles compiler and Skills Studio. Open this file in any browser." />
  <style>
:root {
  --bg: #0a0a0b;
  --bg-elevated: #121214;
  --bg-subtle: #1a1a1e;
  --fg: #f4f4f5;
  --fg-muted: #a1a1aa;
  --fg-subtle: #71717a;
  --border: #2a2a30;
  --border-strong: #3f3f48;
  --accent: #d4d4d8;
  --accent-fg: #0a0a0b;
  --ok: #6ee7b7;
  --danger: #fca5a5;
  --ring: #c8ccd4;
  --font: "Segoe UI", system-ui, -apple-system, sans-serif;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --r-sm: 8px;
  --r-md: 12px;
  --r-xl: 24px;
  --shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}
*, *::before, *::after { box-sizing: border-box; border-color: var(--border); }
html { color-scheme: dark; }
html, body { margin: 0; min-height: 100dvh; background: var(--bg); color: var(--fg); font-family: var(--font); line-height: 1.5; -webkit-font-smoothing: antialiased; }
button:not(:disabled), [role="button"]:not(:disabled) { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: 0.4; }
::selection { background: color-mix(in oklab, var(--accent) 30%, transparent); }
h1, h2, h3, h4, p { margin: 0; }
a { color: inherit; text-decoration: none; }
.wrap { max-width: 72rem; margin: 0 auto; padding: 0 1rem; }
@media (min-width: 640px) { .wrap { padding: 0 1.5rem; } }
.header { border-bottom: 1px solid var(--border); }
.header-inner { display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem 0; }
@media (min-width: 640px) {
  .header-inner { flex-direction: row; align-items: flex-end; justify-content: space-between; }
}
.eyebrow { display: flex; align-items: center; gap: 0.5rem; color: var(--fg-muted); font-size: 0.75rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; }
h1 { font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
@media (min-width: 640px) { h1 { font-size: 1.875rem; } }
.lede { max-width: 36rem; color: var(--fg-muted); font-size: 0.9rem; margin-top: 0.5rem; }
.nav { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.nav a, .nav-btn {
  display: inline-flex; align-items: center; gap: 0.5rem; height: 2.5rem; padding: 0 0.75rem;
  border-radius: var(--r-md); font-size: 0.875rem; font-weight: 500; border: 1px solid transparent; color: var(--fg-muted);
}
.nav a:hover, .nav-btn:hover { color: var(--fg); background: color-mix(in oklab, var(--bg-subtle) 60%, transparent); }
.nav a.on, .nav-btn.on { background: var(--bg-subtle); color: var(--fg); border-color: var(--border); }
.header-actions { display: flex; flex-direction: column; gap: 0.75rem; align-items: stretch; }
@media (min-width: 640px) { .header-actions { align-items: flex-end; } }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  border-radius: var(--r-md); border: 1px solid var(--border); background: var(--bg-elevated);
  color: var(--fg); font-size: 0.875rem; font-weight: 500; height: 2.75rem; padding: 0 1rem;
}
.btn:hover { border-color: var(--border-strong); background: var(--bg-subtle); }
.btn-primary { background: var(--accent); color: var(--accent-fg); border-color: transparent; font-weight: 600; }
.btn-primary:hover { opacity: 0.9; background: var(--accent); }
.btn-ghost { background: var(--bg); height: 2.25rem; font-size: 0.75rem; padding: 0 0.75rem; color: var(--fg-muted); }
.btn-ghost:hover { color: var(--fg); }
.btn-danger:hover { border-color: color-mix(in oklab, var(--danger) 40%, transparent); background: color-mix(in oklab, var(--danger) 10%, transparent); color: var(--fg); }
.cli { border-bottom: 1px solid var(--border); background: color-mix(in oklab, var(--bg-elevated) 80%, transparent); padding: 1rem 0; }
.cli p { font-size: 0.875rem; color: var(--fg-muted); margin-bottom: 0.75rem; }
pre {
  overflow-x: auto; border-radius: var(--r-md); border: 1px solid var(--border);
  background: var(--bg); padding: 1rem; font-family: var(--mono); font-size: 0.75rem; color: var(--fg-muted); line-height: 1.6;
}
.grid { display: grid; gap: 1.5rem; padding: 1.5rem 0; }
@media (min-width: 1024px) {
  .grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: 2rem; }
}
.panel {
  background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--r-xl);
  box-shadow: var(--shadow);
}
.panel-pad { padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }
label, .label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.4rem; }
textarea, input[type="text"], select {
  width: 100%; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--bg);
  color: var(--fg); font: inherit; font-size: 0.875rem; padding: 0.75rem; outline: none;
}
textarea { resize: vertical; min-height: 8rem; }
input[type="text"], select { height: 2.75rem; }
textarea:focus, input:focus, select:focus { box-shadow: 0 0 0 2px var(--ring); }
::placeholder { color: var(--fg-subtle); }
.row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.row-between { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; }
.chips { display: flex; flex-direction: column; gap: 0.5rem; }
.chip {
  width: 100%; text-align: left; white-space: normal; word-break: break-word;
  border-radius: var(--r-md); border: 1px solid var(--border); background: var(--bg);
  padding: 0.65rem 0.75rem; font-size: 0.75rem; line-height: 1.5; color: var(--fg-muted);
}
.chip:hover { border-color: var(--border-strong); color: var(--fg); }
.chip .tag { display: block; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fg-subtle); margin-bottom: 2px; }
.two { display: grid; gap: 1rem; }
@media (min-width: 640px) { .two { grid-template-columns: 1fr 1fr; } }
input[type="range"] { width: 100%; accent-color: var(--accent); }
.profile {
  display: flex; height: 2.75rem; align-items: center; justify-content: space-between; gap: 0.75rem;
  border-radius: var(--r-md); border: 1px solid var(--border); background: var(--bg); padding: 0 0.75rem; font-size: 0.875rem;
}
.status { font-size: 0.75rem; color: var(--fg-muted); }
.intent { border-radius: var(--r-md); border: 1px solid var(--border); background: var(--bg); padding: 0.75rem; font-size: 0.75rem; color: var(--fg-muted); }
.intent .t { display: flex; align-items: center; gap: 0.4rem; font-weight: 500; color: var(--fg); margin-bottom: 0.35rem; }
.mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
.notes { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.75rem; color: var(--fg-subtle); }
.notes li { display: flex; gap: 0.5rem; }
.dot { width: 0.85rem; height: 0.85rem; border-radius: 50%; background: var(--ok); flex-shrink: 0; margin-top: 0.2rem; }
.card { border-bottom: 1px solid var(--border); }
.card-h { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.75rem; padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border); }
.card-b { padding: 1rem 1.25rem; }
.card-b p { white-space: pre-wrap; font-size: 0.875rem; line-height: 1.65; color: var(--fg-muted); }
.badge { font-family: var(--mono); font-size: 0.75rem; border-radius: 999px; border: 1px solid var(--border); background: var(--bg); padding: 0.15rem 0.5rem; color: var(--fg-muted); }
.plan-btn {
  width: 100%; display: flex; align-items: center; justify-content: space-between; background: none; border: 0;
  color: var(--fg-muted); font-size: 0.75rem; font-weight: 500; text-align: left; padding: 0.85rem 1.25rem;
}
.plan-btn:hover { color: var(--fg); }
.plan-grid { display: grid; gap: 0.5rem; padding: 0 1.25rem 1.25rem; }
@media (min-width: 640px) { .plan-grid { grid-template-columns: 1fr 1fr; } }
.plan-cell { border-radius: var(--r-sm); border: 1px solid var(--border); background: var(--bg); padding: 0.5rem 0.65rem; font-size: 0.75rem; color: var(--fg-muted); }
.plan-cell .k { font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fg-subtle); }
.plan-cell .v { color: var(--fg); margin-top: 2px; }
.empty { padding: 1.5rem; font-size: 0.875rem; color: var(--fg-muted); }
.empty strong { color: var(--fg); display: block; margin-bottom: 0.5rem; }
.history { padding-bottom: 2.5rem; }
.warn { color: var(--danger); font-size: 0.75rem; display: flex; gap: 0.4rem; }
.skill-list { display: flex; flex-direction: column; gap: 0.5rem; }
.skill-item {
  text-align: left; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--bg);
  padding: 0.75rem; color: var(--fg);
}
.skill-item.on { border-color: var(--border-strong); background: var(--bg-elevated); }
.skill-item:hover { border-color: var(--border-strong); }
.skill-item .blurb { font-size: 0.75rem; color: var(--fg-muted); margin-top: 0.35rem; line-height: 1.5; }
.skill-item .pack { font-family: var(--mono); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fg-subtle); margin-top: 0.4rem; }
.field { margin-bottom: 1rem; }
.report { border-top: 1px solid var(--border); padding-top: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.report h3 { font-size: 0.9rem; }
.report article h4 { font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fg-subtle); }
.report article p { white-space: pre-wrap; font-size: 0.875rem; color: var(--fg-muted); }
.sliders { display: grid; gap: 0.5rem; }
@media (min-width: 640px) { .sliders { grid-template-columns: 1fr 1fr 1fr; } }
.slider-card { border-radius: var(--r-md); border: 1px solid var(--border); background: var(--bg); padding: 0.75rem; font-size: 0.75rem; }
.slider-card .why { color: var(--fg-subtle); margin-top: 0.5rem; }
.modal {
  position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center;
  background: color-mix(in oklab, var(--bg) 70%, transparent); padding: 1rem;
}
.modal .panel { width: 100%; max-width: 28rem; padding: 1.25rem; }
.hidden { display: none !important; }
.footer { padding: 0.5rem 0 2.5rem; font-size: 0.75rem; color: var(--fg-subtle); }
.hist-item { border-radius: var(--r-md); border: 1px solid var(--border); background: var(--bg); }
.hist-item button.open { width: 100%; text-align: left; background: none; border: 0; color: inherit; padding: 0.65rem 0.75rem; }
.hist-item .brief { font-size: 0.875rem; color: var(--fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hist-item .meta { font-size: 0.75rem; color: var(--fg-subtle); margin-top: 2px; }
.grow { flex: 1; }
h3.title { font-size: 0.95rem; font-weight: 600; }
.tiny { font-size: 11px; color: var(--fg-muted); background: none; border: 0; }
.tiny:hover { color: var(--fg); }
  </style>
</head>
<body>
  <div id="app"></div>
  <div id="modal" class="modal hidden" role="alertdialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="panel">
      <div class="row-between">
        <h2 id="modal-title" style="font-size:1rem"></h2>
        <button type="button" class="tiny" id="modal-x" aria-label="Close">✕</button>
      </div>
      <p id="modal-body" style="margin-top:0.75rem;color:var(--fg-muted);font-size:0.875rem;line-height:1.6"></p>
      <div style="margin-top:1.25rem;display:flex;justify-content:flex-end">
        <button type="button" class="btn btn-primary" id="modal-ok">OK</button>
      </div>
    </div>
  </div>
  <script>
` + sunoCoreJs + `
  </script>
  <script>
` + uiJs + `
  </script>
</body>
</html>
`;

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}
fs.writeFileSync('public/suno-workbench.html', html, 'utf8');
fs.writeFileSync('suno-workbench.html', html, 'utf8');
console.log('Successfully packed public/suno-workbench.html & suno-workbench.html!');
