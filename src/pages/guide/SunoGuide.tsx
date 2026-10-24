import {
  Card,
  ExternalLink,
  Prose,
  Provenance,
  ProvenanceKind,
  Section,
  Table,
} from "../../components/content/Content.tsx";
import { V6_MODELS, VARIETY_STOPS } from "../../lib/suno/v6.ts";
import { SOURCES } from "./sources.ts";

interface SettingRow {
  setting: string;
  use: string;
  why: string;
  source: ProvenanceKind;
}

const SETTINGS: SettingRow[] = [
  {
    setting: "Model",
    use: "v6 (Pro and Premier) or v6-mini (every plan)",
    why: "v6 is Suno's flagship; v6-mini is the free, faster version. v6-wild is built to be less predictable, so use it for exploration rather than for compiled prompts.",
    source: "suno",
  },
  {
    setting: "Variety",
    use: "Off",
    why: "Suno: the slider “is designed to introduce variety in your outputs by adjusting and updating your style prompts”, and setting it to 0 lets you “retain full control of your style tags”.",
    source: "suno",
  },
  {
    setting: "Max Mode",
    use: "On for keepers",
    why: "Suno: Max Mode lets v6 “spend more on getting it right” and costs more credits. Suno suggests it for songs longer than two minutes.",
    source: "suno",
  },
  {
    setting: "Exclude styles",
    use: "Anything you want kept out",
    why: "The place for negatives. Keep the Styles field positive and list unwanted sounds here instead.",
    source: "community",
  },
  {
    setting: "Personalize (My Taste)",
    use: "Off",
    why: "Keeps your listening profile from steering the take away from the compiled Styles.",
    source: "workbench",
  },
  {
    setting: "Weirdness",
    use: "20–30%",
    why: "Lower values keep the arrangement conventional and close to the prompt. Raise it when takes feel generic.",
    source: "workbench",
  },
  {
    setting: "Style Influence",
    use: "75–85%",
    why: "Higher values make the Styles text weigh more. Lower it if every take sounds the same.",
    source: "workbench",
  },
];

const TROUBLESHOOTING: [string, string, string][] = [
  [
    "Suno changed my style text",
    "Variety is above Off.",
    "Set Variety to Off. At Normal or higher, v6 rewrites the Styles field before generating.",
  ],
  [
    "The genre drifts",
    "Too many genres, or the lead genre came second.",
    "Put the main genre first and keep to two. Raise Style Influence.",
  ],
  [
    "The vocal is wrong",
    "The brief only said “vocals”.",
    "Describe the voice: gender, register, tone and delivery. Choose Vocal Gender in Suno as well.",
  ],
  [
    "I wanted an instrumental",
    "The brief did not say so.",
    "Add “instrumental”. The prompt then describes no singer at all.",
  ],
  [
    "“Prompt contained inappropriate material”",
    "Suno's moderation can refuse prompts that name well-known artists or people.",
    "Describe the sound instead. The compiler never writes artist names, but check anything you paste in by hand.",
  ],
  [
    "A sound I didn't want keeps appearing",
    "A negative in the Styles field (“no autotune”) names it.",
    "Describe the alternative in the brief (“dry natural vocal”) and put the unwanted sound in Exclude.",
  ],
  [
    "Takes all sound the same",
    "Style Influence high and Variety off is very consistent by design.",
    "Generate a new set of variations, or lower Style Influence slightly.",
  ],
  ["The song is too long or short", "Duration is set to Auto.", "Set Duration in Suno's More Options."],
];

export default function SunoGuide() {
  return (
    <>
      <Section
        id="suno-settings"
        title="Suno v6 settings"
        intro="Suno released v6, v6-wild and v6-mini on 09/09/2026 and retired every earlier model. Each recommendation is labeled with where it comes from."
      >
        <div className="flex flex-wrap gap-2">
          <Provenance kind="suno" />
          <Provenance kind="community" />
          <Provenance kind="workbench" />
        </div>
        <Table
          head={["Setting", "Use", "Why", "Source"]}
          rows={SETTINGS.map((s) => [s.setting, s.use, s.why, <Provenance key={s.setting} kind={s.source} />])}
          caption="Recommended Suno v6 settings"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {V6_MODELS.map((m) => (
            <Card key={m.id} title={m.label}>
              <p>{m.use}</p>
            </Card>
          ))}
        </div>
        <Prose>
          <p>
            Variety has five stops: {VARIETY_STOPS.map((v) => v.label).join(", ")}. A standard generation makes two
            songs for 10 credits, per Suno's v6 FAQ. Suno's own pages do not publish slider defaults or ideal values, so
            the Weirdness and Style Influence ranges above are starting points from testing compiled prompts, not Suno
            guidance.
          </p>
        </Prose>
      </Section>

      <Section id="troubleshooting" title="Troubleshooting" intro="Common problems, their usual cause, and the fix.">
        <Table head={["Problem", "Usual cause", "Fix"]} rows={TROUBLESHOOTING} caption="Troubleshooting" />
        <Prose>
          <p className="text-xs text-[var(--fg-subtle)]">
            Sources: <ExternalLink href={SOURCES.sunoBlog.href}>{SOURCES.sunoBlog.label}</ExternalLink> ·{" "}
            <ExternalLink href={SOURCES.sunoFaq.href}>{SOURCES.sunoFaq.label}</ExternalLink> ·{" "}
            <ExternalLink href={SOURCES.createGuide.href}>{SOURCES.createGuide.label}</ExternalLink> ·{" "}
            <ExternalLink href={SOURCES.moderation.href}>{SOURCES.moderation.label}</ExternalLink>
          </p>
        </Prose>
      </Section>
    </>
  );
}
