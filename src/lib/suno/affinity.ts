import { familyKeys, fitsFamilies } from "./families.ts";

/**
 * Genre-aware phrase selection.
 *
 * Every phrase bank is keyed by sound family, but a family key alone is too coarse: the "rap" bank holds
 * boom-bap and G-funk phrases that do not belong in a trap prompt, and a hand-percussion phrase has no
 * place in a trap + UKG Dubstep blend. This module adds the two missing rules.
 *
 *  1. Roles. The primary genre owns the whole plan. A supporting genre only contributes phrases to the
 *     sections of its assigned role (UKG shapes drums, hats and bass pressure; Baile Funk shapes
 *     percussion; dubstep shapes bass and sound design...). Phrases from a supporting family are not
 *     eligible anywhere else, and primary-family phrases are drawn first (weighted).
 *  2. Style tags. Distinctive phrases (G-funk, boom-bap, vinyl, hand percussion, gospel, orchestral...)
 *     carry a style tag with its native genres. A tagged phrase is only eligible when a genre it is native
 *     to is in the blend (primary anywhere, supporting inside its role), or when the brief itself names it.
 */

export type Section =
  | "groove"
  | "drums"
  | "bass"
  | "harmony"
  | "melody"
  | "soundDesign"
  | "instruments"
  | "arrangement"
  | "mix"
  | "production";

const SECTIONS: Section[] = ["groove", "drums", "bass", "harmony", "melody", "soundDesign", "instruments", "arrangement", "mix", "production"];

/** The plan sections each family may feed when it is a supporting genre. */
const ROLE_SCOPE: Record<string, Section[]> = {
  ukg: ["groove", "drums", "bass", "instruments", "mix"],
  garage: ["groove", "drums", "instruments", "mix"],
  baile: ["groove", "drums", "instruments", "arrangement"],
  trap: ["groove", "drums", "bass", "instruments", "mix"],
  drill: ["groove", "drums", "bass"],
  phonk: ["drums", "bass", "soundDesign", "instruments"],
  bass: ["groove", "drums", "bass", "soundDesign", "arrangement", "mix"],
  riddim: ["groove", "drums", "bass", "soundDesign", "arrangement", "mix"],
  future: ["harmony", "melody", "soundDesign", "instruments"],
  house: ["groove", "drums", "instruments", "arrangement"],
  breaks: ["groove", "drums"],
  dancehall: ["groove", "drums", "instruments"],
  latin: ["groove", "drums", "instruments"],
  afro: ["groove", "drums", "instruments"],
  ritual: ["harmony", "melody", "soundDesign", "instruments", "arrangement"],
  cinematic: ["harmony", "melody", "soundDesign", "instruments", "arrangement"],
  ambient: ["harmony", "melody", "soundDesign", "instruments", "arrangement"],
  soul: ["harmony", "melody", "instruments"],
  gospel: ["harmony", "melody", "instruments"],
  rap: ["groove", "drums", "harmony", "melody"],
  pop: ["harmony", "melody", "arrangement"],
  folk: ["harmony", "melody", "instruments"],
};

interface StyleTag {
  id: string;
  /** Matches the distinctive wording in a phrase. */
  pattern: RegExp;
  /** Families this style is native to. */
  families: string[];
  /** Genre names it is native to. */
  names?: RegExp;
  /** Brief wording that makes the style fair game. */
  named?: RegExp;
}

