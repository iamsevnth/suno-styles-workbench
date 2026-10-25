import { Card, Prose, Section, Table, TileColor } from "../../components/content/Content.tsx";
import { familyKeys, LIBRARY_STATS } from "../../lib/suno/families.ts";
import { allStyles } from "../../lib/suno/ontology.ts";
import { MAX_CHARS, MIN_CHARS } from "../../lib/suno/render.ts";

const STAGES: [string, string, string][] = [
  [
    "1. Parse",
    "Reads the input for genre order, BPM, key, moods, atmosphere, vocals, instruments, groove, bass, drums, arrangement, mix and explicit references. User-named instruments and detailed vocal language are promoted to anchors.",
    "Separating intent from prose lets the compiler preserve the musical facts that matter even when the input is messy, long or copied from an existing Styles prompt.",
  ],
  [
    "2. Classify & Plan",
    "Maps recognized genres to one or more sound families, then builds a complete sonic plan: metric feel, groove, drums, bass, bass behavior, harmony, melody, instruments, vocals, arrangement, sound design, mix and master. Each variation uses a different deterministic seed and recipe fingerprint.",
    "Family-aware planning prevents genre leakage. A cinematic score should not acquire a dubstep drop just because drop language exists elsewhere in the library, while bass music still gets the bass behaviors that define it.",
  ],
  [
    "3. Apply Profile Logic",
    "When Hybrid Bass Profile is enabled and the brief leaves gaps, the planner may use built-in hybrid formulas, bass-focused moods and a 140 BPM fallback. Explicit genres, BPM, instruments, mood and vocal instructions always outrank the profile.",
    "The profile should behave like a default taste, not a command. It can make an open brief more distinctive without overriding a specific user request.",
  ],
  [
    "4. Render",
    `Writes the plan as production prose in a controlled order and fits it to ${MIN_CHARS}–${MAX_CHARS} characters. If the text runs long, low-priority filler is removed before tempo, vocal anchors or the final instrument list. If it runs short, genre-appropriate descriptive material is added.`,
    "Suno's Styles field has a hard character ceiling. Budgeting forces the compiler to spend space on actionable production information rather than decorative repetition.",
  ],
  [
    "5. Validate & Retry",
    "Checks hard gates for character range, one integer BPM, protected-reference safety, positive wording and Styles-only content. It also prefers a distinct recipe rather than repeating another variation. Failed candidates are repaired or replanned for up to 14 attempts.",
    "Validation turns prompt quality into enforceable behavior. The compiler does not simply emit the first sentence it can build; it keeps trying until the essential rules are satisfied.",
  ],
];

const GATES: [string, string, string][] = [
  ["Character Range", `${MIN_CHARS}–${MAX_CHARS} characters.`, "Leaves a safety margin under Suno's 1,000-character Styles field while retaining enough room for rhythm, bass, harmony, voice, instruments and mix."],
  ["One Whole-Number BPM", "Exactly one integer tempo appears in the output.", "Multiple tempos create conflicting timing instructions. One explicit BPM gives the model a single rhythmic center."],
  ["No Artist Names", "Named artists and “in the style of” phrasing are not emitted.", "Production attributes are more reusable than identity imitation and reduce moderation/rights problems."],
  ["Positive Prompting", "The Styles output avoids negative commands such as avoid, don't and without.", "Positive targets describe what should be generated. Exclusions belong in Suno's separate Exclude Styles control."],
  ["Styles Only", "No lyric lines or section tags such as [Verse] appear in Styles.", "Lyrics and Styles are separate controls in Suno. Mixing them weakens both instructions."],
  ["Distinct Variations", "The compiler prefers a plan and recipe that differ from prior variations and matching history.", "Variations are useful only when they explore different production decisions instead of paraphrasing the same result."],
];

const FAMILY_LABELS: Record<string, string> = {
  afro: "Afro",
  ambient: "Ambient",
  baile: "Brazilian Funk",
  bass: "Bass Music",
  breaks: "Breaks / DnB",
  cinematic: "Cinematic",
  dancehall: "Dancehall",
  drill: "Drill",
  future: "Future Bass",
  garage: "UK Garage",
  gospel: "Gospel",
  house: "House / Techno",
  latin: "Latin",
  phonk: "Phonk",
  pop: "Pop",
  rap: "Hip-Hop / Rap",
  riddim: "Riddim",
  ritual: "Ritual Bass",
  soul: "R&B / Soul",
  trap: "Trap",
  ukg: "UKG Dubstep",
};

