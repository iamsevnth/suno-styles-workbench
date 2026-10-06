import { mulberry32, pick, pickN } from "../suno/rng.ts";
import {
  GeneratedLyrics,
  GeneratedSection,
  LyricsGenParams,
  SectionConfig,
  SectionType,
} from "./types.ts";

// Thematic rhyme & phrase banks
interface RhymeBank {
  a: string[];
  b: string[];
  c: string[];
  d: string[];
}

const RHYME_POOLS: Record<string, RhymeBank> = {
  darkBass: {
    a: [
      "In the red-line glow where the streetlights freeze",
      "Counting every breath on these cold concrete keys",
      "Shadows in the mirror cutting down the speed",
      "Down inside the canyon where the sub-bass bleeds",
      "Watch the city crumble like an autumn leaf",
      "Static in the signal, silence in the teeth",
    ],
    b: [
      "Hold the frequency until the glass begins to crack",
      "Walking through the fire with no road leading back",
      "Heavy in the chest like an 808 attack",
      "Caught between the lightning and the fading of the black",
      "Keep the dial turning on a broken audio track",
      "Standing in the epicenter, never cutting slack",
    ],
    c: [
      "Whisper to the dark before the siren starts to wail",
      "Walking on the razor's edge across a narrow trail",
      "Counting every secret that was never up for sale",
      "Steel against the shadow when the promises derail",
      "Heavy is the hammer that will drive the final nail",
      "Breathing through the static as the neon lights turn pale",
    ],
    d: [
      "Nothing left to lose when the floor begins to drop",
      "Spinning in the pocket that is never gonna stop",
      "Waiting for the second that the pressure hits the top",
      "Sweeping up the ashes of a dream that had to pop",
      "Running through the wreckage with a vision on the lock",
      "Standing on the rooftop while the sirens ring the clock",
    ],
  },
  futureEmotional: {
    a: [
      "I saw you standing where the sky turns gold",
      "Holding on to stories that were never told",
      "Even in the darkness when the night grew cold",
      "You were the only promise that I wanted to hold",
      "Letters in the water that the waves unfold",
      "Breathing in the silence as the stars turn bold",
    ],
    b: [
      "Now the chord stacks rise until we leave the floor",
      "I don't need a map if you are at the door",
      "Listen to the supersaws asking for more",
      "Everything we wanted on this glowing shore",
      "Washing all the sorrow that we carried before",
      "Every single heartbeat that we can't ignore",
    ],
    c: [
      "Take my hand before the daylight starts to fade",
      "Look at every castle in the clouds we made",
      "Never gonna hide behind the promises delayed",
      "Step into the river that we already crossed and weighed",
      "Singing in the open where we used to be afraid",
      "Every single color that will never be betrayed",
    ],
    d: [
      "And when the drop comes down like a rushing sea",
      "I feel the whole world opening in front of me",
      "Finally awake and exactly where I wanna be",
      "Nothing in the mirror but the truth set free",
      "Echoing across the sky in major key",
      "Lifting up the spirit for eternity",
    ],
  },
  trapStreet: {
    a: [
      "Sliding in the whip, late night on the dash",
      "Pocket full of vision, wasn't built for the flash",
      "Hit the corner clean, never waiting for the crash",
      "Count the whole sequence, let the snare rim smash",
      "Talk is always cheap when the pressure brings the cash",
      "Moving through the alley with the low-end stash",
    ],
    b: [
      "808 kicking with a slide in the lane",
      "Wrote it in the blood, never felt the same pain",
      "Standing in the drizzle, turning ice into rain",
      "Everything to lose, but we double up the gain",
      "Heavy is the link hanging off the silver chain",
      "Running down the track like a runaway train",
    ],
    c: [
      "Yeah they saw the come-up, now they wanna act close",
      "Step inside the circle, Strike the final pose",
      "Only real ones standing when the iron gate blows",
      "Watch the way the money and the frequency grows",
      "Coming out the concrete, blooming like a rose",
      "Keep it on the lock, that's just how the story goes",
    ],
    d: [
      "Drop the beat once, let the whole room shake",
      "Real recognize real, we don't tolerate the fake",
      "Look at every promise that we had to go and make",
      "Counting every dollar that was never for their take",
      "Wide awake at 4 AM, standing by the lake",
      "Everything we risked for the legacy at stake",
    ],
  },
  rnbSoul: {
    a: [
      "Touch of your shadow on my velvet sheets",
      "Muted Rhodes chords playing on the empty streets",
      "Listening to the rhythm as my heart repeats",
      "Gentle conversation that the morning meets",
      "Every little whisper that your soul completes",
      "Sugar in the coffee, tasting bittersweet",
    ],
    b: [
      "Tell me that you feel the low-end slow groove sway",
      "We don't need to hurry toward another day",
      "Say it in the silence that we keep at bay",
      "Drifting in the warmth that will never fade away",
      "Caught between the truth and the games we play",
      "Hold me in the pocket where the lovers stay",
    ],
    c: [
      "Baby put your phone down, listen to the rain",
      "We can wash away every memory of pain",
      "Nothing that we lost was ever lost in vain",
      "Tie me to your love like a golden chain",
      "Everything is easy when you say my name",
      "Playing in a fire that we can't explain",
    ],
    d: [
      "Close-mic whispers in the midnight air",
      "Fingerstyle guitar running through your hair",
      "Knowing that you're with me even when you're there",
      "Heaven isn't distant, it's the love we share",
      "Standing in the groove without a single care",
      "Purest kind of feeling, beautiful and rare",
    ],
  },
};

