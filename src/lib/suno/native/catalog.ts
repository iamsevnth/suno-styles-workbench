import { EDM_SUBS } from "./catalog-edm.ts";
import { NativeSub, SubBanks } from "./types.ts";

/** Builds a sub-genre from a family's shared banks plus its own overrides. */
function make(
  id: string,
  name: string,
  match: RegExp,
  base: Required<Omit<Pick<NativeSub, keyof SubBanks & keyof NativeSub>, "vocalStyle" | "rapVocals" | "edm" | "keepWords" | "keepName" | "signature" | "allow" | "context" | "headings">> & SubBanks,
  own: SubBanks & { bpm: [number, number, number] }
): NativeSub {
  return { id, name, match, ...(base as object), ...own } as NativeSub;
}

type Base = Parameters<typeof make>[3];

/* ------------------------------------------------------------------------------------------ */
/* Techno                                                                                      */
/* ------------------------------------------------------------------------------------------ */
const TECHNO: Base = {
  bpm: [124, 132, 128],
  feel: "four-on-the-floor",
  moods: ["hypnotic", "driving"],
  vocal: "none",
  leads: ["arpeggiated analog synth lead", "plucked polyphonic synth motif", "evolving filtered synth line", "bell-like pluck melody"],
  drums: [
    "driving four-on-the-floor kick with a rolling closed hi-hat groove",
    "tight punchy kick, offbeat open hats and soft clap layers",
    "909-style kick with shuffled percussion and a ride shimmer",
    "layered claps, rimshot ticks and swung shaker sixteenths",
  ],
  bass: [
    "rolling offbeat sub bass ducked under every kick",
    "tight analog bassline locked to the kick",
    "pulsing mono bass with slow filter movement",
  ],
  harmony: ["minor-key chord stabs", "slow-evolving pad chords", "suspended minor progression with long release"],
  textures: ["long filtered risers", "reverb-drenched pads", "soft white-noise swells", "granular atmosphere", "delay-throw percussion echoes"],
  extras: ["analog drum-machine hats", "resonant filter sweeps", "dub-chord stabs", "metallic percussion hits"],
  vocals: ["sparse and processed, treated as another texture", "chopped into short rhythmic phrases", "whispered and heavily reverbed"],
  eras: ["Berlin warehouse sheen", "late-night afterhours production", "analog hardware warmth", "modern festival-stage polish"],
  arrangement: [
    "long intro, gradual layering, a stripped breakdown, then a full-energy return",
    "eight-bar DJ-friendly intro, steady build, emotional breakdown, final peak",
    "slow build over four sections with the lead entering late",
  ],
  mix: [
    "kick and bass tight and centered, pads wide, lead upfront",
    "clean low end, crisp hats, spacious reverb tails on the synths",
    "punchy kick forward, bass ducked cleanly, stereo-wide atmosphere",
  ],
  endings: ["Ends on a slow filtered fade-out.", "Outro strips back to kick and hats for DJ mixing.", "Closes with a long reverb tail over a lone pulse."],
  claims: [],
};

/* ------------------------------------------------------------------------------------------ */
/* House                                                                                       */
/* ------------------------------------------------------------------------------------------ */
const HOUSE: Base = {
  bpm: [120, 126, 124],
  feel: "four-on-the-floor",
  moods: ["groovy", "uplifting"],
  vocal: "sung",
  leads: ["soulful piano chord stabs", "filtered disco sample loop", "warm electric piano riff", "plucked synth hook"],
  drums: [
    "four-on-the-floor kick with clap on two and four",
    "909 drum machine, offbeat open hats and tambourine sixteenths",
    "shuffled closed hats, ride cymbal wash and snappy claps",
    "swung percussion loop with congas and shakers",
  ],
  bass: ["rounded analog house bass with a bouncing groove", "filtered organ bass", "plucky sub bass answering the kick"],
  harmony: ["lush seventh-chord stabs", "warm major-seventh pads", "dub-chord stabs with long delay"],
  textures: ["sidechain-pumped pads", "slow filter sweeps", "delay-thrown vocal snippets", "tape-saturated room tone"],
  extras: ["Rhodes electric piano", "shakers", "atmospheric pads", "warm string pad"],
  vocals: ["soulful and warm with stacked harmonies on the hook", "airy and close-mic'd, doubled on the chorus", "confident and rhythmic with call-and-response ad-libs"],
  eras: ["Chicago-to-Ibiza clubland warmth", "sunrise-set dance floor sheen", "analog hardware swing", "modern boutique-label polish"],
  arrangement: [
    "extended DJ intro, vocal verse, breakdown with filter sweep, full groove return",
    "eight-bar drum intro, chord entry, vocal hook, mid-track breakdown, final peak",
    "slow build with elements entering every eight bars",
  ],
  mix: [
    "kick and bass tight in the center, chords wide and warm, vocal upfront",
    "bass ducking under every kick, hats crisp, high-frequency air on the vocal",
    "warm low-mid weight sized for big rooms, clean top end",
  ],
  endings: ["Ends on a filtered outro for DJ mixing.", "Closes on a bare kick and shaker loop.", "Fades into a long delay tail on the last chord."],
  claims: [],
};

