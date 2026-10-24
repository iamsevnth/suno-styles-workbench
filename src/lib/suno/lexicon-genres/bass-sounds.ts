import { BassLexicon } from "./types.ts";

/**
 * Bass tones and movements by bass family. The first five extend the bank the
 * compiler started with; the rest give non-bass-music genres their own low end.
 */
export const BASS_SOUNDS: Record<string, BassLexicon> = {
  "808": {
    tones: [
      "distorted saturated 808",
      "clean sine-tone 808",
      "long-decay tuned 808",
      "punchy short 808 thump",
      "gritty overdriven 808",
    ],
    moves: [
      "808 glides into the downbeat",
      "octave-jumping 808 slides",
      "808 bounces that follow the kick",
      "long 808 holds under the hook",
    ],
  },
  wub: {
    tones: ["rounded LFO wobble bass", "deep filtered wub", "vowel-shaped talking bass"],
    moves: ["wobble rate changes on every bar", "talking-bass call and response", "wubs that open on the downbeat"],
  },
  growl: {
    tones: ["snarling resampled growl", "gritty FM growl", "metallic mid-bass growl"],
    moves: ["growl stabs between snare hits", "growls that rise in pitch through the bar"],
  },
  reese: {
    tones: ["detuned rolling Reese", "dark phasing Reese", "wide chorused Reese"],
    moves: ["slow Reese sweeps under the drums", "Reese notes that bend into each phrase"],
  },
  neuro: {
    tones: ["sharp neuro mid-bass", "glitchy modulated neuro stabs"],
    moves: ["fast neuro edits between drum hits", "filter-tweaked neuro rolls"],
  },
  live: {
    tones: [
      "warm electric bass guitar",
      "round fingerstyle bass",
      "deep upright bass",
      "smooth fretless bass",
      "punchy picked bass",
      "warm Moog-style synth bass",
    ],
    moves: [
      "melodic bass walking between chords",
      "laid-back bass sitting behind the beat",
      "syncopated bass answering the vocal",
      "gospel-style bass runs into the chorus",
      "steady root-note pulse",
    ],
  },
  house: {
    tones: [
      "rubbery house bassline",
      "deep sine-wave sub bass",
      "plucky analog house bass",
      "filtered organ bass",
      "acid-tinged 303 bassline",
      "warm offbeat bass stabs",
    ],
    moves: [
      "offbeat bass notes between the kicks",
      "rolling sixteenth-note bassline",
      "bass ducking under every kick",
      "octave-hopping groove bass",
      "bassline that opens with the filter",
    ],
  },
  rolling: {
    tones: ["rolling sub bass", "deep clean DnB sub", "smooth liquid bassline", "dark modulated roller bass"],
    moves: [
      "fast rolling bass under the breaks",
      "sub notes locked to the kick pattern",
      "bass that rolls on the off-beats",
    ],
  },
  logdrum: {
    tones: ["deep amapiano log drum bass", "warm pitched log drum", "punchy log drum with a slide"],
    moves: [
      "log drum bass bouncing between beats",
      "syncopated log drum slides",
      "log drum answering the piano",
      "log drum fills into each section",
    ],
  },
  latin: {
    tones: ["deep dembow sub bass", "punchy reggaeton bass", "round tropical bassline"],
    moves: [
      "bass following the dembow kick",
      "syncopated tresillo bass notes",
      "bass hits on every beat with a short tail",
    ],
  },
  dancehall: {
    tones: ["deep riddim bass", "round sound-system bass", "warm dub bassline"],
    moves: ["bass riding the one-drop", "bouncy offbeat bass phrases", "dub bass with long tails"],
  },
  synth: {
    tones: [
      "bright analog synth bass",
      "punchy pop synth bass",
      "pulsing arpeggiated synth bass",
      "warm detuned saw bass",
    ],
    moves: ["eighth-note synth bass pulse", "synth bass locking with the kick", "bouncing octave synth bass"],
  },
  drone: {
    tones: ["deep sub drone", "low cello and bass drone", "slow-swelling sub tone", "warm low pad bass"],
    moves: [
      "sub swells under each section change",
      "drone holding the root for long stretches",
      "low tones that rise with the tension",
    ],
  },
  pressure: {
    tones: [
      "heavy sub-pressure 808",
      "massive low-end sub weight",
      "distorted 808 over a deep sub layer",
      "dark tuned 808 with long sub tails",
      "chest-rattling sub bass",
      "saturated 808 with mono sub pressure",
    ],
    moves: [
      "808 holds that press under the half-time snare",
      "sub pressure swelling into each drop",
      "808 slides answering the skippy hats",
      "sustained sub weight that fills every gap",
      "808 hits locked to the kick for maximum pressure",
    ],
  },
  garage: {
    tones: ["warped garage sub", "bouncy speed-garage bass", "deep organ-style bassline", "rubbery 2-step bass"],
    moves: [
      "bass bouncing on the off-beat",
      "bassline that skips with the kick",
      "bass stabs answering the vocal chops",
    ],
  },
};
