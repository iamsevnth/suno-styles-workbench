import { Card, ExternalLink, Prose, Section, Table } from "../../components/content/Content.tsx";

const HELP = {
  sliders: "https://help.suno.com/en/articles/6141377",
  faq: "https://help.suno.com/en/articles/13924481",
  newV6: "https://help.suno.com/en/articles/13924801",
  terms: "https://suno.com/terms",
  releases: "https://suno.com/release-notes",
};

const CREATE_MODE: [string, string, string][] = [
  [
    "v6",
    "Suno's flagship v6 model for Pro and Premier. Suno describes it as reliable, precise and polished: “When you know what you want, v6 helps you get there.”",
    "Use it when the musical direction is already clear and you want the strongest adherence to a deliberate Styles prompt. It is the natural destination for finished Workbench prompts.",
  ],
  [
    "v6-wild",
    "The exploratory v6 model for Pro and Premier. It is intentionally less predictable and more likely to produce varied or unexpected ideas.",
    "Use it to discover textures, arrangements or directions you might not have specified. If a wild result reveals the right idea, refine that idea into a more explicit prompt and bring it back to v6 for a controlled pass.",
  ],
  [
    "v6-mini",
    "A faster, lighter member of the v6 family available on all plans, including Free.",
    "Useful for quick iterations, prompt checks and rapid idea capture when speed matters more than using the flagship model.",
  ],
  [
    "Older Models",
    "Earlier model generations are retired in the current v6 Create experience.",
    "Treat old tutorials and screenshots cautiously when they describe model pickers or controls that no longer exist.",
  ],
  [
    "Weirdness",
    "Creative slider from Safe → Chaos. Suno documents 50% as the normal expected-result position.",
    "Move lower when you want safer, more conventional interpretations and higher when you want stranger structure, texture or musical decisions. Do not treat a narrow 20–30% range as a universal recommendation; the useful setting depends on how much deviation you want.",
  ],
  [
    "Style Influence",
    "Creative slider from Loose → Strong that controls how strongly the generation adheres to the style input.",
    "Raise it when the Styles prompt is being ignored; lower it when adherence is so strict that useful variation disappears. The right value depends on prompt clarity, not a fixed 75–85% recipe.",
  ],
  [
    "Audio Influence",
    "Creative slider from Loose → Strong that appears when an audio upload is present.",
    "It controls how strongly the generated result follows the uploaded audio. Increase it when the upload's contour or identity should dominate; reduce it when the upload should act only as a starting reference.",
  ],
  [
    "Variety",
    "v6 control that introduces variety by adjusting or updating style prompts. Suno's v6 FAQ states that setting it to 0 lets you retain full control of your style tags.",
    "Set Variety to 0 / Off when you need a Workbench Styles prompt used as written. Raise it when you intentionally want Suno to branch away from the exact style text.",
  ],
  [
    "Max Mode",
    "Higher-compute v6 option that costs more credits so the model can spend more resources on the generation.",
    "Suno recommends it especially for songs longer than two minutes, covers that should stay close to the source, style transfers and cases where vocal/style consistency across the full track matters.",
  ],
];