const STYLE_TAGS: StyleTag[] = [
  {
    id: "boom-bap and sample hip-hop",
    pattern:
      /\bboom[- ]bap\b|\bg-funk\b|\bsoul[- ]sample|\bchopped soul|\bvinyl(?:[- ]sampled)?\b|\bdusty\b|\bjazzy\b|\bluxury minor|\bflipped soul|\bwhistling synth|\bcrate\b/i,
    families: ["soul"],
    names: /boom bap|g-funk|west coast|east coast|lo-?fi|jazz|chillhop|trip-hop|old school|conscious|underground|hip[- ]?hop|sample/,
    named: /boom[- ]bap|g-funk|vinyl|jazz|lo-?fi|dusty|soul sample|sample|crate|golden era|90s/i,
  },
  {
    id: "neo-soul",
    pattern: /\bneo-soul\b/i,
    families: ["soul"],
    names: /soul|r&b|rnb/,
    named: /neo-soul|soul|r&b|rnb/i,
  },
  {
    id: "gospel and church",
    pattern: /\bgospel\b|\bchurch\b|\bhammond\b|\bb3\b|\brotary organ|\bhallelujah/i,
    families: ["gospel", "soul"],
    names: /gospel|worship|church|soul/,
    named: /gospel|church|worship|hammond|organ/i,
  },
  {
    id: "hand and world percussion",
    pattern: /\bdjembe|\bconga|hand percussion|\bceremonial\b|talking drum|\btabla|didgeridoo|\bmbira|\bwoodblock/i,
    families: ["afro", "latin", "dancehall", "ritual", "baile", "ambient"],
    names: /world|tribal|african|afro|latin|samba|ritual|amapiano|gqom|dembow|reggaeton|baile|dancehall/,
    named: /hand (?:drum|percussion)|ceremonial|djembe|conga|tribal|ritual|african|world|talking drum|tabla|percussion circle/i,
  },
  {
    id: "orchestral and score",
    pattern: /orchestral|symphon|\btaiko\b|timpani|philharmonic|\bchoral\b/i,
    families: ["cinematic", "ritual"],
    names: /orchestral|score|film|cinematic|trailer|epic|classical|symphon/,
    named: /orchestr|symphon|cinematic|film|trailer|score|strings|epic/i,
  },
  {
    id: "garage swing",
    pattern: /\b2-step\b|\btwo-step\b|\bgarage\b|speed garage/i,
    families: ["garage"],
    names: /garage|2-step|bassline|uk funky/,
    named: /garage|2-step|two-step|speed garage/i,
  },
  {
    id: "house and club",
    pattern: /four-on-the-floor|\b909\b|house piano|\bdiva\b|organ stab/i,
    families: ["house", "garage"],
    names: /house|techno|trance|disco|garage/,
    named: /house|four-on-the-floor|909|techno|disco/i,
  },
  {
    id: "riddim and dancehall",
    pattern: /riddim drum machine|dub siren|\bskank/i,
    families: ["dancehall", "riddim"],
    names: /dancehall|reggae|riddim|dub\b/,
    named: /dancehall|reggae|riddim|dub siren|skank/i,
  },
  {
    id: "dembow",
    pattern: /dembow|reggaeton|timbales|perreo/i,
    families: ["latin", "baile"],
    names: /reggaeton|dembow|latin|moombah|baile/,
    named: /reggaeton|dembow|timbales|perreo|latin/i,
  },
  {
    id: "jungle and breaks",
    pattern: /\bamen\b|\bjungle\b|breakbeat|chopped break/i,
    families: ["breaks"],
    names: /jungle|breakbeat|breaks|dnb|drum and bass/,
    named: /amen|jungle|breakbeat|breaks|dnb|drum and bass/i,
  },
  {
    id: "banjo and campfire folk",
    pattern: /\bbanjo\b|campfire|\bfolk\b/i,
    families: ["folk"],
    names: /folk|country|bluegrass/,
    named: /banjo|folk|campfire|country|bluegrass/i,
  },
];

export class Selector {
  readonly genres: string[];
  private readonly primaryFamilies: string[];
  private readonly supporting: { genre: string; families: string[] }[];
  private readonly brief: string;

  constructor(genres: (string | undefined)[], brief = "") {
    this.genres = genres.filter((g): g is string => Boolean(g));
    this.primaryFamilies = familyKeys([this.genres[0]]);
    this.supporting = this.genres.slice(1).map((genre) => ({
      genre,
      families: familyKeys([genre]).filter((f) => !this.primaryFamilies.includes(f)),
    }));
    this.brief = brief.toLowerCase();
  }

  /** Sampling weight of a bank key in a section, or 0 when its family may not feed that section. */
  familyWeight(family: string, section: Section): number {
    if (this.primaryFamilies.includes(family)) return 3;
    const supporters = this.supporting.filter((s) => s.families.includes(family));
    if (supporters.length === 0) return 1; // vocal-derived and general banks; style tags police these
    return ROLE_SCOPE[family]?.includes(section) ?? true ? 1 : 0;
  }