/* ------------------------------------------------------------------------------------------ */
/* Lo-fi, chillhop and jazz                                                                    */
/* ------------------------------------------------------------------------------------------ */
const LOFI: Base = {
  bpm: [68, 92, 80],
  feel: "swung",
  moods: ["mellow", "nostalgic"],
  vocal: "none",
  leads: ["warm Rhodes electric piano", "mellow jazz guitar", "soft felt-piano chords", "dusty sampled keys"],
  drums: [
    "dusty boom-bap drums with a soft swung kick and brushed snare",
    "lazy swung hats and a muted snare",
    "vinyl-sampled drum break softened with tape saturation",
    "rim-click snare, gentle shaker and a laid-back kick",
  ],
  bass: ["round upright-style bass line", "soft sine sub following the root notes", "warm electric bass walking gently"],
  harmony: ["mellow minor-seventh chords", "jazzy ninth voicings", "lush extended chords with chromatic passing tones"],
  textures: ["vinyl crackle and tape hiss", "gentle tape wobble", "warm room noise", "soft rain ambience", "muffled low-pass sample layers"],
  extras: ["muted vibraphone", "soft flute sample", "warm pad bed", "light guitar plucks"],
  vocals: ["breathy, close-mic'd and low-key", "soft and murmured with light tape doubling", "smooth and laid-back with a short slapback"],
  eras: ["dusty 90s sample-crate warmth", "late-night bedroom studio feel", "cassette-tape warmth and saturation", "cozy cafe-corner sound"],
  arrangement: [
    "short sample intro, steady loop with small chord variations, a filtered break, then a gentle return",
    "four-bar intro, loop that slowly gains layers, soft solo section, fade",
    "one looping progression that evolves through subtle instrument swaps",
  ],
  mix: [
    "drums soft and slightly behind the beat, keys warm and upfront, high end gently rolled off",
    "low end rounded, top end dark, wide quiet ambience around the keys",
    "tape-saturated mix glue with gentle compression and a soft stereo image",
  ],
  endings: ["Fades out on a slow tape-stop and vinyl crackle.", "Closes on a single sustained chord and room noise.", "Ends with a filtered loop dissolving into crackle."],
  claims: [],
};

/* ------------------------------------------------------------------------------------------ */
/* Folk, indie and acoustic                                                                    */
/* ------------------------------------------------------------------------------------------ */
const FOLK: Base = {
  bpm: [76, 112, 94],
  feel: "full-time",
  moods: ["intimate", "reflective"],
  vocal: "sung",
  leads: ["fingerpicked acoustic guitar", "warm nylon-string guitar", "strummed steel-string acoustic guitar", "felt acoustic piano"],
  drums: [
    "soft brushed drums and a muted kick",
    "light shaker and tambourine pulse",
    "simple kick and snare with a gentle backbeat",
    "stomp-and-clap rhythm with a hand-played feel",
  ],
  bass: ["warm upright bass", "soft fingerstyle bass guitar", "sparse root-note bass"],
  harmony: ["open major and minor chord changes", "gentle suspended chords", "sparse fingerpicked arpeggios"],
  textures: ["natural room reverb", "close-mic'd finger squeaks and breaths", "subtle tape warmth", "soft pedal-steel swells"],
  extras: ["light banjo and mandolin accents", "cello swells", "soft harmonica", "warm acoustic piano", "gentle string quartet"],
  vocals: ["close-mic'd and unadorned", "doubled softly on the chorus with warm harmonies", "raw and conversational, rising in the final chorus"],
  eras: ["intimate living-room recording", "2010s indie-folk warmth", "live-in-the-room take", "wood-and-tape analog character"],
  arrangement: [
    "sparse verse, fuller chorus with harmonies, quiet bridge, last chorus lifted",
    "solo guitar intro, band enters on the second verse, stripped final refrain",
    "slow build from one guitar to a full small ensemble",
  ],
  mix: [
    "vocal and guitar upfront and dry-ish, natural room, gentle low end",
    "warm midrange, soft transients, wide acoustic stereo image",
    "close and intimate with subtle reverb on vocal peaks",
  ],
  endings: ["Ends on a single unresolved guitar chord ringing out.", "Closes with a hummed refrain and fading strings.", "Stops cold after the last line, room tone lingering."],
  claims: [],
};

