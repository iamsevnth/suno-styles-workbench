import { PromptCandidate } from "./types.ts";

export const V6_CHECKED = "2026-09-15";

export interface V6CreateSettings {
  model: string;
  maxMode: boolean;
  variety: string;
  personalize: boolean;
}

export const DEFAULT_V6_CREATE: V6CreateSettings = {
  model: "v6",
  maxMode: false,
  variety: "off",
  personalize: false,
};

export interface V6ModelOption {
  id: string;
  label: string;
  plan: string;
  picker: string;
  use: string;
}

export const V6_MODELS: V6ModelOption[] = [
  {
    id: "v6",
    label: "v6 (Pro / Premier)",
    plan: "Pro and Premier",
    picker: "Powerful. Versatile. Refined. Our best model yet.",
    use: "Flagship. Reliable, precise, polished across genres. Use when you know the record you want — including these compiled 925–975 Styles blocks.",
  },
  {
    id: "v6-wild",
    label: "v6-wild (Pro / Premier)",
    plan: "Pro and Premier",
    picker: "Best for experimental ideas.",
    use: "Exploration. Less predictable, more varied, unexpected texture. Riff here, then bring a keeper back into flagship v6.",
  },
  {
    id: "v6-mini",
    label: "v6-mini (All Plans)",
    plan: "All plans (free)",
    picker: "A free, more efficient version of premium v6 models.",
    use: "Fast drafts and high-volume idea capture. Lighter than flagship v6. All three models support up to 8 minutes per generation.",
  },
];

export interface VarietyStop {
  id: string;
  label: string;
  hint: string;
}

export const VARIETY_STOPS: VarietyStop[] = [
  {
    id: "off",
    label: "Off",
    hint: "Exact style — Suno does not rewrite your Styles tags. Required for this compiler.",
  },
  {
    id: "normal",
    label: "Normal",
    hint: "Balanced variety. Default on v6 / v6-mini. Rewrites style prompts.",
  },
  {
    id: "high",
    label: "High",
    hint: "Distinct styles. Larger rewrite of the Styles box per take.",
  },
  {
    id: "extra",
    label: "Extra",
    hint: "Bold exploration. Style tags drift further from what you typed.",
  },
  {
    id: "max",
    label: "Max",
    hint: "Unreasonably varied. Maximum style-prompt rewrite.",
  },
];

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function randomPromptId(length: number = 8): string {
  const out: string[] = [];
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (const b of bytes) out.push(ALPHANUM[b % ALPHANUM.length]);
    return out.join("");
  }
  for (let i = 0; i < length; i++) {
    out.push(ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)]);
  }
  return out.join("");
}

export function formatAllPromptsTxt(prompts: PromptCandidate[]): string {
  return prompts
    .map((p) => {
      const id = randomPromptId();
      const title = (p.phrase || p.title.split("|")[0] || "Untitled").trim();
      const header = `ID#${id} & ${title} | ${p.bpm} BPM | ${p.characters} Total Characters`;
      return `${header}\n${p.styles}\n====\n`;
    })
    .join("\n");
}

export function v6Advice(settings: V6CreateSettings): string {
  const model = V6_MODELS.find((m) => m.id === settings.model);
  const variety = VARIETY_STOPS.find((v) => v.id === settings.variety);
  const bits = [
    `Model: ${model?.label ?? settings.model}. ${model?.use ?? ""}`,
    `Max Mode: ${
      settings.maxMode ? "On" : "Off"
    }. Official: costs more credits; best for songs longer than two minutes, covers that should stay close to the source, style transfer, and keeping vocals/style consistent through the track. Standard (Off) is enough for short drafts.`,
    `Variety: ${
      variety?.label ?? settings.variety
    }. Official: introduces variety by adjusting and updating your style prompts. Reduce to Off (0) to retain full control of style tags. This compiler's 925–975 Styles only stay verbatim at Variety Off.`,
    `Personalize (My Taste): ${
      settings.personalize ? "On" : "Off"
    }. When On, v6 can steer toward your Taste profile and, with Variety above Off, use it to branch style directions. Leave Off when the compiled Styles should dominate.`,
  ];
  return bits.join("\n");
}

export const V6_SNAPSHOT = `Suno v6 family launched 2026-09-09. Official sources: Introducing v6 (blog + release notes), Help Center “v6 FAQ” (article 13924481) and “What's new in v6?” (article 13924801), checked ${V6_CHECKED}.

Models
- v6 — flagship for Pro and Premier. Reliable, precise, polished. App picker: “Powerful. Versatile. Refined. Our best model yet.” (This is the paid flagship people call v6 Pro — there is no separate “v6 Pro” model id.)
- v6-wild — Pro and Premier. Exploration: less predictable, more varied, unexpected texture. Picker: “Best for experimental ideas.”
- v6-mini — all plans, including free. Faster, more efficient version of the premium v6 models.
All three support up to 8 minutes per generation. All models prior to v6 were retired the same day; library songs remain playable; new iterations use v6.

Advanced Create / More Options (new with v6)
- Max Mode: Off / On. Spends more compute (more credits) to maximize consistency. Best for songs >2 minutes, covers, style transfer, vocal/style consistency. Off for quick short songs.
- Variety: Off, Normal, High, Extra, Max. Rewrites the Styles prompt to introduce variation. Default Normal on v6/v6-mini, often Off on v6-wild. Engineered Styles stay verbatim only at Off.
- Personalize (My Taste): Off / On. Applies the user's Taste profile. Unrelated to Variety's rewrite, but Variety can use Taste to branch directions.
Still present: Weirdness (Safe→Chaos; keep low ~20–30% for compiled tags), Style Influence (Loose→Strong; ~75–85% so v6 obeys these Styles), Audio Influence (with upload), Vocal Gender, Duration (Custom/Auto), Exclude.

New v6 capabilities (plain language in Simple mode)
- Edit one section without rebuilding the song.
- Mashup multiple authorized sources in one request.
- Sample / isolate a riff and build a beat.
- Create from text, audio, images, and video.
- Update a single lyric line.

Credits: v6 generations cost the same as previous models at standard mode (Help: two songs / 10 credits). Max Mode costs more. Many images/videos in a prompt can raise cost. Custom Models auto-upgrade onto v6.

For this compiler: recommend v6 + Variety Off + Personalize Off. Turn Max Mode On for covers, Voices, or songs you intend to keep past ~2 minutes.`;
