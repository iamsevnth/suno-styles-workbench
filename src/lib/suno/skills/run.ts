import { generateStylesPrompts } from "../generate.ts";
import { parseUserInput } from "../parse.ts";
import { V6_CHECKED } from "../v6.ts";

export interface SliderRecommendation {
  label: string;
  model: string;
  maxMode: string;
  variety: string;
  personalize: string;
  weirdness: string;
  style: string;
  audio: string;
  why: string;
}

export interface SkillReportSection {
  heading: string;
  body: string;
}

export interface CompiledStyleSnippet {
  title: string;
  styles: string;
  characters: number;
}

export interface SkillReport {
  skillId: string;
  title: string;
  verified: string;
  exclusion: string;
  sections: SkillReportSection[];
  sliders?: SliderRecommendation[];
  stylesBrief?: string;
  styles?: CompiledStyleSnippet[];
}

export const VERIFIED = `Verified: skill-pack baseline (Suno Help Center / Release Notes / Terms snapshot) — checked ${V6_CHECKED}. Re-check official sources before exact UI, plan, credit, or contractual claims.`;

export const COMPACT_EXCLUSION = `Exclusion Section
Use only audio, lyrics, samples, and voices you have the right to use. This playbook is written for original or authorized material and does not require copying a specific artist or song.`;

export function namedExclusion(named: string): string {
  const n = named.trim();
  if (!n) return COMPACT_EXCLUSION;
  return `Exclusion Section
- Will not copy: copyrighted lyrics, recognizable melody, distinctive protected hook, or a living artist's unique voice/performance identity related to "${n}".
- Safe substitutes: high-level genre/era, instrumentation, tempo/groove, arrangement, mix character, emotional themes, and an original vocal profile.
- Rights note: Use only material you own, license, or are otherwise authorized to use. Transformation is not a guarantee of non-infringement. This is workflow guidance, not legal advice.`;
}

export function classifyIssues(prompt: string, failed: string): string[] {
  const issues: string[] = [];
  const p = prompt.trim();
  const f = failed.toLowerCase();
  if (p.length < 80) issues.push("Missing: the prompt is too short to lock groove, bass, and arrangement.");
  if (/\b(fire|vibes?|banger|insane|crazy)\b/i.test(p) && !/\bBPM\b/i.test(p)) {
    issues.push("Mis-prioritized: vibe adjectives sit above tempo/groove.");
  }
  if (!/\b\d{2,3}\s*BPM\b/i.test(p)) issues.push("Missing: no integer BPM.");
  if ((p.match(/\b(and|with)\b/gi) || []).length > 12) {
    issues.push("Redundant: stacked conjunctions — hierarchy is buried.");
  }
  if (/in the style of|like\s+[A-Z]/i.test(p)) {
    issues.push("Over-constrained / unsafe: named-reference language should be translated to production terms.");
  }
  if (/avoid|don't|do not|without any/i.test(p)) {
    issues.push("Contradictory: negative prompting fights Suno Styles rules — rewrite as positive targets.");
  }
  if (f.includes("generic"))
    issues.push("Ambiguous: latest take sounded generic — add bass behavior, drum architecture, and one arrangement arc.");
  if (f.includes("drop") || f.includes("weak")) issues.push("Missing: drop/section function is not specified.");
  if (f.includes("vocal")) issues.push("Missing: vocal register/delivery without identity imitation.");
  if (f.includes("chaos") || f.includes("messy") || f.includes("structure")) {
    issues.push("Over-constrained or under-structured: lower Weirdness and state section order.");
  }
  if (issues.length === 0)
    issues.push("Coherence check: keep genre, BPM, groove, and bass in one hierarchy; cut decorative adjectives.");
  return issues;
}