/* ------------------------------------------------------------------------------------------ */
/* Rock                                                                                        */
/* ------------------------------------------------------------------------------------------ */
const ROCK: Base = {
  bpm: [100, 150, 120],
  feel: "full-time",
  moods: ["energetic", "raw"],
  vocal: "sung",
  leads: ["overdriven electric guitar riff", "jangly clean-to-crunch guitar hook", "fuzzed power-chord riff", "twin guitar melody"],
  drums: [
    "live drum kit with a heavy backbeat and crashing cymbals",
    "tight snare, driving eighth-note hats and open crashes on the chorus",
    "room-miked kit with big toms and a punchy kick",
    "four-on-the-floor stomp with handclaps on the chorus",
  ],
  bass: ["gritty picked bass locked to the kick", "round fingerstyle bass following the guitar riff", "overdriven bass guitar with a driving pulse"],
  harmony: ["power chords with open-string ring", "major-minor chord changes with suspended color", "stacked rhythm guitars panned left and right"],
  textures: ["spring reverb and tape slap", "feedback swells at section changes", "amp hum and room ambience", "ringing guitar harmonics"],
  extras: ["rhythm guitar double-tracked", "Hammond organ swells", "tambourine on the chorus", "lead guitar fills"],
  vocals: ["raw and urgent with gang-vocal doubles on the chorus", "gritty and open-throated, climbing into the hook", "melodic and slightly hoarse with stacked harmonies"],
  eras: ["garage-band energy", "90s alternative-rock crunch", "live-room analog recording", "modern wide-guitar rock polish"],
  arrangement: [
    "riff intro, verse, big chorus, guitar-led bridge, double final chorus",
    "quiet verse building to a loud chorus, solo, stripped bridge, last chorus",
    "cold-start riff, verse and chorus alternation, breakdown, final push",
  ],
  mix: [
    "guitars wide, vocal upfront, kick and bass tight, drums roomy",
    "crunchy mids, punchy snare, controlled low end",
    "live-band balance with natural room and short plate reverb on the vocal",
  ],
  endings: ["Ends on a ringing final chord and feedback tail.", "Closes with a hard stop on the last downbeat.", "Fades out on the repeating guitar riff."],
  claims: [],
};

/* ------------------------------------------------------------------------------------------ */
/* Metal                                                                                       */
/* ------------------------------------------------------------------------------------------ */
const METAL: Base = {
  bpm: [110, 190, 150],
  feel: "full-time",
  moods: ["aggressive", "heavy"],
  vocal: "sung",
  leads: ["high-gain palm-muted guitar riff", "harmonized twin lead guitars", "tremolo-picked melodic guitar line", "shredding lead guitar"],
  drums: [
    "double-kick patterns with a tight, cracking snare",
    "fast blast-beat sections with crashing cymbals",
    "punchy triggered kick, snare fills and open china crashes",
    "half-time breakdown groove with huge toms",
  ],
  bass: ["distorted bass guitar locked to the kick", "clanking picked bass doubling the riff", "thick low-tuned bass with a tight midrange edge"],
  harmony: ["down-tuned power chords", "minor-key riffs with chromatic tension", "dissonant tritone accents"],
  textures: ["feedback swells", "dark orchestral pad underneath the riffs", "gated amp noise", "ominous choir pad"],
  extras: ["rhythm guitars quad-tracked", "tight gated guitar chugs", "cathedral organ", "tom-heavy fills"],
  vocals: ["powerful and gritty with doubled screams on the hook", "clean and soaring melodic lead", "harsh low growls alternating with a clean chorus"],
  eras: ["modern high-gain studio production", "80s heavy-metal punch", "raw underground-demo grit", "polished arena-metal scale"],
  arrangement: [
    "riff intro, aggressive verse, melodic chorus, solo, breakdown, final chorus",
    "slow ominous intro building into full speed, bridge with harmonized leads",
    "verse and chorus alternation, a long guitar solo, crushing outro",
  ],
  mix: [
    "tight palm-muted guitars wide, kick and bass defined, vocal upfront",
    "scooped guitar mids, loud snare, controlled low end",
    "massive wall of guitars with clear drum transients",
  ],
  endings: ["Ends on a held feedback chord and one last double-kick burst.", "Closes with a slow doom-heavy riff and fading cymbals.", "Cuts to silence on the final crash."],
  claims: [],
};

