import type { ParsedInput, SonicPlan } from "./types.ts";

/** Production identities model musical behaviors rather than synonymous genre labels. */
export interface SonicIdentity {
  id: string;
  label: string;
  genrePattern: RegExp;
  grooveGrammar: string;
  bassTopology: string;
  soundDesign: string;
  arrangementGrammar: string;
  mixAesthetic: string;
}

const define = (id: string, label: string, pattern: RegExp, groove: string, bass: string, design: string, arrangement: string, mix: string): SonicIdentity =>
  ({ id, label, genrePattern: pattern, grooveGrammar: groove, bassTopology: bass, soundDesign: design, arrangementGrammar: arrangement, mixAesthetic: mix });

export const SONIC_IDENTITIES: SonicIdentity[] = [
  define("talking-fm-mutant", "Talking FM Mutant Bass", /brostep|dubstep|tearout/i, "staccato call-and-response", "formant-swept FM growls", "vowel-shaped midrange modulation", "Drop 2 answers the first bass phrase with an octave-raised formant", "tight dry mid-bass transients"),
  define("sound-system-pressure", "Sound-System Sub Pressure", /dubstep|140 bass|deep bass/i, "spacious half-time downbeats", "sustained physical sub pressure", "dubwise tape-echo fragments", "Drop 2 opens longer sub tails between sparse strikes", "sub-led sound-system balance"),
  define("rubber-wobble", "Elastic Wobble Conversation", /dubstep|wonky|wobble/i, "syncopated broken bass pocket", "rubbery lowpass wobble dialogue", "elastic LFO changes and quick pitch bends", "Drop 2 reverses the bass question-and-answer rhythm", "controlled low-frequency transients"),
  define("mechanized-tearout", "Mechanized Tearout", /tearout|brostep|dubstep/i, "stop-start halftime impacts", "rasping distorted mid-bass strikes", "metallic FM machinery", "Drop 2 switches to denser triplet bass edits after a one-beat pause", "hard-edged punch with carved sub"),
  define("minimal-riddim-stomp", "Minimal Riddim Stomp", /riddim|dubstep/i, "repetitive offbeat stomp", "short squared wobble syllables", "tiny timbral mutations in a minimal loop", "Drop 2 changes the kick placement over the same hypnotic motif", "dry sparse pressure"),
  define("neuro-metal-mutation", "Neuro Metallic Mutation", /neuro|dubstep|drum.?bass/i, "high-resolution broken syncopation", "resampled reese movement", "metallic spectral morphs and granular edits", "Drop 2 rotates reese articulations through triplet bursts", "precision-separated distorted layers"),
  define("colour-bass-prism", "Colour Bass Prism", /colour|color bass|melodic dubstep|future bass/i, "bright syncopated half-time bounce", "harmonically tuned mid-bass accents", "spectral prism chords and shimmering FM transients", "Drop 2 shifts the melodic bass motif up an octave", "clear luminous harmonics over steady mono bass"),
  define("wonky-psychedelic", "Wonky Psychedelic Elasticity", /wonky|experimental bass|glitch hop/i, "deliberately lopsided swing", "elastic pitch-bent bass gestures", "warped tape and granular microcuts", "Drop 2 answers crooked rhythmic motifs with contrasting syncopation", "textured asymmetric stereo space"),
  define("melodic-bass-bloom", "Melodic Bass Bloom", /melodic dubstep|future bass|melodic bass/i, "half-time lift with dynamic drum breaks", "rounded supporting sub foundation", "detuned chord blooms and bell arpeggios", "Drop 2 extends the hook with soaring chord inversions", "wide harmony over focused low end"),
  define("drumstep-hyperedit", "Drumstep Hyper-Edit", /drumstep|drum.?bass|dubstep/i, "double-time breakbeat acceleration", "agile reese and sub pulses", "rapid micro-edited drum transients", "Drop 2 switches break fills and bass rhythmic density", "tight fast transient architecture"),
  define("industrial-reese", "Industrial Reese Pressure", /industrial|dubstep|neuro|drum.?bass/i, "mechanical broken pulse", "detuned grinding reese layers", "rusted metallic modulation", "Drop 2 opens an abrasive counter-rhythm after a brief cutoff", "gritty controlled stereo distortion"),
  define("dubwise-space", "Dubwise Echo Space", /dub|reggae|deep dubstep/i, "reduced skank and half-time pocket", "extended deep sub decays", "tape delay feedback and spring-echo percussion", "Drop 2 strips the drums to reveal an echo-led bass refrain", "deep negative-space sound-system mix"),
  define("festival-808-impact", "Festival 808 Impact", /edm trap|trapstep|festival trap|trap/i, "wide half-time trap strikes", "saturated sliding 808 weight", "sharp FM stabs and rising noise", "Drop 2 adds triplet kick accents and an octave bass answer", "hard kick-808 separation"),
  define("negative-space-trap", "Minimal Negative-Space Trap", /trap|hip hop/i, "sparse pocket with deliberate snare gaps", "short tuned 808 punctuation", "isolated bell fragments and micro-pauses", "Drop 2 subtracts the kick then rebuilds the main pattern", "dry close minimalist staging"),
  define("dark-luxury-808", "Dark Luxury 808", /trap|rap|hip hop/i, "slow head-nod trap swing", "rounded long-glide 808", "minor-ninth Rhodes and glassy plucks", "Drop 2 introduces a higher counterline against the original sub motif", "sleek spacious low-mid balance"),
  define("rage-synth", "Rage Synth Distortion", /rage|trap/i, "driving straight trap hats", "clipped saturated 808 hits", "overdriven saw leads and harsh modulation", "Drop 2 shifts the lead to a higher register over harder drums", "bright abrasive top over stable sub"),
  define("drill-glide", "Drill Glide Tension", /drill/i, "offset drill kick patterns", "sliding 808 portamento intervals", "eerie repeating sparse notes", "Drop 2 varies the snare and descending bass glide", "tight dark low end"),
  define("jersey-kick-switch", "Jersey Kick Switch", /jersey|club|trap/i, "rapid syncopated kick breaks", "short responsive sub hits", "vocal-chop-like rhythmic stabs", "Drop 2 flips the kick break into a new two-bar call-response", "kinetic punchy club transients"),
  define("soulful-two-step", "Soulful Two-Step", /uk garage|2.step|garage/i, "shuffled two-step kick-snare skipping", "rounded low bassline syncopation", "warm Rhodes chords and chopped vocal texture", "Second section varies shaker placement and melodic answers", "soft-edged warm garage mix"),
  define("speed-garage", "Speed Garage Bassline", /speed garage|uk garage|garage/i, "shuffling four-to-the-floor garage momentum", "rubbery rhythmic bassline", "sharp organ stabs and clipped filters", "Drop 2 switches the bassline rhythm after a brief fakeout", "punchy tight dancefloor balance"),
  define("grime-squarewave", "Grime Squarewave", /grime|uk rap/i, "sparse angular 140 pocket", "squarewave bass stabs", "icy one-note synth motifs", "Second refrain changes the squarewave rhythm under the same hook", "cold foreground synth pressure"),
  define("jungle-amen", "Jungle Amen Rush", /jungle|breakcore|breakbeat/i, "chopped amen-style syncopated breaks", "rolling sub pulses", "fast ghost snares and break reversals", "Second peak reverses the break edits with a new kick accent", "crisp drums over deep rolling bass"),
  define("liquid-dnb", "Liquid DnB Glide", /liquid|drum.?bass/i, "rolling fast two-step breakbeats", "fluid warm sub and reese", "jazzy extended chords and smooth pads", "Second peak develops a brighter counter-melody over rolling percussion", "glossy spacious breakbeat mix"),
  define("bass-house-punch", "Bass House Punch", /bass house|house/i, "driving four-on-the-floor house kick", "short distorted bass-house stabs", "syncopated filter and pitch automation", "Drop 2 switches bass phrasing around the steady kick", "punchy centered club mix"),
  define("tech-house-rolling", "Tech House Rolling", /tech house|house/i, "rolling house percussion", "minimal rubbery bassline", "dry vocal snippets and hat microgrooves", "Second section varies percussion accents over the repeated bass hook", "tight dry club low end"),
  define("french-filter", "French Filter Disco", /french|filter house|disco/i, "pumping four-on-the-floor disco groove", "warm driving bassline", "filter-swept chopped disco chords", "Second peak opens the filter and adds octave harmonic movement", "glossy compressed dancefloor warmth"),
  define("complextro-microedit", "Complextro Micro-Edit", /complextro|electro house/i, "precisely sequenced four-on-the-floor energy", "rapid alternating bass-synth timbres", "micro-edited FM stabs and digital cuts", "Drop 2 rearranges bass timbres across an evolving four-bar hook", "bright separated electro-house transients"),
  define("amapiano-midnight", "Midnight Amapiano Log Drum", /amapiano/i, "deep relaxed syncopated shaker pocket", "melodic log-drum pitch bends", "soft jazz keys and warm percussion", "Second section trades log-drum responses with a higher piano phrase", "rounded spacious low-frequency bounce"),
  define("gqom-pulse", "Gqom Dark Pulse", /gqom/i, "minimal syncopated heavy kick cells", "deep sub pulses under sparse percussion", "raw mechanical drum texture", "Second peak introduces a new polyrhythmic kick answer", "dark physical club weight"),
  define("afro-house-sunset", "Afro House Sunset", /afro.house|afro tech|afrobeats/i, "layered organic four-on-the-floor percussion", "warm grounded bass pulse", "evolving hand percussion and airy keys", "Second peak expands the percussion conversation and chord voicings", "open organic stereo space"),
  define("raw-dembow-pressure", "Raw Dembow Pressure", /dembow|reggaeton/i, "insistent dembow percussion loop", "short pulsing low bass", "dry drum fills and rhythmic chopped stabs", "Second hook switches the kick accents under the dembow", "forward tight percussion and mono bass"),
  define("baile-tamborzao", "Baile Tamborzao", /baile|brazilian funk/i, "tamborzao-driven syncopated percussion", "hard short sub strikes", "metallic percussion and chopped vocal chops", "Second peak switches the tamborzao pattern into faster fills", "loud dry street-club drum punch"),
  define("neo-soul-pocket", "Neo-Soul Rhodes Pocket", /neo.soul|soul|r&b/i, "laid-back human swing and rim accents", "soft rounded bass guitar foundation", "Rhodes ninth chords and guitar fills", "Second chorus adds a countermelody to the main harmonic motif", "warm intimate analog tone"),
  define("alt-rnb-nocturne", "Alternative R&B Nocturne", /r&b|trapsoul/i, "minimal nocturnal syncopation", "restrained smooth sub accents", "muted guitar and airy harmonic suspensions", "Second hook adds a contrasting whispered melodic answer", "dry intimate voice-forward mix"),
  define("ritual-drone", "Ritual Drone Ceremony", /ritual|ambient|cinematic/i, "slow processional hand-percussion pulse", "sustained atmospheric low drone", "textural bells and evolving distant harmonic layers", "Second movement develops a deeper drone-and-percussion motif", "wide cavernous organic space"),
];