export function shortPrompt(desired: string, parsedGenres: string[], bpm?: number): string {
  const g = parsedGenres.slice(0, 3).join(" + ") || "hybrid bass";
  const tempo = bpm ? `${bpm} BPM` : "defined tempo feel";
  const core = desired.trim() || "bass-forward production, clear drop, memorable motif";
  const sentence = `${g} at ${tempo}, ${core.replace(/\.$/, "")}, disciplined low-end hierarchy and one strong hook motif.`;
  const words = sentence.split(/\s+/);
  if (words.length > 55) return words.slice(0, 55).join(" ");
  return sentence;
}

export function runOptimizer(input: Record<string, string>): SkillReport {
  const current = input.current?.trim() ?? "";
  const failed = input.failed?.trim() ?? "";
  const desired = input.desired?.trim() ?? "";
  const sample = input.sample?.trim() ?? "";
  const parsed = parseUserInput(current || desired);
  const issues = classifyIssues(current, failed);
  const short = shortPrompt(desired || current, parsed.genres, parsed.bpm);

  const brief = [
    desired || "Trap + Deep Dubstep, kinetic, bass-forward",
    parsed.genres.join(" + "),
    parsed.bpm ? `${parsed.bpm} BPM` : "140 BPM",
  ]
    .filter(Boolean)
    .join(", ");

  let styles: CompiledStyleSnippet[] = [];
  try {
    styles = generateStylesPrompts(brief, {
      count: 2,
      profileEnabled: true,
    }).prompts.map((p) => ({ title: p.title, styles: p.styles, characters: p.characters }));
  } catch {
    styles = [];
  }

  const sliders: SliderRecommendation[] = [
    {
      label: "Keep compiled Styles",
      model: "v6",
      maxMode: "Off (On if >2 min / cover)",
      variety: "Off",
      personalize: "Off",
      weirdness: "25–40",
      style: "65–80",
      audio: sample ? "55–75" : "n/a (no upload)",
      why: "Variety Off is required so v6 does not rewrite the 925–975 Styles block. Lower Weirdness if the last take was chaotic.",
    },
    {
      label: "Explore then lock",
      model: "v6-wild, then re-cover in v6",
      maxMode: "Off",
      variety: "Normal or High",
      personalize: "Optional",
      weirdness: "50–65",
      style: "55–70",
      audio: sample ? "35–55" : "n/a (no upload)",
      why: "Use v6-wild + Variety above Off only for discovery. Bring a keeper back to v6 with Variety Off so this compiler's tags stay verbatim.",
    },
  ];

  return {
    skillId: "optimizer",
    title: "Prompt Optimization",
    verified: VERIFIED,
    exclusion: namedExclusion(""),
    stylesBrief: brief,
    styles,
    sliders,
    sections: [
      {
        heading: "Diagnosis",
        body: issues.map((i, n) => `${n + 1}. ${i}`).join("\n"),
      },
      {
        heading: "Preserve vs Change",
        body: `Preserve: ${parsed.genres[0] ?? "core groove"} , integer BPM ${
          parsed.bpm ?? "(infer from genre)"
        }, and any owned-sample traits you listed.
Change: ${failed || "generic adjectives, missing arrangement arc, buried bass behavior"}.`,
      },
      {
        heading: "Short Prompt (20–55 words)",
        body: short,
      },
      {
        heading: "Expanded Prompt Direction",
        body: `Use the compiled Styles blocks below (925–975 characters). They lock BPM, hybrid identity, groove, bass stack, and mix hierarchy. Paste one into Suno Styles. Lyrics stay in the Lyrics field.`,
      },
      {
        heading: "Owned Sample Handling",
        body: sample
          ? `Using only the notes you provided (this runtime did not inspect audio):
${sample}
Preserve abstract groove/contour/texture from those notes. Do not transcribe a protected melody.`
          : "No sample notes supplied. This runtime cannot inspect audio files. Add BPM, key, groove, and instrumentation notes if you have an owned upload.",
      },
      {
        heading: "A/B Test Plan",
        body: `A. v6 + Variety Off + Personalize Off + compiled Styles. Change one variable: Style Influence +10 if the style is ignored.
B. Same Styles, Max Mode On if the song is >2 minutes or a cover.
C. If you want surprise, one take on v6-wild with Variety Normal — then lock the keeper on flagship v6 with Variety Off.
Success checks: integer BPM audible, bass phrase identity, drop contrast, vocal intelligibility if present, no artist-name leakage, Styles box still matches the compiled text.`,
      },
    ],
  };
}