// Section templates
const SECTION_TEMPLATES: Record<
  SectionType,
  {
    tags: string[];
    performanceNotes: string[];
    defaultCount: number;
    defaultLines: number;
    openers: string[];
    phrases: string[];
  }
> = {
  intro: {
    tags: ["[Intro]", "[Intro - Ambient Bed]", "[Intro - Filtered Vocals]"],
    performanceNotes: [
      "(spoken softly, dry room)",
      "(low count in: one, two, breathe)",
      "(distant filtered vocals, reverb swell)",
      "(sparse piano and vinyl crackle)",
      "(haunting whisper over sub hum)",
    ],
    defaultCount: 1,
    defaultLines: 2,
    openers: [
      "Yeah, listen...",
      "Turn the lights down low",
      "Can you hear that sub?",
      "In the beginning...",
      "Late night, 2 AM...",
    ],
    phrases: [
      "Watch the skyline fade into the dark.",
      "Just a heartbeat and a fading spark.",
      "Step into the circle before the drums start.",
      "Feel the cold air tearing through the heart.",
      "One last breath before the ground divides.",
      "Where the bass and the holy ghost collides.",
    ],
  },
  verse: {
    tags: ["[Verse 1]", "[Verse 2]", "[Verse 3]"],
    performanceNotes: [
      "(in the pocket, rhythmic flow)",
      "(close-mic, intimate delivery)",
      "(swung cadence, leaves air for the 808)",
      "(building intensity, syllable precision)",
      "(talk-rap phrasing, conversational)",
    ],
    defaultCount: 2,
    defaultLines: 4,
    openers: [
      "First step out the door, the pavement wet with rain",
      "I remember when we used to laugh through the pain",
      "Another late flight crossing through the timezone",
      "They talk about the glory, but they leave you all alone",
      "Cold steel railings by the midnight bridge",
    ],
    phrases: [
      "Shadows stretching long across the empty avenue.",
      "Checking on the mirrors for a trace of what was true.",
      "Keep the tempo steady while the world accelerates.",
      "Nothing left behind except the dreams that came too late.",
      "Hands upon the steering wheel, knuckles turning white.",
      "Searching for a signal in the middle of the night.",
      "Footprints on the asphalt washed away before dawn.",
      "Still chasing the horizon after everyone has gone.",
    ],
  },
  buildup: {
    tags: ["[Build Up]", "[Pre-Chorus]", "[Rise]"],
    performanceNotes: [
      "(snare roll accelerates, filter opening)",
      "(rising melody, stacked harmonies)",
      "(increasing urgency, double-time hats)",
      "(vocals soaring, white-noise riser)",
    ],
    defaultCount: 2,
    defaultLines: 2,
    openers: [
      "Here it comes now, feel the tension rise",
      "Can you see the fire burning in our eyes?",
      "Hold your breath, the air is getting thin",
      "Stand right there, let the tide rush in",
    ],
    phrases: [
      "Hold the bar, then give it back / Leave a rest where the hats attack.",
      "The ceiling is shaking, the floor gives way / We got ten seconds left to say what we say.",
      "Count it down from four to one / Look what we've become.",
      "Higher and higher until the speakers blow / Ready or not, let it go!",
    ],
  },
  drop: {
    tags: ["[Drop]", "[Bass Drop]", "[Drop - High Octane]"],
    performanceNotes: [
      "(explosive bass drop - 808 glide and growls)",
      "(monumental sub impact, half-time heavy drums)",
      "(vocal chop repeats, crowd energy)",
      "(silence gap, then full drop)",
    ],
    defaultCount: 2,
    defaultLines: 2,
    openers: [
      "LET IT DROP!",
      "FOLD THE FLOOR!",
      "TAKE IT DOWN!",
      "BREAK THE FRAME!",
    ],
    phrases: [
      "HOLD THAT BASS! / (vocal chop: hold it, hold it!)",
      "DOWN TO THE WIRE! / (808 slide screams through the floor)",
      "CAN YOU FEEL IT NOW? / (wobble answers the open snare)",
      "NEVER BACK DOWN! / (crowd chant: HEY! HEY! HEY!)",
    ],
  },
  chorus: {
    tags: ["[Chorus]", "[Chorus - Anthemic]", "[Chorus - Full Lift]"],
    performanceNotes: [
      "(anthemic belt, wide stereo harmonies)",
      "(soaring topline, crowd chant on the backbeat)",
      "(emotional release, supersaws wide)",
      "(layered doubles, stadium reverb)",
    ],
    defaultCount: 2,
    defaultLines: 4,
    openers: [
      "Say my name across the sky tonight",
      "We were made to burn in the blinding light",
      "Hold on to the frequency that sets us free",
      "I found redemption in the melody",
    ],
    phrases: [
      "We don't need tomorrow when the midnight calls.",
      "Writing our redemption on the stadium walls.",
      "Take my hand and never look behind.",
      "Leave the heavy sorrow of the past in mind.",
      "Every single heartbeat singing in the clear.",
      "Nothing left to fear when the bass is here.",
      "Lifting up our voices till the dawn breaks in.",
      "This is where the real life will begin.",
    ],
  },
  breakdown: {
    tags: ["[Breakdown]", "[Breakdown - Stripped]", "[Acoustic Break]"],
    performanceNotes: [
      "(drums cut out, solo electric guitar or piano)",
      "(intimate whisper, dry room presence)",
      "(sub rumble underneath, fragile vocal)",
      "(atmospheric filter closes down)",
    ],
    defaultCount: 1,
    defaultLines: 2,
    openers: [
      "Strip it down to the wire...",
      "Just you and me in the quiet...",
      "Listen to the silence breathe...",
      "When the smoke clears away...",
    ],
    phrases: [
      "All the noise is gone, and the truth remains.",
      "Nothing in our hands but the love in our veins.",
      "Just a single note floating in the space.",
      "Seeing every contour of your face.",
    ],
  },
  bridge: {
    tags: ["[Bridge]", "[Bridge - Key Shift]", "[Emotional Pivot]"],
    performanceNotes: [
      "(dramatic vocal climb, unexpected harmonic shift)",
      "(soulful ad-libs building to high belt)",
      "(half-time swagger, storytelling peak)",
      "(stacked vocal counter-melody)",
    ],
    defaultCount: 1,
    defaultLines: 4,
    openers: [
      "And if the night is a tunnel, I've learned the walls",
      "They said we'd break, but we caught the falls",
      "Look at every scar that we turned to gold",
      "Every little story that our heart has told",
    ],
    phrases: [
      "If the bass is a question, I answer in falls.",
      "Standing in the echo of the empty halls.",
      "I won't apologize for reaching for the sun.",
      "After all the battles that we fought and won.",
      "Now the curtain's lifting on the final scene.",
      "Stronger than we ever could have dreamed or been.",
    ],
  },
  outro: {
    tags: ["[Outro]", "[Outro - Fade to Sub]", "[Outro - Spoken Word]"],
    performanceNotes: [
      "(drums fade, lingering synth tails)",
      "(whispered title motif repeating to fade)",
      "(solo 808 thud into silence)",
      "(vocal delay throws into the dark)",
    ],
    defaultCount: 1,
    defaultLines: 2,
    openers: [
      "Yeah... let it ride out...",
      "Fade to black...",
      "Just the sub left...",
      "Until next time...",
    ],
    phrases: [
      "Hold the last note till the morning breaks.",
      "Every single choice that a dreamer makes.",
      "Silence in the speaker, peace in the chest.",
      "Let the heavy heartbeat finally rest.",
    ],
  },
};