/* ------------------------------------------------------------------------------------------ */
/* Country                                                                                     */
/* ------------------------------------------------------------------------------------------ */
const COUNTRY: Base = {
  bpm: [80, 130, 100],
  feel: "full-time",
  moods: ["warm", "nostalgic"],
  vocal: "sung",
  leads: ["twangy clean telecaster-style guitar", "weeping pedal steel guitar", "lively fiddle melody", "strummed acoustic guitar"],
  drums: [
    "train-beat snare pattern with brushed hats",
    "steady backbeat with a soft kick and tambourine",
    "live kit with rimshot accents and a relaxed shuffle",
    "boom-chick bass-and-snare feel",
  ],
  bass: ["warm upright bass walking through the changes", "round electric bass doubling the kick", "simple root-fifth bass"],
  harmony: ["open major chords with a gospel-tinged turnaround", "I-IV-V changes with a sweet minor bridge", "fingerpicked chord arpeggios"],
  textures: ["slap-back reverb", "pedal-steel swells", "porch-room ambience", "light tape warmth"],
  extras: ["banjo rolls", "mandolin chops", "acoustic guitar strum", "harmonica fills", "honky-tonk piano"],
  vocals: ["warm and storytelling with a slight twang", "heartfelt and close with harmony on the chorus", "relaxed and conversational, lifting on the hook"],
  eras: ["Nashville studio warmth", "outlaw-country grit", "modern country-pop sheen", "back-porch live feel"],
  arrangement: [
    "acoustic intro, story-driven verse, bigger chorus, steel solo, final chorus",
    "fiddle intro, two verses, harmonized chorus, stripped bridge, last chorus",
    "verse and chorus with an instrumental break led by pedal steel",
  ],
  mix: [
    "vocal upfront and dry, guitars warm and wide, bass round and steady",
    "bright acoustic strum, natural room, short slapback on the vocal",
    "organic live balance with a gentle low end",
  ],
  endings: ["Ends on a twangy guitar tag and a final strum.", "Closes with a fiddle flourish.", "Fades on a slow pedal-steel note."],
  claims: [],
};

/* ------------------------------------------------------------------------------------------ */
/* Synthwave                                                                                   */
/* ------------------------------------------------------------------------------------------ */
const SYNTHWAVE: Base = {
  bpm: [90, 125, 108],
  feel: "full-time",
  moods: ["nostalgic", "neon"],
  vocal: "none",
  leads: ["soaring analog lead synth", "gated arpeggiated synth line", "glassy lead with slow vibrato", "bright sawtooth melody"],
  drums: [
    "gated-reverb snare with punchy electronic claps",
    "driving drum-machine kick and tight sixteenth hats",
    "big electronic toms and a steady backbeat",
    "crisp 80s drum-machine groove with a clap-snare layer",
  ],
  bass: ["pulsing sixteenth-note analog bass", "driving octave bass line", "warm sequenced sub bass"],
  harmony: ["lush minor-key chord pads", "wide detuned string-synth chords", "slow evolving analog pad progression"],
  textures: ["chorus-washed pads", "tape-warped synth shimmer", "ambient city-night reverb", "VHS-style tape wobble"],
  extras: ["analog poly-synth stabs", "saxophone-like synth lead", "synth choir pad", "sweeping filter arpeggios"],
  vocals: ["airy and reverb-soaked with stacked harmonies", "smooth and detached, doubled on the chorus", "yearning and bright over the chords"],
  eras: ["mid-80s night-drive atmosphere", "retro-futuristic neon production", "analog hardware synth warmth", "cassette-era film-score sheen"],
  arrangement: [
    "arpeggio intro, drums enter, melodic lead section, breakdown, final lift",
    "slow pad intro, steady groove, lead solo, stripped bridge, big return",
    "pulsing sequence builds through three layers into the main theme",
  ],
  mix: [
    "synths wide and glossy, snare big with gated tail, bass tight and centered",
    "warm analog top end, punchy drums, lead synth upfront",
    "chorus-wide pads, dry kick, shimmering reverb on the snare",
  ],
  endings: ["Ends on a slow filter fade and a held chord.", "Closes with a final arpeggio ringing into reverb.", "Fades into a tape-stop and engine hum."],
  claims: [],
};

