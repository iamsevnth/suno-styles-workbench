export type GuideStatus = "current" | "official" | "manuscript";
export type GuideGroup = "Start Here" | "Compiler Internals" | "Genre Research" | "Lyrics" | "Suno Workflow" | "Operations" | "Production Practice" | "Reference";

export interface GuideChapterMeta {
  id: string;
  title: string;
  group: GuideGroup;
  status: GuideStatus;
  note?: string;
}

export const GUIDE_CHAPTERS: GuideChapterMeta[] = [
  { id:"current-workbench", title:"Workbench v4 — Start Here", group:"Start Here", status:"current" },
  { id:"create-mode", title:"Create Mode — Official v6 Controls", group:"Start Here", status:"official" },
  { id:"reconciliation", title:"Reconciliation & Source Status", group:"Start Here", status:"current" },
  { id:"ch01", title:"01 · Deterministic Prompting", group:"Start Here", status:"manuscript", note:"Conceptual context, not a guarantee about Suno's internal audio-model behavior." },
  { id:"ch02", title:"02 · Historical Quick Start & UI Anatomy", group:"Start Here", status:"manuscript", note:"Some tabs and controls described here were removed. Follow the current v4 Quick Start for live instructions." },
  { id:"ch03", title:"03 · Brief Syntax & Parsing", group:"Compiler Internals", status:"manuscript", note:"Old parser descriptions and UI references are not necessarily identical to current v4." },
  { id:"ch06", title:"06 · Sonic Planner & Attribute Roles", group:"Compiler Internals", status:"manuscript", note:"Legacy variant names, provenance badges and lock concepts may no longer apply." },
  { id:"ch07", title:"07 · Vocal Budgeting & Voice Lexicon", group:"Compiler Internals", status:"manuscript", note:"The current renderer and exported constants are authoritative for numerical budgets." },
  { id:"ch08", title:"08 · Renderer & Character Budget", group:"Compiler Internals", status:"manuscript", note:"Three-word titles and hexadecimal prompt IDs were replaced by actual 10-digit plan seeds." },
  { id:"ch09", title:"09 · Quality Gates & Auto-Repair", group:"Compiler Internals", status:"manuscript", note:"Exact retry counts and thresholds must be verified in current generate.ts and validate.ts." },
  { id:"ch10", title:"10 · Lexicon & Sonic DNA", group:"Compiler Internals", status:"manuscript", note:"The v4 corpus-driven phrase additions are newer than this historical inventory." },
  { id:"ch04", title:"04 · Genre Ontology", group:"Genre Research", status:"manuscript", note:"The live library determines genre membership. Old weights and tier claims may be historical." },
  { id:"ch05", title:"05 · Genre Atlas & Blend Architecture", group:"Genre Research", status:"manuscript", note:"Blend-band and weighting text may describe earlier architectural concepts." },
  { id:"ch11", title:"11 · Lyrics Studio & Phonetics", group:"Lyrics", status:"manuscript", note:"The full sequence-preserving lyric rewrite is a roadmap, not a shipped v4 feature." },
  { id:"ch13", title:"13 · Historical Suno Model Guidance", group:"Suno Workflow", status:"manuscript", note:"Outdated model availability and fixed slider prescriptions appear here. Use the current official v6 chapter instead." },
  { id:"ch14", title:"14 · Song Editor Workflows", group:"Suno Workflow", status:"manuscript", note:"Check official release notes before relying on exact Suno button names and plan access." },
  { id:"ch15", title:"15 · Studio Workflows", group:"Suno Workflow", status:"manuscript", note:"Check official releases for current Studio capabilities." },
  { id:"ch16", title:"16 · Offline, History & Persistence", group:"Operations", status:"manuscript", note:"The dedicated Privacy Policy takes precedence over historical privacy descriptions." },
  { id:"ch17", title:"17 · Rights & Publishing", group:"Operations", status:"manuscript", note:"Not legal advice. Current Suno Terms and actual third-party licenses control." },
  { id:"ch18", title:"18 · Troubleshooting: 25 Scenarios", group:"Production Practice", status:"manuscript", note:"Producer heuristics, not guaranteed results." },
  { id:"ch19", title:"19 · Thirty Production Recipes", group:"Production Practice", status:"manuscript", note:"Illustrative recipes; check current prompts for validity before pasting into Suno." },
  { id:"app-a", title:"Appendix A · Genre Tables", group:"Reference", status:"manuscript", note:"Snapshot only; current genre membership comes from the v4 code." },
  { id:"app-b", title:"Appendix B · Hybrid Bass Formulas", group:"Reference", status:"manuscript", note:"Historical formula inventory, not necessarily the current profile implementation." },
  { id:"app-c", title:"Appendix C · Lexicon, Mood & Mix", group:"Reference", status:"manuscript", note:"Historical vocabulary inventory; v4 uses expanded phrase libraries." },
  { id:"app-d", title:"Appendix D · Historical Prompt Examples", group:"Reference", status:"manuscript", note:"Some example prompts exceed 975 characters. They are not paste-ready validated Workbench outputs." },
  { id:"app-e-01", title:"Appendix E · Sonic Encyclopedia 1/6", group:"Reference", status:"manuscript" },
  { id:"app-e-02", title:"Appendix E · Sonic Encyclopedia 2/6", group:"Reference", status:"manuscript" },
  { id:"app-e-03", title:"Appendix E · Sonic Encyclopedia 3/6", group:"Reference", status:"manuscript" },
  { id:"app-e-04", title:"Appendix E · Sonic Encyclopedia 4/6", group:"Reference", status:"manuscript" },
  { id:"app-e-05", title:"Appendix E · Sonic Encyclopedia 5/6", group:"Reference", status:"manuscript" },
  { id:"app-e-06", title:"Appendix E · Sonic Encyclopedia 6/6", group:"Reference", status:"manuscript" },
  { id:"app-f", title:"Appendix F · Historical Suggestion Briefs", group:"Reference", status:"manuscript", note:"Retired Skills Studio catalog descriptions have been omitted." },
];

export const GUIDE_GROUPS: GuideGroup[] = [
  "Start Here", "Compiler Internals", "Genre Research",
  "Lyrics", "Suno Workflow", "Operations", "Production Practice", "Reference",
];

export const GUIDE_ANCHOR_REDIRECTS: Record<string,string> = {
  "quick-start":"current-workbench", "briefs":"current-workbench",
  "vocals":"ch07", "better-briefs":"current-workbench",
  "how-it-works":"ch06", "coverage":"app-a",
  "quality":"ch09", "create-mode":"create-mode",
  "editor-workflows":"ch14", "studio-workflows":"ch15",
  "rights":"ch17", "faq":"current-workbench",
};