export function runCovers(input: Record<string, string>): SkillReport {
  const rights = input.rights || "unknown";
  const blocked = rights === "unknown";
  const target = input.target?.trim() || "hybrid bass restyle, 140 BPM";
  const preserve = input.preserve?.trim() || "harmonic mood and lyric theme (if you own the words)";
  const change = input.change?.trim() || "drum architecture, bass stack, mix era";
  const source = input.source?.trim() || "owned source";

  const sliders: SliderRecommendation[] = [
    {
      label: "Faithful",
      model: "v6",
      maxMode: "On",
      variety: "Off",
      personalize: "Off",
      weirdness: "20–35",
      style: "40–60",
      audio: "75–90",
      why: "Max Mode On for covers. Variety Off so the style brief is not rewritten. Preserve timing/contour.",
    },
    {
      label: "Hybrid",
      model: "v6",
      maxMode: "On if >2 min",
      variety: "Off",
      personalize: "Off",
      weirdness: "35–50",
      style: "55–75",
      audio: "50–70",
      why: "Split control between source identity and the target style. Keep Variety Off for compiled Styles.",
    },
    {
      label: "Radical",
      model: "v6-wild, then v6",
      maxMode: "Off on wild / On on lock",
      variety: "High on wild / Off on lock",
      personalize: "Optional on wild",
      weirdness: "45–65",
      style: "75–90",
      audio: "25–50",
      why: "Explore on v6-wild. Relock on flagship v6 with Variety Off before release.",
    },
  ];

  const styles: CompiledStyleSnippet[] = blocked
    ? []
    : (() => {
        try {
          return generateStylesPrompts(target, { count: 2, profileEnabled: true }).prompts.map((p) => ({
            title: p.title,
            styles: p.styles,
            characters: p.characters,
          }));
        } catch {
          return [];
        }
      })();

  const sections: SkillReportSection[] = [
    {
      heading: "Rights Gate",
      body: blocked
        ? "Rights status is unknown / third-party commercial. Do not upload that master. Below is an original transformation plan from high-level attributes only — no melody or lyric reconstruction."
        : `Proceeding with ${rights} source. Upload only material you are authorized to use. Cover/Remix availability and plan access must be re-checked in current Help Center.`,
    },
    { heading: "Preserve", body: preserve },
    { heading: "Change", body: change },
    { heading: "Source Notes (Abstract)", body: source },
    {
      heading: "Three Strengths",
      body: `Faithful: keep contour and structure; swap palette.
Hybrid: keep hook function; replace drums/bass/era.
Radical: keep only mood; write a new arrangement around the target style (${target}).`,
    },
    {
      heading: "A/B Adjustments",
      body: `More source: Audio Influence +10–20, Weirdness −10, simplify the style brief.
More transformation: Audio Influence −10–20, Style Influence +10–15, state new drum and bass architecture explicitly.`,
    },
  ];

  return {
    skillId: "covers",
    title: "Cover / Influence Plan",
    verified: VERIFIED,
    exclusion: namedExclusion(blocked ? source : ""),
    sliders,
    stylesBrief: target,
    styles,
    sections,
  };
}