/* ------------------------------------------------------------------------------------------ */
/* Pop                                                                                         */
/* ------------------------------------------------------------------------------------------ */
const POP: Base = {
  bpm: [90, 128, 112],
  feel: "full-time",
  moods: ["bright", "catchy"],
  vocal: "sung",
  leads: ["glossy synth hook", "bright plucked synth riff", "punchy piano hook", "sparkling arpeggio"],
  drums: [
    "punchy programmed kick, snappy claps and crisp hats",
    "tight snare, finger-snap layer and bouncing hats",
    "four-on-the-floor pulse with clap stacks on the chorus",
    "live-sampled drum kit with a modern backbeat",
  ],
  bass: ["round synth bass with a bouncing groove", "clean sub bass following the chord roots", "warm electric bass pulse"],
  harmony: ["bright major-key chord loop", "uplifting four-chord progression", "lifted pre-chorus harmony"],
  textures: ["airy vocal chops", "shimmering risers into the chorus", "stacked claps", "glittering top-line sparkle"],
  extras: ["layered synth pads", "acoustic guitar strums", "string stabs", "vocal harmony stacks"],
  vocals: ["bright and catchy with a stacked chorus", "intimate verses opening into a big hook", "confident and rhythmic, doubled on the hook"],
  eras: ["radio-ready modern pop gloss", "80s-flavored synth-pop shine", "bedroom-pop intimacy", "festival-pop scale"],
  arrangement: [
    "short intro, verse, rising pre-chorus, big chorus, bridge, double final chorus",
    "hook-first intro, two verses, anthemic chorus, stripped bridge, last chorus",
    "verse and pre-chorus building to a catchy chorus with a dance break",
  ],
  mix: [
    "vocal upfront and polished, kick and bass tight, wide synth layers",
    "clean low end, glossy top end, ear-candy panned around the hook",
    "crisp transients, tight low end, chorus wider than the verse",
  ],
  endings: ["Ends on a final chorus tag and a clean stop.", "Closes with a stripped last hook.", "Fades on the repeating vocal hook."],
  claims: [],
};

/* ------------------------------------------------------------------------------------------ */
/* Ambient and cinematic                                                                       */
/* ------------------------------------------------------------------------------------------ */
const AMBIENT: Base = {
  bpm: [50, 80, 60],
  feel: "free",
  moods: ["atmospheric", "calm"],
  vocal: "none",
  leads: ["slow evolving synth pad", "sparse reverb-soaked piano", "bowed glass-like texture", "warm drifting drone"],
  drums: [
    "soft pulsing textures and distant hand percussion",
    "slow heartbeat-like soft pulse and muted mallets",
    "sparse brushed percussion appearing and fading",
  ],
  bass: ["deep slow sub drone", "warm low pad foundation", "long sustained cello-like low notes"],
  harmony: ["slowly shifting open chords", "suspended drones with gentle motion", "wide modal harmony with long release"],
  textures: ["granular shimmer", "tape-looped noise beds", "field-recording ambience", "long cavernous reverb", "gentle wind-like filtered noise"],
  extras: ["soft felt piano notes", "distant strings", "glass harmonics", "airy choir pad", "music-box bells"],
  vocals: ["wordless and distant, treated as a pad", "soft whispered layers with long reverb", "ethereal and airy, sparse and slow"],
  eras: ["expansive deep-listening production", "cinematic late-night stillness", "analog modular warmth", "spacious film-score atmosphere"],
  arrangement: [
    "slow fade-in, gradual layering, a quiet central swell, long dissolve",
    "one evolving texture that slowly opens in register and brightness",
    "three drifting movements with minimal change between them",
  ],
  mix: [
    "wide stereo field, soft transients, deep reverb with warm low end",
    "gentle dynamics, very long tails, centered sub with spacious highs",
    "layered pads wide, sparse melody close and dry",
  ],
  endings: ["Ends on a long dissolve into silence.", "Closes on a single held tone fading into reverb.", "Fades into room tone."],
  claims: [],
};

const CINEMATIC: Base = {
  ...AMBIENT,
  bpm: [60, 110, 80],
  feel: "free",
  moods: ["cinematic", "emotional"],
  vocal: "none",
  leads: ["sweeping string melody", "solo piano theme", "French horn motif", "cello lead with long vibrato"],
  drums: [
    "deep taiko-style hits and cinematic toms",
    "soft timpani rolls and low frame-drum pulse",
    "sparse ticking percussion building tension",
  ],
  bass: ["low cello and double-bass pedal", "deep sub swells", "sustained contrabass drone"],
  harmony: ["rising minor-key string chords", "heroic major-key brass harmony", "slow suspended orchestral chords"],
  textures: ["swelling string tremolos", "hall reverb on the brass", "choir pad lifts", "reversed cymbal swells"],
  extras: ["solo violin", "harp arpeggios", "woodwind countermelody", "brass swells", "celeste"],
  vocals: ["wordless choir in long phrases", "solo soprano floating over the strings", "soft whispered layers behind the theme"],
  eras: ["modern Hollywood film-score scale", "intimate indie-film score", "epic trailer-scale orchestral production", "chamber-orchestra warmth"],
  arrangement: [
    "solo piano opening, strings enter, brass and percussion swell, quiet resolution",
    "slow theme exposition, rising build, full orchestral climax, gentle outro",
    "three-part cue: quiet tension, building drive, triumphant release",
  ],
  mix: [
    "wide orchestral stage, deep hall reverb, solo instrument upfront",
    "warm strings, controlled low end, dynamic range preserved",
    "cinematic depth with front-to-back placement",
  ],
  endings: ["Ends on a final resolved chord with a long hall tail.", "Closes on a solo piano note.", "Fades out on sustained strings."],
};

