/**
 * Variation presets. Each variation of a prompt picks one, which steers its rhythm
 * donor, bass family, energy (and so arrangement and mastering) and title bank.
 * pickCompatiblePreset in plan.ts chooses among the presets whose rhythmFamily fits
 * the brief's genres.
 */
export interface VariantPreset {
  axes: string[];
  bassFamily: string;
  rhythmFamily: string;
  energy: string;
  titleBank: string[];
}

export const VARIANT_PRESETS: VariantPreset[] = [
  {
    axes: ["genre hierarchy", "rhythm", "bass"],
    bassFamily: "garage",
    rhythmFamily: "garage",
    energy: "balanced",
    titleBank: [
      "Swung Emotional Bass",
      "Garage Hybrid Lift",
      "Elastic Bass Motion",
      "Skippy Two Step",
      "London Night Swung Grid",
      "Sub-Loaded Two Step",
      "Shuffle And Chop Flow",
      "Late Night Garage Bounce",
    ],
  },
  {
    axes: ["bass architecture", "atmosphere", "arrangement"],
    bassFamily: "808",
    rhythmFamily: "trap",
    energy: "heavy",
    titleBank: [
      "Heavy 808 Pressure",
      "Monumental Trap Weight",
      "Sub Authority Drop",
      "Subsonic Atlanta Rumble",
      "Titan 808 Architecture",
      "Distorted Low-End Authority",
      "Midnight Rollers Arc",
      "Chrome Trap Bloom",
    ],
  },
  {
    axes: ["emotional profile", "vocals", "harmony"],
    bassFamily: "growl",
    rhythmFamily: "half-time",
    energy: "emotional",
    titleBank: [
      "Bittersweet Release",
      "Intimate Peak Drop",
      "Melodic Bass Bloom",
      "Prismatic Sidechain Surge",
      "Vivid Emotional Ascent",
      "Radiant Drop Explosion",
      "Lush Hybrid Rise",
      "Supersaw Bloom",
    ],
  },
  {
    axes: ["rhythm donor", "percussion", "mix"],
    bassFamily: "reese",
    rhythmFamily: "drill",
    energy: "kinetic",
    titleBank: [
      "Syncopated Street Pulse",
      "Drill Pocket Engine",
      "Sliding Bass Tension",
      "Cold Drill Pressure",
      "Gliding Slide Cadence",
      "Frostbite Sub Glide",
      "Urban Menace Rhythm",
      "Coldfront 808 Warp",
    ],
  },
  {
    axes: ["atmosphere", "sound design", "dynamic arc"],
    bassFamily: "neuro",
    rhythmFamily: "ritual",
    energy: "cinematic",
    titleBank: [
      "Cinematic Ritual Weight",
      "Processional Sub Arc",
      "Ominous Impact Field",
      "Ancient Percussion Canon",
      "Temple Sub Resonance",
      "Primal Ceremonial Descent",
      "Sacred Horn Echo",
      "Mystic Sub-Bass Horizon",
    ],
  },
  {
    axes: ["genre hierarchy", "instrumentation", "vocals"],
    bassFamily: "wub",
    rhythmFamily: "baile",
    energy: "club",
    titleBank: [
      "Kinetic Club Hybrid",
      "Physical Groove Engine",
      "Global Percussion Bass",
      "Rio Tambor Ignition",
      "Dynamic Floor Ignition",
      "Favela Bass Collision",
      "Kicking Volt Percussion",
      "Favela Rhythm Stash",
    ],
  },
  {
    axes: ["harmony", "vocals", "groove"],
    bassFamily: "808",
    rhythmFamily: "trap",
    energy: "emotional",
    titleBank: [
      "Warm Nocturnal Soul",
      "Quiet Fire Hybrid",
      "Late Night Croon",
      "Velvet Rhodes Serenade",
      "Sub-Bass Heartbeat",
      "Dusk Till Dawn Groove",
      "Neo-Soul Satin Touch",
      "Golden Hour Chords",
    ],
  },
  {
    axes: ["rhythm", "atmosphere", "mix"],
    bassFamily: "808",
    rhythmFamily: "garage",
    energy: "kinetic",
    titleBank: [
      "Skippy Two Step",
      "Garage Hybrid Lift",
      "Elastic Bass Motion",
      "South London Rhythm Box",
      "Late Night Garage Bounce",
      "Whiplash Bass Accent",
      "Silk And Shuffler",
      "Syncopated Roller Groove",
    ],
  },
  // Presets for song-form, club, world and ambient genres, so their energy and form fit the genre.
  {
    axes: ["harmony", "vocals", "arrangement"],
    bassFamily: "live",
    rhythmFamily: "song",
    energy: "emotional",
    titleBank: [
      "Open Window Chorus",
      "Paper Hearts",
      "Long Way Home",
      "Afterglow Letters",
      "Stay Gold Tonight",
      "Echoes In The Hall",
    ],
  },
  {
    axes: ["groove", "instrumentation", "mix"],
    bassFamily: "live",
    rhythmFamily: "song",
    energy: "balanced",
    titleBank: [
      "Sunday Drive",
      "Small Hours",
      "Gold Room Sessions",
      "Velvet Weather",
      "Northern Lights Song",
      "Warm Static",
    ],
  },
  {
    axes: ["groove", "bass", "arrangement"],
    bassFamily: "house",
    rhythmFamily: "club",
    energy: "club",
    titleBank: ["Basement Lights", "Strobe Theory", "Night Shift Groove", "Low Ceiling Heat", "Afterhours Signal"],
  },
  {
    axes: ["rhythm", "percussion", "atmosphere"],
    bassFamily: "rolling",
    rhythmFamily: "club",
    energy: "kinetic",
    titleBank: ["Rush Hour Rollers", "Velocity Garden", "Pulse Engine", "Sprint Of Lights", "Breakneck Bloom"],
  },
  {
    axes: ["percussion", "vocals", "groove"],
    bassFamily: "logdrum",
    rhythmFamily: "world",
    energy: "club",
    titleBank: ["Heatwave Parade", "Coastline Carnival", "Sunset Block Party", "Golden Hour Sway", "Island Pulse"],
  },
  {
    axes: ["harmony", "instrumentation", "mix"],
    bassFamily: "latin",
    rhythmFamily: "world",
    energy: "balanced",
    titleBank: ["Warm Breeze Rhythm", "Plaza Nights", "Ocean Avenue", "Palm Shadow Groove", "Sundown Serenade"],
  },
  {
    axes: ["atmosphere", "sound design", "dynamic arc"],
    bassFamily: "drone",
    rhythmFamily: "ambient",
    energy: "cinematic",
    titleBank: ["Quiet Orbit", "Snowfield Light", "Distant Harbor", "Breathing Room", "Low Cloud Hymn"],
  },
];