export function runMashups(input: Record<string, string>): SkillReport {
  const rights = input.rights || "unknown";
  const blocked = rights !== "owned";

  return {
    skillId: "mashups",
    title: "Mashup / Sample Plan",
    verified: VERIFIED,
    exclusion: namedExclusion(blocked ? "third-party commercial recordings" : ""),
    sections: [
      {
        heading: "Rights Preflight",
        body:
          rights === "owned"
            ? "Both sources marked owned/authorized. Still verify current Suno remix/upload terms before commercial release."
            : "One or both sources are not clearly authorized. Do not upload commercial masters. Convert the idea into abstract attributes (groove, density, register) and generate original parts instead of slicing uncleared audio.",
      },
      { heading: "Anchor", body: input.trackA || "—" },
      { heading: "Secondary", body: input.trackB || "—" },
      { heading: "Goal", body: input.goal || "aligned mashup / snippet inspiration" },
      {
        heading: "Tempo Strategy",
        body: `1. Identify BPM of both sources.
2. If they differ by ≤5%, stretch the secondary toward the anchor.
3. If the ratio is near 2:1, prefer half-time / double-time interpretation instead of extreme stretch.
4. Align downbeats and 8/16-bar phrases after the tempo decision.`,
      },
      {
        heading: "Key Strategy",
        body: `Prefer same key, relative major/minor, or closely related keys. Flag vocal formant risk on large transpositions. If the vocal breaks, regenerate or choose another key rather than forcing extreme pitch.`,
      },
      {
        heading: "Masking and Stems",
        body: `Separate lead vocal from bed when tools allow. Reduce competing bass/lead under the vocal. Kick vs sub: one owner per band. Name stems consistently: drums, bass, harmony, lead, lead vocal, BV, FX.`,
      },
      {
        heading: "Transitions",
        body: `Handoffs at section boundaries, not arbitrary waveform cuts. Fade/overlap in Studio if Editor has no dedicated crossfade. Filter low end on the outgoing clip during overlap.`,
      },
      {
        heading: "Checklist",
        body: `Downbeat lock · phrase alignment · key compatibility · vocal intelligibility · low-end hierarchy · originality (no uncleared hook copy).`,
      },
    ],
  };
}

function hookLines(theme: string): string[] {
  const t = theme.trim() || "night drive that will not end";
  const noun = t.split(/[,.]/)[0].trim();
  return [
    `Keep the ${noun.toLowerCase()} in the red-line glow`,
    `Say it once, then let the sub answer`,
    `I don't need the sunrise, I need the hold`,
    `Count it down, then let the floor fold`,
  ];
}

function verseLines(theme: string, n: number): string[] {
  const turn = n === 1 ? "before the drop" : "after the break";
  return [
    `Streetlights stutter ${turn}, glass in the dash`,
    `${theme.trim() || "The weight"} sits low where the kick used to smash`,
    `Hands on the wheel like a vow I can keep`,
    `Half-time pocket, I talk in my sleep`,
  ];
}