const COLORS: TileColor[] = ["blue", "violet", "magenta", "coral", "orange", "cyan", "green", "amber"];

function coverage() {
  const byFamily = new Map<string, Set<string>>();
  for (const genre of allStyles()) {
    for (const family of familyKeys([genre.name])) {
      if (!byFamily.has(family)) byFamily.set(family, new Set());
      byFamily.get(family)?.add(genre.name);
    }
  }
  return [...byFamily.entries()]
    .map(([family, names]) => ({ family, label: FAMILY_LABELS[family] ?? family, count: names.size }))
    .sort((a, b) => b.count - a.count);
}

export default function EngineGuide() {
  const rows = coverage();
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <>
      <Section
        id="how-it-works"
        title="How the Compiler Works"
        intro="Every stage runs locally in the browser. No AI service is called, so the output is reproducible from the same inputs and seed and remains available in the offline build."
      >
        <Table head={["Stage", "What Happens", "Why"]} rows={STAGES} caption="Compiler stages and rationale" />
      </Section>

      <Section
        id="coverage"
        title="Genre Coverage"
        intro={`${LIBRARY_STATS.genres} recognized genres are organized into ${LIBRARY_STATS.families} sound families. A hybrid can contribute to more than one family, so the chart shows family memberships rather than a mutually exclusive genre total.`}
      >
        <div className="surface rounded-[var(--r-xl)] p-4 sm:p-5 w-full">
          <div className="flex flex-col gap-3" role="img" aria-label="Responsive bar chart of genre memberships by sound family">
            {rows.map((row, index) => {
              const color = COLORS[index % COLORS.length];
              return (
                <div key={row.family} className="grid gap-2 sm:grid-cols-[minmax(8rem,0.8fr)_minmax(0,3fr)_3rem] sm:items-center">
                  <span className="text-xs font-semibold text-[var(--fg)]">{row.label}</span>
                  <div className="h-7 rounded-full bg-[var(--bg-subtle)] overflow-hidden border border-[var(--border)]">
                    <div
                      className={`h-full min-w-[0.5rem] tint tile-${color} flex items-center justify-end px-2`}
                      style={{ width: `${Math.max(5, (row.count / max) * 100)}%` }}
                    >
                      <span className="sr-only">{row.count} genre memberships</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[var(--fg-muted)] sm:text-right">{row.count}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--fg-muted)]" aria-label="Chart legend">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex gap-0.5" aria-hidden="true">
                {COLORS.slice(0, 4).map((color) => (
                  <span key={color} className={`inline-block w-2.5 h-2.5 rounded-full tint tile-${color}`} />
                ))}
              </span>
              Color separates sound families visually; it does not represent rank or quality.
            </span>
            <span>Bar length and the number at right show genre memberships in each family.</span>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Card title="Family Boundaries Protect Song Forms">
            <p>
              Song-oriented, score-oriented and world-groove families keep their own forms and bass systems instead of
              receiving automatic drop language. That is why an R&amp;B or cinematic brief can remain section-driven
              rather than being forced into build/drop architecture.
            </p>
          </Card>
          <Card title="Bass Families Keep Their Native Vocabulary">
            <p>
              Dubstep, riddim, UKG dubstep, drum and bass and related families retain wobble, growl, Reese, neuro and
              rolling low-end options where those sounds belong. Trap, drill and phonk stay centered on 808 behavior.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        id="quality"
        title="Quality Gates"
        intro="The compiler retries each variation until it passes the first five gates. A prompt that still misses one shows the issue in red on its card."
      >
        <Table head={["Rule", "Requirement", "Why"]} rows={GATES} caption="Compiler quality gates" />
        <Prose>
          <p>
            Automated tests sweep the library across multiple seeds and check these constraints, plus genre-family
            hygiene such as keeping drop terminology out of families that do not use drops and preventing bass-family
            vocabulary from leaking into unrelated styles.
          </p>
        </Prose>
      </Section>
    </>
  );
}