export function identitiesForGenre(primary: string): SonicIdentity[] {
  return SONIC_IDENTITIES.filter((identity) => identity.genrePattern.test(primary));
}

export function chooseSonicIdentity(primary: string, rank: number, mode: "precision" | "exploration" | "ab" = "precision"): SonicIdentity | undefined {
  const matches = identitiesForGenre(primary);
  if (!matches.length) return undefined;
  const index = mode === "ab" ? 0 : mode === "exploration" ? (rank * 3 + 1) % matches.length : rank % matches.length;
  return matches[index];
}

export function applySonicIdentity(plan: SonicPlan, parsed: ParsedInput, rank: number, mode: "precision" | "exploration" | "ab" = "precision"): SonicPlan {
  const identity = chooseSonicIdentity(plan.primaryGenre, rank, mode);
  if (!identity) return plan;
  const locked = (part: string) => (parsed.exclusions ?? []).some((x) => x.toLowerCase().includes(part.toLowerCase()) || part.toLowerCase().includes(x.toLowerCase()));
  const include = (list: string[], signature: string) => locked(signature) ? list : [signature, ...list.filter((x) => x.toLowerCase() !== signature.toLowerCase())];
  return {
    ...plan,
    sonicIdentity: identity.id,
    variationMode: mode,
    groove: include(plan.groove, identity.grooveGrammar),
    bass: include(plan.bass, identity.bassTopology),
    soundDesign: include(plan.soundDesign, identity.soundDesign),
    arrangement: include(plan.arrangement, identity.arrangementGrammar),
    mix: include(plan.mix, identity.mixAesthetic),
    recipeId: [identity.id, plan.metricFeel, plan.drums[0], identity.bassTopology, identity.arrangementGrammar, plan.vocals.style ?? "instrumental"].join("|"),
    variantAxes: [identity.label, ...plan.variantAxes.filter((x) => !/^seed:|^recipe:/.test(x))],
  };
}