export function runLyrics(input: Record<string, string>): SkillReport {
  const form = input.form || "verse-chorus";
  const theme = input.theme?.trim() || "late-night motion";
  const named = input.named?.trim() ?? "";
  const delivery = input.delivery?.trim() || "sung mid register, intimate-to-powerful";
  const source = input.sourceLyrics?.trim() ?? "";
  const hook = hookLines(theme);
  const v1 = verseLines(theme, 1);
  const v2 = verseLines(theme, 2);

  let lyric = "";
  if (form === "hook") {
    lyric = `[Chorus]\n${hook.join("\n")}`;
  } else if (form === "verse-chorus") {
    lyric = `[Verse]\n${v1.join("\n")}\n\n[Pre-Chorus]\nHold the bar, then give it back\nLeave a rest where the hat would attack\n\n[Chorus]\n${hook.join(
      "\n"
    )}`;
  } else if (form === "full") {
    lyric = `[Intro]\n(low count, dry room, no words)\n\n[Verse]\n${v1.join(
      "\n"
    )}\n\n[Pre-Chorus]\nHold the bar, then give it back\nLeave a rest where the hat would attack\n\n[Chorus]\n${hook.join(
      "\n"
    )}\n\n[Verse]\n${v2.join("\n")}\n\n[Chorus]\n${hook.join(
      "\n"
    )}\n\n[Bridge]\nIf the night is a tunnel, I learned the walls\nIf the bass is a question, I answer in falls\n\n[Final Chorus]\n${hook.join(
      "\n"
    )}\n\n[Outro]\n(motif only, hats gone, sub remains)`;
  } else {
    lyric = source
      ? `[Rewrite — original intent kept, new meter]\n${hook.join(
          "\n"
        )}\n\n[Verse — new information, not a paraphrase]\n${v1.join("\n")}\n\n[Chorus]\n${hook.join(
          "\n"
        )}`
      : `[Chorus]\n${hook.join("\n")}\n\n[Verse]\n${v1.join("\n")}`;
  }

  const directions = [
    `A. Minimal hook: ${hook[0]}`,
    `B. Narrative verse-first: open on the wheel/vow image, delay the title line.`,
    `C. Call-and-response: lead on line 1/3, stacked answers on 2/4.`,
  ];

  return {
    skillId: "lyrics",
    title: "Lyrics + Production Notes",
    verified: VERIFIED,
    exclusion: namedExclusion(named),
    sections: [
      {
        heading: "Scope",
        body: `${form} · delivery: ${delivery}${
          named ? ` · inspired-by translated away from "${named}"` : ""
        }`,
      },
      { heading: "Three Directions (pick one)", body: directions.join("\n") },
      { heading: "Lyrics (original)", body: lyric },
      {
        heading: "Production Notes",
        body: `Lead: ${delivery}. Intensity arc intimate → stacked on the last chorus.
Doubles: phrase-end on chorus lines 2 and 4.
Harmonies: high third on the last chorus only.
Ad-libs: one-word answers in the break, not during the hook's first pass.
Breath: rest after line 2 of the chorus.
FX: dry verse, short slap on pre, wider plate on chorus — do not name a living voice.`,
      },
      {
        heading: "Stems-Ready",
        body: `Keep lead, BV, drums, bass, harmony, and FX conceptually separate. Generate backing first if mashup/clarity matters. Do not paste these lyrics into the Styles field.`,
      },
      {
        heading: "Checklist",
        body: `Hook memorability · singability · intelligibility · natural rhyme · new information in verses · section contrast.`,
      },
    ],
  };
}

export function runEditor(input: Record<string, string>): SkillReport {
  const edit = input.edit || "replace";
  const playbooks: Record<string, string> = {
    replace: `1. Open the song in Song Editor.
2. Select the clip or highlight the waveform region.
3. Use Quick Replace / Replace (current control name — re-check Help Center).
4. Prompt only the change, e.g. "more restrained drums, same harmonic feel."
5. Generate alternatives and audition them.
6. Commit the preferred take; then adjust the transition boundary if exposed.
Expected: region regenerates; surrounding material stays context.`,
    lyrics: `1. Highlight the target region.
2. Open Edit Lyrics / Replace Lyrics.
3. Change only the words that must change; keep syllable count when melody continuity matters.
4. Replace Section and audition both alternatives.
5. Pick the best consonant timing into the next section.
Expected: new lyric audio for that region only.`,
    reorder: `1. Identify the section block.
2. Hover the section name for the grab control.
3. Drag to the new location.
4. Play across both boundaries (lyric continuity, downbeat, energy).
5. If awkward, adjust replacement boundary or fades.
Expected: new order without full-song regen.`,
    add: `1. Click add-section + between the desired sections.
2. Set beats/bars.
3. Enter lyrics and/or a section prompt.
4. Generate, audition the two alternatives if still offered, commit.
5. Check entry and exit boundaries.`,
    split: `1. Highlight the region.
2. More Actions / edit toolbar.
3. Split for independent treatment; Crop/Remove/Delete for unwanted audio.
4. Play adjacent sections immediately for timing/tail issues.`,
    fade: `Use fade handles at clip start/end when available. Do not assume a dedicated crossfade knob unless current docs show one.
For a crossfade-like result: fade out the outgoing clip, fade in the incoming, or overlap in Studio with inverse volume automation.`,
    stems: `1. Use current Get Stems / Split Stems.
2. Choose Auto Split, Split from Mix, or Advanced Split as the plan allows.
3. Audition before spending more credits.
4. Never quote credit costs without re-verifying.
Name: drums, bass, harmony, lead, lead vocal, BV, FX.`,
    extend: `1. Select the end region or use the current Extend control.
2. Prompt only what the extension should add (bar count, energy, vocal or instrumental).
3. Audition continuity of BPM, key, and motif.
4. Trim the join with fades/boundary adjust.`,
  };

  return {
    skillId: "editor",
    title: "Song Editor Plan",
    verified: VERIFIED,
    exclusion: COMPACT_EXCLUSION,
    sections: [
      { heading: "Target", body: `${edit} · symptom: ${input.symptom || "unspecified"}` },
      { heading: "Steps", body: playbooks[edit] ?? playbooks.replace },
      {
        heading: "Prompt / Slider Changes",
        body: `Only change the brief if the symptom is musical (wrong genre, weak drop). For clicks, tails, and timing, prefer boundary/fade/split over a new full generate.`,
      },
      {
        heading: "Rollback",
        body: `Audition alternatives before committing. Keep a known-good version. If Studio is required (true clip overlap, MIDI, sidechain), hand off rather than inventing Editor controls.`,
      },
      {
        heading: "Validation",
        body: `Continuity · timing · vocal intelligibility · tonal match · no clicks · section energy.`,
      },
    ],
  };
}