  /** Whether any genre in the blend is native to a style tag, for a section. */
  private native(tag: StyleTag, section: Section): boolean {
    const matches = (genre: string) =>
      familyKeys([genre]).some((f) => tag.families.includes(f)) || Boolean(tag.names?.test(genre.toLowerCase()));
    if (this.genres[0] && matches(this.genres[0])) return true;
    return this.supporting.some(
      (s) =>
        matches(s.genre) &&
        (s.families.length === 0 || s.families.some((f) => ROLE_SCOPE[f]?.includes(section) ?? true))
    );
  }

  /** True when the phrase fits this blend in this section (or the brief itself names its style). */
  allows(phrase: string, section: Section): boolean {
    for (const tag of STYLE_TAGS) {
      const m = phrase.match(tag.pattern);
      if (!m) continue;
      if (this.brief.includes(m[0].toLowerCase())) continue;
      if (tag.named?.test(this.brief)) continue;
      if (!this.native(tag, section)) return false;
    }
    return true;
  }

  /** True when the phrase fits the blend in at least one section. */
  allowsAnywhere(phrase: string): boolean {
    return SECTIONS.some((section) => this.allows(phrase, section));
  }

  /** Drops mismatched phrases from a finished list, keeping every protected (brief-named) phrase. */
  clean(items: string[], section: Section, protectedItems: Iterable<string> = []): string[] {
    const keep = new Set([...protectedItems].map((p) => p.toLowerCase()));
    return items.filter((i) => keep.has(i.toLowerCase()) || this.allows(i, section));
  }

  /**
   * Picks up to n phrases for a section. Primary-family phrases are drawn first (weighted), supporting
   * families only feed their own role, and mismatched styles are excluded. The neutral "general" bank
   * only fills a shortfall.
   */
  pick(rng: () => number, bank: Record<string, string[]>, families: string[], n: number, section: Section): string[] {
    const fits = (phrase: string) => fitsFamilies(phrase, families) && this.allows(phrase, section);
    const weighted = new Map<string, number>();
    for (const f of families) {
      const w = this.familyWeight(f, section);
      if (w === 0) continue;
      for (const p of bank[f] ?? []) {
        if (fits(p)) weighted.set(p, Math.max(weighted.get(p) ?? 0, w));
      }
    }
    for (const p of bank.general ?? []) {
      if (weighted.size >= n) break;
      if (fits(p) && !weighted.has(p)) weighted.set(p, 1);
    }
    // Weighted draw without replacement (Efraimidis-Spirakis keys).
    const keyed = [...weighted].map(([p, w]) => ({ p, k: Math.pow(Math.max(rng(), 1e-9), 1 / w) }));
    keyed.sort((a, b) => b.k - a.k);
    return keyed.slice(0, n).map((x) => x.p);
  }

  one(rng: () => number, bank: Record<string, string[]>, families: string[], section: Section): string {
    return this.pick(rng, bank, families, 1, section)[0] ?? "polished modern production";
  }
}


/** Sentence openers the compiler itself writes before a list of phrases it picked. */
const COMPILED_LISTS =
  /((?:The sound palette centers on|Instrumentation features|Arranged with|Instrumentation is built around|Acoustic palette includes|The harmonic bed uses|Melodic hooks lean on|Hooks are built from|The lead role goes to)\s+)([^.]*)/gi;

/**
 * Fix mode re-reads the compiler's own output. The lists it wrote (instrumentation, harmonic bed, melodic
 * hooks) were picked by the compiler, not the user, so items in them that do not belong to the blend (say
 * "warm djembe and conga polyrhythms" or "warm G-funk synth chords" in a trap + UKG Dubstep prompt) are not
 * brief-named and are removed before the brief is read. Anything the user wrote elsewhere still counts.
 */
export function dropMismatchedCompiled(text: string, genres: string[]): string {
  if (genres.length === 0) return text;
  return text.replace(COMPILED_LISTS, (_whole, lead: string, list: string) => {
    const sel = new Selector(genres, text.replace(list, ""));
    const kept = list.split(/,\s*/).filter((item) => sel.allowsAnywhere(item));
    return kept.length ? lead + kept.join(", ") : "";
  });
}