const GENERAL: Base = {
  ...FOLK,
  bpm: [70, 140, 110],
  feel: "full-time",
  moods: ["warm", "expressive"],
  leads: ["warm analog synth lead", "layered piano motif", "clean electric guitar melody", "plucked mallet hook"],
  drums: [
    "steady mid-tempo kit with a soft kick, crisp snare and shaker",
    "programmed kick and snare with rolling closed hats",
    "live-feel drums with brushed snare and rim clicks",
  ],
  bass: ["round sub bass following the chord roots", "warm electric bass with a steady pulse", "soft synth bass with gentle movement"],
  harmony: ["open minor-seventh chords", "bright major-key chord loop", "suspended pads with slow movement"],
  textures: ["soft tape saturation", "airy reverb tails", "gentle stereo-wide pad bed", "subtle room ambience"],
  extras: ["light percussion accents", "soft string pad", "warm Rhodes chords", "delicate bell tones"],
  vocals: ["warm and close-mic'd", "airy and melodic with soft doubles on the chorus", "clear and expressive, lifted on the hook"],
  eras: ["warm modern studio production", "analog-tinged bedroom production", "clean contemporary polish"],
  arrangement: ["intro, verse, chorus, bridge, final chorus", "slow build into a fuller chorus", "verse and chorus alternation with a stripped bridge"],
  mix: ["vocal and lead upfront, clean low end, natural space", "balanced mix with warm mids and gentle width", "clear transients, soft top end"],
  endings: ["Ends on a clean final chord.", "Closes with a soft fade.", "Stops on the last downbeat."],
};

/* ------------------------------------------------------------------------------------------ */
/* Sub-genres                                                                                  */
/* ------------------------------------------------------------------------------------------ */
const NOT_BASS = "(?<![\\w-])";