export function runStudio(input: Record<string, string>): SkillReport {
  const t = input.template || "trap";
  const templates: Record<
    string,
    { bpm: string; tracks: string; mix: string; form: string }
  > = {
    trap: {
      bpm: "130–150, often half-time",
      tracks: "kick/snare, hats/percussion, 808/sub, chords/pads, lead, risers/FX, vocal/chops",
      mix: "kick/sub separation, transient control, sidechain movement, drop automation",
      form: "intro → tension → drop → verse/break → larger second drop → outro",
    },
    lofi: {
      bpm: "70–95",
      tracks: "dusty drums, bass, keys/guitar, texture/noise, restrained lead, optional soft vocal",
      mix: "softened top end, gentle dynamics, shallow depth, minimal automation",
      form: "looping verse/hook with one mid-song texture lift",
    },
    pop: {
      bpm: "90–130",
      tracks: "drums, bass, harmonic bed, hook instrument, lead vocal, doubles/harmonies, FX",
      mix: "vocal intelligibility, section contrast, low-mid cleanup, controlled width",
      form: "intro → verse → pre → chorus → verse → pre → chorus → bridge → final chorus",
    },
    rock: {
      bpm: "90–170",
      tracks: "drums, bass, rhythm guitars, lead guitar/texture, lead vocal, backing vocals",
      mix: "drum/guitar transients, midrange separation, vocal presence without over-brightening",
      form: "intro → verse → chorus → verse → chorus → solo/bridge → final chorus",
    },
    cinematic: {
      bpm: "from the groove driver",
      tracks:
        "percussion, sub/bass, cinematic layers, synth textures, lead motif, vocal/choir, transitions",
      mix: "density management, low-end hierarchy, macro-dynamic automation, section contrast",
      form: "motif expose → build → impact → air → rebuilt impact",
    },
  };

  const g = templates[t] ?? templates.trap;
  const bpm = input.bpm?.trim() || g.bpm;
  const key = input.key?.trim() || "(set before heavy generation)";

  return {
    skillId: "studio",
    title: "Studio Session Plan",
    verified: VERIFIED,
    exclusion: COMPACT_EXCLUSION,
    sections: [
      {
        heading: "Studio 2.0 Baseline (2026-09-01)",
        body: `Premier-only at snapshot. Chrome recommended; Safari lacked Web MIDI. Audio + MIDI tracks, Chat Bar, take lanes (two versions), wavetable synth, piano roll, compressor (sidechain), EQ, reverb, convolution, delay, distortion, gate, automation, chat-built plugins, advanced stem split. No VST/AU hosting. Re-verify before relying on any of this.`,
      },
      { heading: "Goal", body: input.goal || "finish a mix-ready section" },
      { heading: "Tempo / Key", body: `BPM ${bpm} · ${key}` },
      { heading: "Minimum Track Plan", body: g.tracks },
      { heading: "Form", body: g.form },
      {
        heading: "Numbered Session",
        body: `1. Set tempo and time signature before generating.
2. Import only authorized WAV/MP3/MIDI or owned Suno stems.
3. Name tracks by role; rough fader balance.
4. Generate one musical function at a time; audition both take-lane versions.
5. Commit non-destructively; keep the alternate until it survives mix context.
6. Static balance → pan → EQ (cut masking first) → compression/sidechain → depth (reverb/delay) → saturation only where density helps → automation.
7. A/B bypass at low level. Preserve headroom; do not "master" a dense arrangement.`,
      },
      { heading: "Mix Focus", body: g.mix },
      {
        heading: "Export Map",
        body: `Snapshot: Full Song, Selected Time Range, Multitrack; Studio 2.0 docs described 32-bit WAV or MP3 project export and WAV stems. Choose Full Song for reference, range for loops, multitrack/stems for DAW. Re-verify formats.`,
      },
      {
        heading: "Pre-Bounce Checklist",
        body: `Tempo/key locked · take chosen · no clicks at joins · kick/sub not fighting · lead clear at low volume · stems named · known-good version saved.`,
      },
    ],
  };
}