/**
 * Parses user draft lyrics to extract lines, detect existing sections,
 * or preserve user's original words.
 */
function parseDraftLyrics(draft?: string): {
  userLines: string[];
  userStanzas: string[][];
  hasSectionTags: boolean;
} {
  if (!draft || !draft.trim()) {
    return { userLines: [], userStanzas: [], hasSectionTags: false };
  }

  const rawLines = draft
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => Boolean(l));

  const hasSectionTags = rawLines.some((l) => /^\[.*\]$/.test(l));
  const userLines = rawLines.filter((l) => !/^\[.*\]$/.test(l));

  // Break into stanzas
  const userStanzas: string[][] = [];
  let current: string[] = [];
  for (const line of rawLines) {
    if (/^\[.*\]$/.test(line)) {
      if (current.length) {
        userStanzas.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length) userStanzas.push(current);

  return { userLines, userStanzas, hasSectionTags };
}

/**
 * Main Lyrics Generator / Remixer / Extender function
 */
export function generateLyrics(params: LyricsGenParams): GeneratedLyrics {
  const seed = params.seed ?? (Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0;
  const rng = mulberry32(seed);

  const theme = params.theme.trim() || "Midnight Drive Through the Heavy Bass City";
  const genre = (params.genre || "Hybrid Bass / Trapstep").toLowerCase();
  const delivery = params.delivery || "Sung Melodic to Belt";
  const scheme = params.rhymeScheme || "AABB";
  const includeTags = params.includePerformanceTags !== false;

  // Pick rhyme pool based on genre & theme
  let rhymePoolKey = "darkBass";
  if (genre.includes("future") || genre.includes("melodic") || genre.includes("pop")) {
    rhymePoolKey = "futureEmotional";
  } else if (genre.includes("r&b") || genre.includes("soul") || genre.includes("lo-fi")) {
    rhymePoolKey = "rnbSoul";
  } else if (genre.includes("trap") || genre.includes("drill") || genre.includes("rap")) {
    rhymePoolKey = "trapStreet";
  }
  const rhymePool = RHYME_POOLS[rhymePoolKey] ?? RHYME_POOLS.darkBass;

  // Check draft lyrics
  const draftInfo = parseDraftLyrics(params.draftLyrics);
  let userStanzaIdx = 0;

  // Build ordered sequence of song sections based on user's modular sequence or structure configuration
  const sections: GeneratedSection[] = [];

  interface PlannedSection {
    type: SectionType;
    index: number;
    lines: number;
    customLabel?: string;
  }

  const plan: PlannedSection[] = [];

  if (params.sectionSequence && params.sectionSequence.length > 0) {
    // Count occurrences of each section type across the sequence for accurate numbering
    const totalTypeCounts: Record<string, number> = {};
    for (const item of params.sectionSequence) {
      totalTypeCounts[item.type] = (totalTypeCounts[item.type] || 0) + 1;
    }

    const currentTypeIndices: Record<string, number> = {};
    for (const item of params.sectionSequence) {
      currentTypeIndices[item.type] = (currentTypeIndices[item.type] || 0) + 1;
      plan.push({
        type: item.type,
        index: currentTypeIndices[item.type],
        lines: item.lines,
        customLabel: item.customLabel,
      });
    }
  } else {
    // Fallback to default structure map
    const structure = params.structure || {
      intro: { enabled: true, count: 1, lines: 2 },
      verse: { enabled: true, count: 2, lines: 4 },
      buildup: { enabled: true, count: 2, lines: 2 },
      drop: { enabled: true, count: 2, lines: 2 },
      chorus: { enabled: true, count: 2, lines: 4 },
      breakdown: { enabled: true, count: 1, lines: 2 },
      bridge: { enabled: true, count: 1, lines: 4 },
      outro: { enabled: true, count: 1, lines: 2 },
    };

    // Intro
    if (structure.intro.enabled) {
      for (let i = 0; i < structure.intro.count; i++) {
        plan.push({ type: "intro", index: i + 1, lines: structure.intro.lines });
      }
    }

    const maxCycles = Math.max(
      structure.verse.enabled ? structure.verse.count : 1,
      structure.chorus.enabled ? structure.chorus.count : 1
    );

    let verseIssued = 0;
    let buildupIssued = 0;
    let dropIssued = 0;
    let chorusIssued = 0;

    for (let c = 0; c < maxCycles; c++) {
      if (structure.verse.enabled && verseIssued < structure.verse.count) {
        verseIssued++;
        plan.push({ type: "verse", index: verseIssued, lines: structure.verse.lines });
      }
      if (structure.buildup.enabled && buildupIssued < structure.buildup.count) {
        buildupIssued++;
        plan.push({ type: "buildup", index: buildupIssued, lines: structure.buildup.lines });
      }
      if (structure.drop.enabled && dropIssued < structure.drop.count) {
        dropIssued++;
        plan.push({ type: "drop", index: dropIssued, lines: structure.drop.lines });
      }
      if (structure.chorus.enabled && chorusIssued < structure.chorus.count) {
        chorusIssued++;
        plan.push({ type: "chorus", index: chorusIssued, lines: structure.chorus.lines });
      }
    }

    if (structure.breakdown.enabled) {
      for (let i = 0; i < structure.breakdown.count; i++) {
        plan.push({ type: "breakdown", index: i + 1, lines: structure.breakdown.lines });
      }
    }

    if (structure.bridge.enabled) {
      for (let i = 0; i < structure.bridge.count; i++) {
        plan.push({ type: "bridge", index: i + 1, lines: structure.bridge.lines });
      }
    }

    if (structure.chorus.enabled && chorusIssued < structure.chorus.count) {
      chorusIssued++;
      plan.push({ type: "chorus", index: chorusIssued, lines: structure.chorus.lines });
    }

    if (structure.outro.enabled) {
      for (let i = 0; i < structure.outro.count; i++) {
        plan.push({ type: "outro", index: i + 1, lines: structure.outro.lines });
      }
    }
  }

  // Generate each planned section
  const totalOfEachType: Record<string, number> = {};
  for (const p of plan) {
    totalOfEachType[p.type] = (totalOfEachType[p.type] || 0) + 1;
  }

  for (const item of plan) {
    const sType = item.type;
    const tpl = SECTION_TEMPLATES[sType];
    const targetLineCount = Math.max(1, item.lines || tpl.defaultLines);

    // Label & Tag
    let label = item.customLabel;
    if (!label) {
      if (totalOfEachType[sType] > 1) {
        label = `${capitalize(sType === "buildup" ? "Build Up" : sType)} ${item.index}`;
      } else {
        label = capitalize(sType === "buildup" ? "Build Up" : sType);
      }
    }
    const tag = `[${label}]`;

    // Performance note
    let performanceNote: string | undefined;
    if (includeTags) {
      performanceNote = pick(rng, tpl.performanceNotes);
    }

    // Check if user draft lyrics can be incorporated
    let lines: string[] = [];

    if (draftInfo.userStanzas.length > userStanzaIdx) {
      const stanza = draftInfo.userStanzas[userStanzaIdx];
      userStanzaIdx++;
      // If stanza has enough lines, use it
      if (stanza.length >= targetLineCount) {
        lines = stanza.slice(0, targetLineCount);
      } else {
        // Expand user stanza with rhyming continuations
        lines = [...stanza];
        const needed = targetLineCount - stanza.length;
        const extra = generateLinesForSection(sType, needed, rhymePool, scheme, theme, rng);
        lines.push(...extra);
      }
    } else {
      // Generate fresh lines for this section
      lines = generateLinesForSection(
        sType,
        targetLineCount,
        rhymePool,
        scheme,
        theme,
        rng,
        item.index
      );
    }

    sections.push({
      type: sType,
      label,
      tag,
      performanceNote,
      lines,
    });
  }

  // Format full lyrics text
  const fullTextBlocks: string[] = [];
  let totalLines = 0;

  for (const sec of sections) {
    let block = sec.tag;
    if (sec.performanceNote) {
      block += ` ${sec.performanceNote}`;
    }
    block += "\n" + sec.lines.join("\n");
    fullTextBlocks.push(block);
    totalLines += sec.lines.length;
  }

  const fullText = fullTextBlocks.join("\n\n");

  // Title calculation
  const titleWords = theme.split(/\s+/).slice(0, 5).join(" ");
  const title = capitalizeWords(titleWords || "Untitled Suno Track");

  return {
    title,
    theme,
    sections,
    fullText,
    totalLines,
    seed,
  };
}

function generateLinesForSection(
  type: SectionType,
  count: number,
  bank: RhymeBank,
  scheme: string,
  theme: string,
  rng: () => number,
  index: number = 1
): string[] {
  const tpl = SECTION_TEMPLATES[type];
  const out: string[] = [];

  if (type === "drop") {
    // Drop is usually punchy chants and heavy bass cues
    const lead = pick(rng, tpl.openers);
    out.push(lead);
    if (count > 1) {
      out.push(pick(rng, tpl.phrases));
    }
    while (out.length < count) {
      out.push(pick(rng, bank.b));
    }
    return out.slice(0, count);
  }

  if (type === "intro") {
    const lead = pick(rng, tpl.openers);
    out.push(lead);
    while (out.length < count) {
      out.push(pick(rng, tpl.phrases));
    }
    return out.slice(0, count);
  }

  if (type === "buildup") {
    const lead = pick(rng, tpl.openers);
    out.push(lead);
    while (out.length < count) {
      out.push(pick(rng, tpl.phrases));
    }
    return out.slice(0, count);
  }

  if (type === "breakdown" || type === "outro") {
    const lead = pick(rng, tpl.openers);
    out.push(lead);
    while (out.length < count) {
      out.push(pick(rng, tpl.phrases));
    }
    return out.slice(0, count);
  }

  // Verses and Choruses follow rhyme scheme
  if (scheme === "AABB") {
    const pairA = pickN(rng, bank.a, 2);
    const pairB = pickN(rng, bank.b, 2);
    const pairC = pickN(rng, bank.c, 2);
    const pairD = pickN(rng, bank.d, 2);
    const linesPool = [...pairA, ...pairB, ...pairC, ...pairD];
    return linesPool.slice(0, count);
  } else if (scheme === "ABAB") {
    const a1 = pick(rng, bank.a);
    const b1 = pick(rng, bank.b);
    const a2 = pick(rng, bank.a.filter((x) => x !== a1));
    const b2 = pick(rng, bank.b.filter((x) => x !== b1));
    const linesPool = [a1, b1, a2, b2];
    while (linesPool.length < count) {
      linesPool.push(pick(rng, bank.c), pick(rng, bank.d));
    }
    return linesPool.slice(0, count);
  }

  // Freeform or default
  const linesPool = [
    ...pickN(rng, bank.a, 2),
    ...pickN(rng, bank.b, 2),
    ...pickN(rng, bank.c, 2),
    ...pickN(rng, bank.d, 2),
  ];
  return linesPool.slice(0, count);
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function capitalizeWords(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length > 2 ? capitalize(w) : w))
    .join(" ");
}