export const NATIVE_SUBS: NativeSub[] = [
  // Bass music, club and rap: dedicated banks, never mixed with the families below.
  ...EDM_SUBS,

  // Techno
  make("melodic-techno", "Melodic techno", /\bmelodic techno\b/, TECHNO, {
    bpm: [120, 128, 124],
    moods: ["hypnotic", "emotive"],
    leads: ["arpeggiated analog synth lead", "plucked polyphonic synth motif", "evolving lead synth line with slow filter movement", "bell-like pluck melody"],
  }),
  make("minimal-techno", "Minimal techno", /\bminimal techno\b|\bmicrohouse\b/, TECHNO, {
    bpm: [122, 130, 126],
    moods: ["hypnotic", "sparse"],
    leads: ["clicky percussive synth motif", "sparse filtered stab", "short detuned blip melody", "tonal percussion loop"],
    textures: ["dry short reverbs", "tiny glitch clicks", "subtle delay feedback", "filtered noise hats"],
  }),
  make("peak-techno", "Peak-time techno", /\bpeak[- ]time techno\b|\bwarehouse techno\b|\bdriving techno\b/, TECHNO, {
    bpm: [128, 136, 132],
    moods: ["driving", "intense"],
    leads: ["rave stab riff", "screeching resonant synth line", "hypnotic acid-style loop", "pitched synth hook"],
  }),
  make("hard-techno", "Hard techno", /\bhard techno\b|\bindustrial techno\b/, TECHNO, {
    claims: ["hard techno", "industrial techno"],
    bpm: [138, 155, 145],
    moods: ["relentless", "dark"],
    leads: ["distorted rave stab riff", "metallic screech lead", "pounding acid loop", "detuned alarm-like synth"],
    drums: ["distorted, hard-hitting kick with offbeat rumble", "rapid hi-hat rolls and industrial clap layers", "pounding kick with metallic percussion hits"],
    eras: ["underground warehouse grit", "industrial machine-shop texture", "late-night rave production"],
  }),
  make("acid-techno", "Acid techno", /\bacid techno\b|\bacid\b/, TECHNO, {
    bpm: [126, 140, 132],
    moods: ["hypnotic", "trippy"],
    leads: ["squelchy resonant 303-style bassline", "rubbery acid sequence with filter automation", "screaming resonant acid lead"],
  }),
  make("techno", "Techno", /\btechno\b/, TECHNO, { bpm: [124, 134, 130] }),

  // House
  make("deep-house", "Deep house", /\bdeep house\b/, HOUSE, {
    claims: ["deep house"],
    bpm: [118, 124, 122],
    moods: ["warm", "soulful"],
    leads: ["warm Rhodes chord stabs", "soulful piano chords", "filtered jazzy keys", "smooth organ lead"],
  }),
  make("tech-house", "Tech house", /\btech house\b/, HOUSE, {
    claims: ["tech house"],
    bpm: [124, 130, 126],
    moods: ["groovy", "driving"],
    leads: ["rolling percussive bassline groove", "chopped synth stab", "minimal plucked synth riff"],
    vocals: ["short chopped vocal phrases, rhythmic and dry", "low and spoken over the groove", "repeated one-line hook"],
  }),
  make("progressive-house", "Progressive house", /\bprogressive house\b|\bmelodic house\b/, HOUSE, {
    bpm: [120, 128, 124],
    moods: ["emotive", "uplifting"],
    leads: ["arpeggiated pluck lead", "soaring analog lead", "evolving filtered synth melody"],
    arrangement: ["long gradual build, emotional breakdown, melodic peak, extended outro", "slow layering over sixteen-bar sections"],
  }),
  make("house", "House", new RegExp(`${NOT_BASS}(?<!bass |trap |future |slap |phonk |drift |afro |tropical |french |ghetto )house(?![\\w-])`), HOUSE, {
    bpm: [120, 128, 124],
  }),

  // Lo-fi, chillhop, jazz
  make("lofi", "Lo-fi hip hop", /\blo-?fi (?:jazz|hip)[- ]?hop\b|\blo-?fi beats\b|\bstudy beats\b|\bchill beats\b|\bchillhop\b|\bjazz[- ]?hop\b|\blo-?fi jazz\b|\blo-?fi\b/, LOFI, {
    bpm: [68, 92, 80],
  }),
  make("jazz", "Jazz", /\b(?:smooth |modern |cool |vocal )?jazz\b|\bbossa\b/, { ...LOFI, vocal: "none" } as Base, {
    bpm: [70, 150, 100],
    feel: "swung",
    moods: ["smooth", "late-night"],
    leads: ["expressive tenor saxophone", "muted trumpet", "piano trio comping", "warm hollow-body jazz guitar"],
    drums: ["brushed swing pattern on ride and snare", "light jazz kit with feathered kick", "soft brushes and a gentle hi-hat pedal"],
    bass: ["walking upright bass", "round warm acoustic bass lines", "melodic upright bass fills"],
    harmony: ["rich extended seventh and ninth chords", "ii-V-I changes with chromatic substitutions", "smooth modal vamps"],
    textures: ["warm club-room ambience", "soft ride-cymbal wash", "gentle brushed snare shimmer", "smoky live-room reverb"],
    extras: ["vibraphone", "muted flugelhorn", "soft upright piano", "tenor sax counter-lines"],
    eras: ["smoky jazz-club intimacy", "mid-century cool jazz warmth", "late-night studio session feel", "modern jazz-room clarity"],
    arrangement: ["head melody, solo choruses, trading fours, head out", "slow ballad head, piano solo, saxophone solo, quiet ending"],
    mix: ["live-room balance, instruments wide and natural, brushes soft", "warm acoustic mix, upright bass round, horn upfront"],
    endings: ["Ends on a lingering seventh chord.", "Closes with a soft ride tap and fading piano.", "Finishes on a held muted-trumpet note."],
  }),

  // Folk, indie, acoustic
  make("indie-folk", "Indie folk", /\bindie[- ]folk\b|\bfolk[- ]rock\b|\bchamber folk\b|\bfreak folk\b/, FOLK, {
    bpm: [80, 116, 96],
    moods: ["intimate", "wistful"],
  }),
  make("acoustic", "Acoustic singer-songwriter", /\bsinger[- ]songwriter\b|\bacoustic ballad\b|\bacoustic pop\b|\bacoustic\b(?! guitar| piano)/, FOLK, {
    bpm: [68, 104, 84],
    moods: ["intimate", "tender"],
  }),
  make("folk", "Folk", /\bfolk\b|\bamericana\b|\bbluegrass\b|\bceltic\b/, FOLK, { bpm: [76, 120, 96] }),

  // Rock
  make("punk", "Punk rock", /\bpop[- ]punk\b|\bpunk rock\b|\bpunk\b|\bhardcore\b|\bemo\b/, ROCK, {
    bpm: [150, 200, 176],
    moods: ["frantic", "rebellious"],
    leads: ["fast distorted power-chord riff", "snarling palm-muted guitar line", "bright pop-punk guitar hook"],
    drums: ["fast driving punk beat with snare on every backbeat", "pounding eighth-note hats and rapid snare fills", "tight kick-and-snare gallop"],
    vocals: ["shouted and urgent with gang vocals on the hook", "snotty and melodic with raw doubles", "fast and punchy with a shouted chorus"],
    eras: ["basement-show rawness", "90s pop-punk punch", "DIY garage production"],
  }),
  make("grunge", "Grunge", /\bgrunge\b/, ROCK, {
    bpm: [90, 130, 112],
    moods: ["gritty", "brooding"],
    leads: ["sludgy fuzzed guitar riff", "down-tuned distorted chord riff", "dissonant lead guitar lines"],
    vocals: ["raspy and strained, shifting from murmur to shout", "low brooding verses opening into a rough chorus"],
    eras: ["early-90s Seattle-style basement grit", "raw analog tape saturation"],
  }),
  make("alt-rock", "Alternative rock", /\balt(?:ernative)?[- ]rock\b|\bindie[- ]rock\b|\bpost[- ]rock\b|\bshoegaze\b|\balt\b(?! pop| r&b)/, ROCK, {
    bpm: [100, 140, 122],
    moods: ["driving", "emotive"],
  }),
  make("hard-rock", "Hard rock", /\bhard rock\b|\bclassic rock\b|\bblues rock\b|\bstoner rock\b|\barena rock\b/, ROCK, { bpm: [96, 140, 118], moods: ["swaggering", "powerful"] }),
  make("rock", "Rock", /\brock\b(?! and roll)|\brock ?n ?roll\b|\brock and roll\b/, ROCK, { bpm: [100, 150, 120] }),

  // Metal
  make("thrash", "Thrash metal", /\bthrash\b/, METAL, { bpm: [160, 210, 185], moods: ["aggressive", "relentless"] }),
  make("doom", "Doom metal", /\bdoom\b|\bsludge\b/, METAL, {
    bpm: [50, 80, 62],
    moods: ["crushing", "ominous"],
    drums: ["slow thunderous kick and snare with huge cymbal washes", "half-time drum groove with heavy toms"],
    leads: ["slow fuzzed down-tuned riff", "droning heavy guitar line", "wailing lead guitar over the riff"],
  }),
  make("metalcore", "Metalcore", /\bmetalcore\b|\bdjent\b|\bprogressive metal\b|\bprog metal\b/, METAL, { bpm: [110, 180, 150], moods: ["intense", "emotional"] }),
  make("metal", "Heavy metal", /\bheavy metal\b|\bmetal\b/, METAL, { bpm: [110, 190, 150] }),

  // Country
  make("country", "Country", /\bcountry\b|\bhonky[- ]tonk\b|\bnashville\b|\boutlaw\b/, COUNTRY, { bpm: [80, 130, 100] }),

  // Synthwave
  make("synthwave", "Synthwave", /\bsynthwave\b|\bretrowave\b|\boutrun\b|\bdarksynth\b|\bsynth ?pop\b|\b80s\b|\b1980s\b|\beighties\b/, SYNTHWAVE, { bpm: [90, 125, 108] }),

  // Pop
  make("pop", "Pop", /\bindie pop\b|\bbedroom pop\b|\bdance[- ]pop\b|\belectropop\b|\bpop\b(?!-punk)/, POP, {
    claims: ["pop", "electropop", "dance pop"],
    bpm: [90, 128, 112],
  }),

  // Ambient and cinematic
  make("dark-ambient", "Dark ambient", /\bdark (?:cinematic )?ambient\b|\bdrone\b/, AMBIENT, {
    claims: ["dark ambient", "dark cinematic ambient", "drone"],
    bpm: [40, 70, 55],
    moods: ["dark", "ominous"],
    leads: ["deep evolving drone", "low metallic resonance", "slow detuned pad"],
    textures: ["distant industrial rumble", "cavernous reverb", "scraping metallic overtones", "slow granular decay"],
  }),
  make("downtempo", "Downtempo", /\bdowntempo\b|\btrip[- ]?hop\b|\bchillout\b|\bchill ?out\b/, { ...AMBIENT, feel: "swung" } as Base, {
    claims: ["downtempo"],
    bpm: [70, 100, 88],
    feel: "swung",
    moods: ["chilled", "dreamy"],
    drums: ["lazy breakbeat with a soft kick and rim click", "dusty drum break with brushed snare", "slow shuffled hats and muted claps"],
    bass: ["warm round sub bass", "slow analog bass line", "deep dub-style bass"],
    leads: ["dreamy Rhodes melody", "airy synth lead", "muted guitar licks"],
  }),
  make("orchestral", "Orchestral film score", /\borchestral\b|\bfilm score\b|\bfilm music\b|\bsoundtrack\b|\bcinematic score\b|\bchamber orchestra\b/, CINEMATIC, {
    claims: ["orchestral", "film score"],
    bpm: [60, 120, 84],
  }),
  make("ambient", "Ambient", /\b(?:cinematic )?ambient\b/, AMBIENT, { claims: ["ambient"], bpm: [40, 80, 60] }),
];

/** Neutral bank for a genre named in the brief that the catalog does not know. */
export const GENERAL_SUB: NativeSub = make("general", "General", /$^/, GENERAL, { bpm: [70, 140, 110] });