export function runRights(input: Record<string, string>): SkillReport {
  const material = input.material || "unknown";
  const named = input.named?.trim() ?? "";
  const labels: Record<string, string> = {
    original: "original / user-owned material",
    "named-style": "named artist/style reference",
    "song-recreate": "specific-song recreation",
    lyrics: "copyrighted lyrics",
    voice: "living-artist voice / Voice model",
    sample: "third-party sample / stem / master",
    pd: "claimed public domain",
    commercial: "commercial-release / ownership question",
    unknown: "rights status unknown",
  };
  const rules: Record<string, string> = {
    original:
      "Proceed with original material. Still do not paste other people's lyrics or voices into the workflow.",
    "named-style":
      "Translate the name into genre, era, groove, register, instrumentation, and mix. Do not imitate a living artist's distinctive voice or signature phrasing.",
    "song-recreate":
      "Do not reproduce lyrics or a recognizable melody. Extract only high-level attributes and write a new title, lyric concept, contour, rhythm, arrangement, and palette. Transformation is not a legal safe harbor.",
    lyrics:
      "Do not provide non-user-supplied copyrighted lyrics beyond two short lines. Prefer summary, structure talk, or new original lyrics.",
    voice:
      "Refuse direct living-artist voice clones. Offer register, weight, breath, grit, vibrato, articulation, and effects in generic terms. Never bypass Voice-model identity checks.",
    sample:
      "Do not assume a commercial master/stem is authorized. Require ownership, license, PD, or other permission before upload.",
    pd:
      "Public-domain composition status does not make a modern recording public domain. Verify jurisdiction and which layer (composition vs master) is clear.",
    commercial:
      "Re-read current Suno Terms for contractual rights vs copyright law. Distinguish platform terms from publicity/IP law. Not legal advice.",
    unknown: "Default conservative: no upload of third-party audio, no lyric reconstruction, no voice imitation.",
  };

  return {
    skillId: "rights",
    title: "Rights Classification",
    verified: VERIFIED,
    exclusion: namedExclusion(
      named || (material === "original" ? "" : "protected third-party material")
    ),
    sections: [
      { heading: "Request", body: input.request || "—" },
      { heading: "Class", body: labels[material] ?? material },
      { heading: "Rule Applied", body: rules[material] ?? rules.unknown },
      {
        heading: "Safe Substitutes",
        body: `High-level genre/era/mood · instrumentation · arrangement · original lyrics · new melody · authorized source only · generic vocal profile (${
          input.named ? "not a clone of the named artist" : "no identity claim"
        }).`,
      },
      {
        heading: "Not Legal Advice",
        body: `For high-stakes commercial release, consult qualified music/IP counsel. Re-check https://suno.com/terms on or after 2026-09-03 for announced Terms/download changes.`,
      },
    ],
  };
}