export default function SunoGuide() {
  return (
    <>
      <Section
        id="create-mode"
        title="Create Mode Explained"
        intro="These controls refer to suno.com/create → Songs → Advanced. The model and control descriptions below follow Suno's current Help Center rather than fixed Workbench slider recipes."
      >
        <Table head={["Model / Control", "Definition", "Practical Description"]} rows={CREATE_MODE} caption="Suno Create mode models and controls" />
        <Prose>
          <p>
            The key distinction is where variation happens. Workbench <strong>Variations</strong> generate different
            local sonic plans while preserving your brief. Suno <strong>Variety</strong> can modify the style prompt
            itself. If you want to compare Workbench prompts cleanly, keep Variety at 0 / Off and change only one input
            at a time.
          </p>
          <p>
            Official references: <ExternalLink href={HELP.sliders}>Creative Sliders</ExternalLink> ·{" "}
            <ExternalLink href={HELP.faq}>v6 FAQ</ExternalLink> ·{" "}
            <ExternalLink href={HELP.newV6}>What's new in v6</ExternalLink>.
          </p>
        </Prose>
      </Section>

      <Section
        id="editor-workflows"
        title="Song Editor Workflows"
        intro="The former Editor playbook has been folded into the Guide. Use the smallest edit that solves the audible problem rather than regenerating the whole song."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <Card title="Replace or Rewrite a Section">
            <p>
              Select the target region, replace only that section, and keep the prompt focused on the change you need.
              When lyric continuity matters, preserve syllable density and consonant timing so the replacement can sit
              naturally against the neighboring audio.
            </p>
          </Card>
          <Card title="Reorder, Add, Split or Crop">
            <p>
              Treat section boundaries as musical downbeats, not arbitrary waveform positions. After a reorder or cut,
              audition both sides of the boundary for timing, tails, lyric continuity and energy before doing another
              generation.
            </p>
          </Card>
          <Card title="Fades and Transitions">
            <p>
              Use boundary adjustment and fades to solve clicks, abrupt tails or level jumps before rewriting the music.
              If the job requires true clip overlap, automation or multitrack treatment, move the material into Studio
              instead of forcing the Song Editor to behave like a DAW.
            </p>
          </Card>
          <Card title="Stems and Extensions">
            <p>
              Separate stems when you need independent control of vocal, drums, bass or harmony. For extensions, prompt
              the new function—bar count, energy, vocal/instrumental role—and validate BPM, key and motif continuity at
              the join.
            </p>
          </Card>
        </div>
        <Prose>
          <p>
            Editor controls change frequently. Check <ExternalLink href={HELP.releases}>Suno Release Notes</ExternalLink>{" "}
            before relying on exact button names, plan gates or credit costs.
          </p>
        </Prose>
      </Section>

      <Section
        id="studio-workflows"
        title="Studio Workflows"
        intro="The former Studio playbook is now a production checklist: organize the session by musical role, make one decision at a time, and keep a known-good version before destructive changes."
      >
        <Table
          head={["Stage", "Practice", "Why"]}
          rows={[
            ["Session Setup", "Set tempo/time signature first; import only material you are authorized to use; name tracks by role.", "A stable grid and clear track roles prevent timing drift and make later stem/export decisions easier."],
            ["Generation & Takes", "Generate one musical function at a time and audition alternatives in context before committing.", "Changing one layer at a time makes it possible to hear what actually improved the record."],
            ["Static Mix", "Balance faders and pan before reaching for processing.", "A bad balance cannot be repaired efficiently with EQ or compression."],
            ["Low-End Control", "Give kick and bass distinct jobs; use sidechain or arrangement space when they collide.", "One clear owner of each low-frequency moment produces more translation and less masking."],
            ["Processing", "EQ masking first, then compression/sidechain, depth, saturation and automation as needed.", "This order solves structural problems before adding polish."],
            ["Export", "Use a full-song reference for listening, time-range export for loops/sections, and multitrack/stems for downstream DAW work.", "The export should match the next workflow rather than produce unnecessary files."],
          ]}
          caption="Studio workflow"
        />
        <Prose>
          <p>
            Before bouncing: confirm tempo/key, chosen take, clean joins, low-end separation, lead intelligibility,
            sensible stem names and a saved version you can return to. For current Studio features and formats, verify
            the <ExternalLink href={HELP.releases}>official Release Notes</ExternalLink>.
          </p>
        </Prose>
      </Section>

      <Section
        id="rights"
        title="Rights & Publishing"
        intro="Suno Workbench can help organize a rights-aware workflow, but it cannot determine ownership or provide legal advice."
      >
        <Table
          head={["Situation", "Safer Workflow", "Reason"]}
          rows={[
            ["Original / User-Owned Material", "Proceed with your own audio and lyrics; keep source files and creation records.", "You can document where the material came from and what rights you control."],
            ["Named Artist Reference", "Translate the reference into genre, era, instrumentation, groove, register, arrangement and mix language.", "High-level production attributes are more useful than making identity imitation the instruction."],
            ["Specific Song Recreation", "Write a new melody, lyrics, contour and arrangement while keeping only high-level musical attributes.", "Transformation does not automatically create permission to reproduce protected expression."],
            ["Third-Party Sample / Stem / Master", "Do not assume it is cleared. Confirm ownership, license, public-domain status or other authorization before upload or release.", "Composition, recording and performance rights can be separate."],
            ["Public Domain Claim", "Verify the relevant jurisdiction and distinguish the composition from the particular recording.", "A public-domain composition does not automatically make a modern master recording public domain."],
            ["Commercial Release", "Read the current Suno Terms for platform rights and consult qualified music/IP counsel for high-stakes releases.", "Platform contract rights and copyright/publicity law are different questions."],
          ]}
          caption="Rights-aware workflow"
        />
        <Prose>
          <p>
            Current contractual source: <ExternalLink href={HELP.terms}>Suno Terms of Service</ExternalLink>. Do not
            rely on cached screenshots or old articles for plan-specific ownership, download or commercial-use rules.
          </p>
        </Prose>
      </Section>
    </>
  );
}