export function runCurrent(input: Record<string, string>): SkillReport {
  const topic = input.topic || "overview";
  const bodies: Record<string, string> = {
    overview: `Official-source priority:
1. Terms — https://suno.com/terms (contract, commercial, uploads, downloads)
2. Help Center — https://help.suno.com/en/ (UI, plans, formats, troubleshooting)
3. Release Notes — https://suno.com/release-notes (shipped features, models)
4. Blog — https://suno.com/blog (announcements; prefer Help for how-to)
Do not treat GitHub, Reddit, or unofficial tutorials as authoritative.`,
    studio: `Snapshot 2026-09-01: Studio 2.0 released 2026-08-13, documented as Premier-only. Chrome recommended; Safari without Web MIDI. MIDI tracks/piano roll, musical typing, external MIDI, audio-to-MIDI, wavetable synth, automation, built-in FX (compressor+sidechain, EQ, reverb, convolution, delay, distortion, gate), chat-built plugins, take lanes, recording, advanced stem split. No VST/AU. Exports: full song, selected range, multitrack; 32-bit WAV or MP3 project + WAV stems in that snapshot.`,
    editor: `Snapshot: section reorder, Quick Replace/Replace, lyric editing, add sections, two generated alternatives, split/crop, fades, extension, transition-boundary adjustment. Do not invent a dedicated crossfade knob unless current docs show one.`,
    sliders: `v6 Advanced Create (checked ${V6_CHECKED}):
- Max Mode Off/On — extra compute/credits; best for songs >2 min, covers, style transfer, vocal consistency.
- Variety Off / Normal / High / Extra / Max — rewrites style prompts except at Off. This compiler needs Off.
- Personalize (My Taste) Off/On — Taste profile steer. Leave Off when compiled Styles should dominate.
Legacy sliders still present: Weirdness Safe→Chaos (50% normal), Style Influence Loose→Strong, Audio Influence with upload. Numeric ranges in Covers/Optimizer are Expert starting presets, not official guarantees.`,
    v6: `v6 family snapshot (2026-09-15):
- v6 flagship for Pro and Premier
- v6-wild for exploration
- v6-mini on all plans (free)
Up to 8 minutes per track. Max Mode and Variety sliders control consistency and prompt variation.`,
    stems: `Advanced Stem Separation snapshot: Auto Split, Split from Mix, Advanced Split. Plan/credit details must be re-checked before quoting. Do not merge older stem-count pages into a synthetic number.`,
    voices: `v5.5 launched 2026-03-26 with Voices, Custom Models, My Taste. Snapshot: Pro/Premier could create up to three Custom Models from at least six owned tracks. Identity/verification rules around Voice models — re-check Terms. Never suggest using another person's voice as your own.`,
    terms: `On 2026-09-01 Suno announced new Terms and download limits scheduled to take effect 2026-09-03. Any rights/download answer on or after that date must read the then-current Terms. Current status: unconfirmed in this app at runtime.`,
  };

  return {
    skillId: "current",
    title: "Current Source Snapshot",
    verified: VERIFIED,
    exclusion: COMPACT_EXCLUSION,
    sections: [
      { heading: "Topic", body: topic },
      { heading: "Snapshot", body: bodies[topic] ?? bodies.overview },
      {
        heading: "How This App Treats Currency",
        body: `This compiler does not scrape Suno live. Treat button names, credit costs, and plan gates as a ${V6_CHECKED} baseline unless re-verified. Installed skill files do not rewrite themselves.`,
      },
    ],
  };
}

export function runSkill(id: string, input: Record<string, string>): SkillReport {
  switch (id) {
    case "optimizer":
      return runOptimizer(input);
    case "covers":
      return runCovers(input);
    case "mashups":
      return runMashups(input);
    case "lyrics":
      return runLyrics(input);
    case "editor":
      return runEditor(input);
    case "studio":
      return runStudio(input);
    case "rights":
      return runRights(input);
    case "current":
      return runCurrent(input);
    default:
      return runOptimizer(input);
  }
}
