# Suno Workbench: Advanced Prompt Engineering for Bass Music and Hybrid EDM

## A research-backed technical thesis and implementation specification

**Version:** 1.0  
**Verified:** November 23, 2026  
**Primary platform:** Suno V6 family and connected Suno MCP workflows  
**Purpose:** Inform the next generation of Suno Workbench's prompt compiler, lyrics coordination, remix/mashup planner, audio auditor, and experiment engine.

> **Evidence convention.** **[OFFICIAL]** means Suno's published documentation; **[CONNECTED]** means the capabilities or constraints exposed by the authenticated Suno connector; **[MUSIC]** means established production or music-theory guidance; and **[HEURISTIC]** means a recommendation to test rather than a guaranteed model behavior. Details that change by model, subscription, or operation must be revalidated before deployment.

## Abstract

Suno's V6 generation family can follow increasingly detailed musical language, combine references, perform source-aware transformations, and expose additional controls. That improvement does not make an adjective-heavy style prompt an accurate production specification. Effective prompting requires explicit musical ownership: one style establishes the rhythmic backbone, another determines harmony or timbre, another supplies a local accent, and specific elements remain recognizable from section to section. Controls alter adherence, surprise, source guidance, and generation effort, but they are neither independent audio mixing faders nor a replacement for a coherent prompt.

This report develops an implementable six-part grammar for Identity, Groove, Musical Identity, Arrangement, Production, and Constraints. It extends the framework across trap, trapstep, future bass, melodic and deep dubstep, riddim, wobble bass, color bass, tearout, UK garage, speed garage, bassline, bass house, drum and bass, jungle, breaks, halftime, and related hybrid genres. It also describes how to coordinate lyrics and vocal delivery, how to preserve identity in covers and mashups, how to test rhythmic sophistication, how to audit generated audio against intended outcomes, and how to make Suno Workbench produce verifiable, mode-specific instructions rather than untestable promises.

**Thesis:** Prompt quality is better modeled as coherent musical relationships plus well-defined generation context, not as prompt length, keyword count, or unconditional slider maximization. The tool should compile a structured musical brief into several mode-specific outputs and use generated audio to update future recommendations.

## 1. Executive conclusions and scope

1. **Treat the style field as a compact musical specification.** The most useful statements name the instrument or rhythmic element, its role, its relationship to other material, and the section in which it changes.
2. **Declare a dominant genre and assign roles to secondary genres.** For example, trap owns the backbeat, UK garage provides hat shuffle, and deep dubstep provides wobble-bass calls; the labels are not equally weighted synonyms.
3. **Preserve a recurring signature.** A four-note pluck, chopped vocal figure, chord rhythm, bass motif, or drum fill should recur and develop across sections.
4. **Describe rhythmic complexity as an arrangement.** Main groove, build, first drop, breakdown, and final drop need distinct but connected drum and bass roles. 'Dense drums' alone is not enough.
5. **Keep lyrics, vocal settings, source audio, and styles semantically aligned.** A text label such as 'instrumental' should not be treated as equivalent to an instrumental mode switch when vocals or lyrics are also supplied.
6. **Treat slider values as experimental settings.** Weirdness affects unpredictability; Style Influence steers adherence to text; Audio Influence steers source or voice conditioning where supported; Variety reinterprets style tags; Max Mode expends extra compute for consistency. They are not summed or mixed as percentages.
7. **Separate compilation from evaluation.** Static linting detects contradictory requests and impossible interface combinations; listening and timing analysis test whether the recorded track delivered them.
8. **Keep an evidence register.** Suno Help, release notes, connected-tool signatures, and local audio observations are different types of evidence. A future product update can invalidate a platform rule without invalidating the six-part music-design grammar.

This report is general to modern electronic bass music, not restricted to one artist, library sample, tempo, or personal taste. The earlier library audit is useful as a concrete diagnostic example, not a representative study of all EDM.

## 2. Current execution capabilities and operational boundaries

### 2.1 Verified connected account and model selection

**[CONNECTED]** The authenticated account is on Suno's Premier plan and currently reports access to `v6`, `v6-mini`, and `v6-wild`, along with custom and simple generation, covers, extensions, mashups, audio uploads, downloads, advanced controls, stems, MIDI, voices, and speech. The tools also provide read-only library retrieval, listening, audio-analysis, lyric alignment, playlist/workspace actions, and audio editing. This is a capability observation, not authorization to spend credits or change the library automatically.

**[OFFICIAL]** V6 is the more precise general model; V6 Wild favors unusual outcomes; V6 Mini is faster and suitable for exploratory passes. Suno documents up to eight minutes for these models in its product. The connected `audio-create` operation instead accepts a duration *target* of 15-360 seconds and can impose a hard cap. Suno Workbench should maintain separate `platform_capability` and `connector_capability` records, rather than falsely using one limit for every route.

| Execution class | What can be requested | Important constraints or cautions |
|:--|:--|:--|
| Simple generation | Natural-language description; optional eligible reference songs | Connector `description` is at most 3,000 characters; mixing it with caller-supplied `style`/custom `lyrics` is invalid. |
| Custom generation | Style, original/custom lyrics, title, instrumental flag, model and controls | Connector `style` at most 1,000 characters; `lyrics` at most 5,000. Custom mode and Simple mode must be routed separately. |
| Advanced controls | Weirdness, Style Influence, Variety, Audio Influence where valid, negative/excluded styles | Controls use values 0-1 except Variety 0-4. Available input fields differ by operation. |
| Vocal controls | Male/female gender choice on supported creation routes; registered voice choice | `vocal_gender` exists on `audio-create`, not every cover/mashup route; `voice_id` takes precedence and implies singing. |
| Covers | Transform one completed permitted source using a new style | Source influence and style influence coexist; dedicated cover route does not automatically carry original lyrics when omitted. |
| Extends | Continue a completed source from a chosen second | Extension audio is a continuation clip; assemble or join to produce a whole song. |
| Dedicated mashups | Fuse two complete, permitted source clips | Exactly two source parents. Audio Influence pertains to resemblance to both collectively; no verified per-parent mix faders. |
| V6 reference requests | Describe a source-based task using up to ten reference song IDs in connected Simple mode | The task can include mashup, sample, remaster, restyle or targeted edit; this is not the dedicated two-parent mashup endpoint. |
| Analysis and listening | BPM, key, meter, beat and section map, genre/instrument tags, vocal notes, textual listening answers | Model estimates and tagging errors are possible; half-time and double-time readings need normalization. |
| Lyric alignment | Sung-word time spans | Best effort; imperfect or unavailable for some clips, especially uploads or indistinct vocals. |
| Stems and MIDI | Split completed audio; transcribe owned tracks to MIDI | These may consume credits. Do not request expensive operations by default during a read-only audit. |
| Studio / Editor | Edit sections, arrange clips, extract stems, work with MIDI, process audio | Native Studio provides effects and fine timing controls; an ordinary style prompt does not supply equivalent sample-accurate editing. |

### 2.2 Actual field boundaries for tool integration

The connected creation schema exposes `style <= 1000`, `negative_style <= 1000`, `lyrics <= 5000`, `description <= 3000`, and duration 15-360 seconds. It returns two clips per ordinary signed-in generation call. Slider values use decimals between 0 and 1. Variety is an integer: 0=Off, 1=Normal, 2=High, 3=Extra, 4=Max. A value of zero means an actual setting, not 'unset'. Omit a control to allow the route's default. **Never assume a 1,000-character field is best filled to 1,000 characters.**

A nuance worth coding directly: on the standard custom `audio-create` path, `audio_influence` is only valid with an eligible voice ID. For ordinary uploaded or source-song conditioning, use the appropriate dedicated cover, mashup, extension, or V6 reference workflow. A universal interface that indiscriminately sends Audio Influence with every custom generation can fail validation.

For targeted source edits, avoid extraneous fields that switch the operation into whole-song regeneration. The V6 reference workflow can reinterpret an edit instruction more broadly if the request contains new duration, instrumental, or vocal-gender constraints. Route a request that says 'replace only the second drop' differently from 'rebuild the entire song in a new genre'.

### 2.3 Evidence and version policy

Store source and check date for mutable platform facts, e.g., `model_names`, `slider_labels`, `max_mode_availability`, `field_lengths`, `credit_rules`, and `remix_permissions`. Treat genre timing conventions and musical relationships as your own maintained reference library, separately versioned from the Suno API. Any unsupported claim about guaranteed bar counts, sample-accurate 32nd hats, exact frequency balance, or perfect key adherence should produce a warning rather than a guarantee.

## 3. The six-part prompt specification

The compiler should accept a structured, validated object before writing prose. The six sections serve different purposes; assigning every genre tag or instrument to all six creates unnecessary repetition.

### Part 1 - Identity: who owns the record?

Include the dominant genre, one or two subordinate influences with explicit functions, BPM or rhythmic feel, tonic/mode if necessary, primary mood, and artistic energy. Prefer `Trap-led bass music with future-bass harmony and dubstep drop timbres` over `Trap, EDM, future bass, dubstep, riddim, UKG, festival, psychedelic`. Do not specify a key if source fidelity requires maintaining the original pitch unless transposition is intentional.

**Mandatory fields:** `primary_genre`, `primary_groove_role`, `secondary_styles[]`, `tempo`, `meter`, `tonal_center`, `mood`. **Optional:** `harmonic_color`, `sound_era`, `energy_target`, `is_instrumental`.

### Part 2 - Groove: how does the rhythm work?

Name the backbeat and kick relationship first, then hats, percussion, swing, fills, and genre-derived deviations. Define the drum machine or acoustic kit as a timbral requirement. For modern trap, a good clause is: `A half-time electronic snare anchors offset 808 kicks, closed 808 hats in 16ths with short 32nd ratchets before phrase turns, and gated open-hat accents on selected offbeats.` A contrasting garage clause might keep shuffled two-step hats and ghost snares through a bass-heavy drop. Avoid demanding every subdivision constantly and simultaneously.

**Mandatory fields:** `backbeat`, `kick_placement`, `hat_timbre`, `hat_base_grid`, `hat_fills`, `open_hat_role`, `swing`, `syncopation`. **Optional:** `ghost_notes`, `breakbeat_source`, `drum_transition_strategy`, `fill_frequency`.

### Part 3 - Musical identity: what will the listener remember?

Assign one primary hook with a defined instrument and shape, then specify how bass and harmony respond. A hook may be a pitch contour, vocal sample, bass rhythm, sound-design motif, or chord rhythm; it need not be a large synth melody. For low-end design, separate kick impact, the note-bearing 808/sub, and FM/Reese mid-bass movement. Explain whether elements trade places or layer. `One descending three-note glass-pluck hook repeats above long mono sub notes; two-beat FM growls answer only in the gaps` is actionable. `Massive, crazy, complex, dark bass` is not.

**Mandatory fields:** `hook_instrument`, `hook_signature`, `hook_recurrence`, `bass_sub_role`, `bass_mid_role`, `call_response`. **Optional:** `chord_palette`, `vocal_chop_source`, `countermelody`, `tonal_risk`.

### Part 4 - Arrangement: what changes, and why?

The baseline six-part arc is `intro -> main/verse -> build -> drop -> breakdown -> developed final drop`. It should adapt to each genre: riddim may use call-and-response drop cycles; liquid DnB a rolling progression; house a long groove progression; UKG short phrase variations; breakbeat a chopped break and secondary groove. Describe development, not just increasing size. For example, `first drop presents the four-note hook and short bass answers; breakdown removes the kick; final drop revoices the hook under displaced bass accents and a changed hat pattern`.

**Mandatory fields:** `sections[]`, `section_drums`, `section_bass`, `section_hook`, `transition`, `final_drop_delta`. **Optional:** `phrase_bars`, `break_duration`, `vocal_entry`, `duration_target`.

### Part 5 - Production: a few consequential mixing choices

Prefer two or three independent mix priorities such as `mono sub below the bass harmonics`, `short dry electronic snare transients`, `wide delayed chord tails that duck behind the kick`. Do not overload the Styles field with mastering buzzwords. Use transient separation and instrument occupancy as relationships. A common failure is demanding 'huge bass, huge 808, huge low end, massive supersaws, thick distortion, full vocals' all at once without specifying spectral or sectional handoffs.

**Mandatory fields:** `low_end_priority`, `transient_priority`, `width_or_space_priority`. **Optional:** `distortion_band`, `reverb_placement`, `ducking`, `dynamic_contrast`, `stereo_compatibility`.

### Part 6 - Constraints: what must stay fixed or must not appear?

Keep hard exclusions in the dedicated Exclude/negative-style field where available: `acoustic drum kit, live acoustic cymbals, cinematic orchestration` when unwanted. Keep positive invariants in the musical brief: `recognizable vocal hook remains throughout`, `garage shuffle survives the drop`, `consistent half-time backbeat`. Use negative terms sparingly, because excessive exclusions can become their own ambiguity. Do not block all 'cymbals' while demanding electronic closed and open hats.

**Mandatory fields:** `must_preserve[]`, `must_exclude[]`, `mode_constraints`, `source_rights_state`. **Optional:** `forbidden_timbres`, `target_length`, `strict_character_budget`.

### 3.1 Recommended output order and saturation policy

Compile in this order: identity and ownership; core groove; melodic/bass interaction; section transformation; two or three production consequences. Send excluded styles and vocal selection through their own controls instead of spending Styles tokens on repeated warnings. Choose brevity according to task: 350-600 characters for a high-level creative sketch, about 600-850 for a detailed controlled hybrid, and up to the tool's 1,000-character ceiling only when every clause adds an independent observable musical action. These lengths are **[HEURISTIC]**, not Suno's published quality optimum. Respect any explicitly requested strict range, such as 925-975 characters, only after ensuring semantic coherence.

Create an `instruction_budget` for each field; when the prompt is full, remove duplicate adjectives, decorative moods, speculative mixing guarantees and low-priority instruments before removing the groove anchor, hook relationship or drop progression. A simple redundancy test is: if deleting a phrase would not change the expected audible result, it is a candidate for removal.

## 4. Genre ontology and hybrid hierarchy across bass-oriented EDM

**[MUSIC / HEURISTIC]** The BPM spans below are conventional ranges for planning, not fixed rules or a list of officially supported Suno genres. Half-time and double-time perceptions make some tempo comparisons ambiguous. The production role is more important than the label.

| Family | Typical planning tempo | Core rhythmic or musical signature | Valuable hybrid role |
|:--|:--|:--|:--|
| Trap / EDM Trap | ~130-160 BPM, often half-time | Half-time snare, 808 bass, syncopated kicks, hat rolls | Primary drum foundation, low-end glide, stop-start transitions |
| Trapstep | ~135-155 | Trap drums with dubstep-style bass drop | Trap controls groove; growls/FM answer rhythmic gaps |
| Future Bass | ~130-160 (varies widely) | Colorful/bittersweet chords, strong hook, swelling sidechain motion | Harmonic identity, melodic drop, wide chords |
| Melodic Dubstep | ~135-150 | Emotional chords plus half-time sub-heavy drums | Melodic drop architecture with bass contrast |
| Deep / 140 Dubstep | ~138-142 | Spacious half-time pressure, sub emphasis, sparse syncopation | Negative space, dub chord echo, sub identity |
| Riddim / repetitive bass dubstep | Commonly ~140 | Repetitive quarter/eighth-note wobble calls, syncopated riddim phrasing | Repetitive bass motif, one-bar call/response |
| Psychedelic / Wobble Dubstep | ~135-145 | Filter-swept resonant wobbles, fluid rhythmic bass | Bass timbre and articulations, not necessarily funk chords |
| Tearout / aggressive Dubstep | ~140-155 | Hostile transient design, distorted bass impacts, tight rests | Drop aggression and accented attack design |
| Color Bass | Often ~140-160 | Resonant, harmonically bright bass modulation | Tonal bass color and chord-linked sound design |
| UK Garage / 2-step | ~130-142 | Skipping kicks, snare ghosts, swung hats, offbeat rhythmic motion | Core groove or upper-percussion countergroove |
| Speed Garage / Bassline | ~132-145 | Driving four-on-floor or shuffled patterns, bass stabs and swing | Rolling low-end rhythm and club movement |
| Bass House / Future House | ~122-132 | Four-on-floor kick, house claps, syncopated mid-bass riff | Floor pulse, repeated groove, concise bass riff |
| Tech House / Garage House | ~120-132 | Repetitive percussion groove, micro-variation, short fills | Percussive pocket, tension and releases without large chord walls |
| Liquid DnB | ~170-180 (85-90 half-time feel) | Rolling two-step break, warm harmony, fluid bass | Continuous momentum, melodic/harmonic color |
| Dancefloor DnB | ~170-178 | Driving break, strong synth anthem, weighty sub | High-energy melodic chorus/drop, rapid drum continuity |
| Neurofunk DnB | ~170-180 | Complex syncopated Reese movement, edited breaks | Bass sound-design complexity and rhythmic displacement |
| Jump-Up DnB | ~170-180 | Direct bouncy bass calls, fast breaks, clear drop motif | Simplified powerful bass hook over fast drums |
| Jungle / Breakbeat | Jungle ~155-175; breaks often ~120-145 | Chopped break phrases, ghost hits, ride/shuffle energy | Break variation, rhythmic collage, drum counterpoint |
| Halftime DnB / Drumstep | Halftime ~80-90 feel over ~160-180 grid | DnB sound palette with half-time backbeat | Dramatic switch between fast tops and slow backbeat |
| Jersey Club / Club-rap hybrids | Often ~130-145 | Triple-kick figures, chopped vocal punctuations, quick stops | Local kick accents and bounce inside trap |
| Wave / Hardwave | Often ~120-160 | Spacious pads, spectral leads, trap-derived drums | Dark atmospheric harmony and bass contrast |

### 4.1 Hybrid rules: rhythm first, then bass, then harmony

A hybrid should declare **one primary timing grammar**, **one bass language**, and **one harmonic or textural language**. Sample role assignments:

| Hybrid | Primary ownership | Secondary contribution | Explicit safeguard |
|:--|:--|:--|:--|
| Trap x Future Bass x Dubstep | Trap backbeat and hats | Future Bass chords; Dubstep FM replies | Preserve trap snares and hat motion in drop |
| UKG x Deep 140 Dubstep x Trap | UKG two-step/swing | Dubstep sub and dub echoes; trap hat ratchets | Keep shuffled percussion audible in half-time sections |
| Riddim x Future Bass | Riddim bass-call cycle | Future Bass brief chords and countermelody | Harmonic sections should not overwhelm the repeated drop motif |
| Liquid DnB x Melodic Dubstep | Fast DnB break | Dubstep growl and melodic chord mass | Retain fast break or explicitly specify halftime switch |
| Neurofunk x Trap | Neurofunk syncopated mid-bass and detailed break | Trap 808 slides and hat ratchets | Resolve tempo conflict as a 174 BPM song with halftime breakdown, or choose a 140 BPM trap interpretation |
| Bass House x UKG | Four-on-floor house kick | UKG shuffled hats and ghost snares | Do not demand full 2-step kick placement simultaneously with constant four-on-floor unless alternating sections |
| Jersey x Trapstep | Half-time trap snare | Jersey triple-kick pickups; Dubstep growls | Triple kicks are fills unless Jersey is named as dominant |
| Wobble Dubstep x Chopped Soul | Sub and resonant filter movement | Original sample-like Rhodes/chop hook | 'Funky' means bass articulation, not obligatory upbeat funk guitar |

### 4.2 Conflicts the compiler should catch

A requested 140 BPM track with a fully continuous 174 BPM DnB drum grid is ambiguous; ask whether the user intends a 140 BPM breakbeat homage, a 174 BPM DnB track with 87 BPM half-time feel, or a sectional tempo reinterpretation. A strict four-on-floor kick and a true broken UKG two-step kick cannot both be the exclusive foundational kick grammar at the same time, though they can alternate sections or layer fills. Likewise, a sparse minimal drop and an all-instruments-continuous maximum-density drop are incompatible without section assignment.

The word 'hybrid' is not an algorithm. The tool must express which genre owns the drums, bass, harmony, vocal delivery, and section transitions, and which genres are merely accent textures. A well-formed hybrid is a musical role map, not a list of tags.

## 5. Rhythmic complexity as a compositional system

Drum complexity is not the number of percussion adjectives in the prompt. It is the interaction of pulse, displacement, subdivision, accent, timbre, and development over time. A four-on-floor house track can be complex through ghost percussion and phase relationships; a 140 BPM trap track can be complex through hat-roll timing and bass antiphony; a DnB track can be complex through break editing and ghost notes. Require the tool to name its **type of complexity** rather than always increasing note density.

### 5.1 The drum grammar

Model each rhythmic layer as `timbre + pattern + accent + variability + section role`.

| Layer | Distinct musical job | Useful prompt vocabulary | Common mistake |
|:--|:--|:--|:--|
| Kick | Establishes strong pulse and groove displacement | downbeat, offset kick, anticipation, double-kick pickup, four-on-floor, broken 2-step | Requesting mutually exclusive kick patterns as simultaneous foundations |
| Snare / clap | Creates perceived tempo and backbeat weight | half-time snare, dry snare-clap, ghost snare, layered electronic clap, pre-drop roll | Using a live-drumkit backbeat in a machine-focused track without intending it |
| Closed hats | Establish repeated subdivision and motion | steady 8ths, 16ths, 32nd ratchets, triplet turnarounds, shuffle, velocity accents | Requesting uninterrupted 32nd rolls that obscure groove and become harsh noise |
| Open hats | Adds lift and offbeat punctuation | clipped offbeat open 808 hat, short choke, upstroke accent, pre-downbeat lift | Long tails overlapping fast closed-hat rolls when a tight electronic feel was requested |
| Ghost percussion | Creates swing and fine temporal texture | rim ghosts, small shaker/rim ticks, quiet clap pickups, off-grid fills | So many ornaments that the main groove is no longer identifiable |
| Break editing | Creates local rhythmic evolution | sliced break, ghost-note swap, one-bar fill, reversed drum fragment, snare displacement | Saying 'DnB' while asking for no fast-break character |
| Silence | Creates contrast and punctuation | eighth-note gap, half-bar dropout, one-beat choke, silence-to-impact cut | Repeating silence so often the groove cannot sustain momentum |

For TR-808-inspired electronic trap hats, distinguish **the sound** from **the sequencer grid**. The TR-808's sampled or synthesized tonal identity can be used in modern programming with 16th/32nd retriggers. The old hardware's native step programming should not be confused with modern rapid-fire sequencing. If the target is 'electronic, not acoustic', name `closed 808 hi-hats`, `open 808 hi-hats with short chokes`, and `electronic snare-claps`, and exclude `live acoustic drum kit` separately.

### 5.2 Bass groove grammar

Treat the low end as three potentially separate jobs: `kick transient`, `fundamental sub/808 pitch`, and `audible mid-bass phrase`. The exact frequency divisions depend on the music and production, so a text prompt should describe relative occupation rather than hard numerical EQ guarantees.

- **Continuous low-end bed:** long sub notes and restrained slides, often beneath a groove-oriented or melodic section.
- **Offset eighth-note answers:** short bass stabs land between kicks, making a pattern feel mobile without changing the backbeat.
- **Anticipation:** a bass pickup lands just before an expected kick or downbeat; the following rest lets the impact breathe.
- **Call-and-response:** a Reese or FM phrase answers a hook or kick sequence over one or two bars.
- **Gate rhythm:** short filter- or amplitude-gated notes establish a repeatable bass motif rather than one sustained growl.
- **Displacement:** the same phrase returns an eighth- or sixteenth-note earlier/later, creating controlled surprise.
- **Half-time/double-time reinterpretation:** drums and bass change *feel* while the nominal BPM stays the same.
- **Harmonic handoff:** one bass patch carries a phrase while other mid-bass layers rest; use layered notes only when masking is deliberately managed.

Do not describe every bass patch as simultaneously playing below 100 Hz, and do not say the pitched 808, Reese, FM growl, wobble and sub all 'dominate' at once. The language should specify who holds the fundamental, who carries articulation, and when each is active.

### 5.3 Arrangement-aware density curves

A recommended default is **contrast with continuity**, not constant maximal density:

| Section | Drums | Bass | Hook / harmony | Transition function |
|:--|:--|:--|:--|:--|
| Intro | filtered or sparse pulse, perhaps one hat signature | reduced sub or motif | introduce recognizable timbre | establish identity without spoiling drop |
| Main / verse | fully recognizable core drum grammar; modest 16th hat movement | signature bass pocket, short answers | repeat clear hook or vocal figure | create a groove listeners can learn |
| Build | add kick/snare pickup variations; accelerate local hat fills toward 32nds; shorter open hats | tighten ostinato or lift filter, then withdraw bass | narrow/chop/revoice hook | increase tension through subdivision and space |
| Pre-drop | deliberate one-beat or half-bar reduction | sub withdrawal or pitched pickup | one recognizable hook fragment | make downbeat intelligible |
| First drop | strong backbeat and selected high-frequency complexity | defining call-and-response phrase | hook returns; harmony supports rather than masks | deliver payoff and genre identity |
| Breakdown | subtract kick and dense hats; reveal ghost rhythm or chord loop | stripped or filtered bass | expose hook or vocal | restore headroom and anticipation |
| Final drop | retain core groove but alter fill distribution or pattern accents | develop prior groove with new answers/displacement | transformed, not replaced, signature | earned escalation rather than arbitrary loudness |

Use bar counts only as planning constraints where appropriate: 4/8/16-bar units are common in some styles, but variation exists. If a song is shorter, tighten the arc instead of stuffing every standard section into it.

### 5.4 Style-specific complexity and drop construction

**Trap / Trapstep:** Main section can use offset 808 kicks, hard half-time snare-claps, closed electronic 16ths, local 32nd ratchets and choked open-hat upbeats. The build intensifies snare subdivisions and opens a spectral gap before the downbeat. The drop should use bass note/rest placement and call-and-response; another percussion layer cannot compensate for a weak bass groove.

**Future Bass:** Complexity may reside in staggered chord attacks, vocal-chop rhythm and trap-derived hat ornaments. Avoid letting constantly busy hats hide the chord hook. The first drop establishes a melodic lift; the second changes voicing or bass answer while retaining emotional identity.

**Deep 140 / Wobble Dubstep:** Complexity comes from sub pressure, swing, syncopated wubs and intentional rests. Uninterrupted 32nd hats can undermine the intended minimal weight. Use hat ratchets as selected contrast, not a default wall.

**Riddim:** Build a repeating one- or two-bar bass phrase with subtle sound-design variation and a consistent drop pocket. Make a second drop change the rhythmic displacement or bass patch articulation, while maintaining the known call cycle. Avoid unplanned chord complexity.

**UK Garage / Speed Garage:** Groove must be audible in kick/snare and swung tops, not inferred from a style label. A half-time Dubstep drop can retain shuffled hats or two-step accents. For speed garage, a more driving kick may remain while bassline stabs supply bounce.

**Bass House:** The dominant four-on-floor pulse must survive. Complexity often lives in a syncopated bass riff, percussion ghosts and one- or two-bar fills, not a switch to a half-time trap snare unless explicitly requested as a breakdown or hybrid drop.

**Drum and Bass:** Fast rolling breaks are structural, not cosmetic. A neurofunk track may emphasize displaced Reese phrases and detailed break edits; liquid DnB uses flowing breaks and warm melodic continuity; dancefloor DnB has a direct hook and powerful backbeat; jump-up prioritizes bass call memorability. A 140 BPM track with only fast hats is not automatically DnB.

**Jungle / Breaks:** Name a sliced and evolving break, ghost-note behavior, and fill placements; avoid describing every drum as a rigid unchanging 808 pattern unless the hybrid explicitly juxtaposes break edits and programmed hits.

### 5.5 Example of precise rhythmic wording

**Weak:** `Aggressive bass music with extremely complex drums, insane trap hats, lots of fills, huge drops and crazy bass.`

**Better:** `A steady half-time electronic snare anchors syncopated 808 kick pickups; closed 808 hats pulse in sixteenths, adding short 32nd ratchets every second phrase and clipped open-hat accents before downbeats. In the build, snare ghosts grow into a two-bar roll as the bass narrows to one repeating note; the drop switches to staggered kicks and two-bar FM-bass answers, leaving an eighth-note rest before each sub impact.`

The second statement describes instruments, timing, differences between sections, and interacting roles. It is still probabilistic: no text field guarantees the exact note grid. When exact subdivisions are essential, use MIDI, Studio timing tools, or an external DAW after generation.

## 6. Lyrics, vocals, and the Styles prompt

### 6.1 Separate musical identity from the words to be sung

**[OFFICIAL]** Custom Mode offers an independent lyrics field, Styles field, advanced options, and an Instrumental choice. The latest V6 lyrics environment also supports structure labels and natural-language lyric editing. **[CONNECTED]** `audio-create` can receive custom lyrics, instrumental choice and, on supported routes, vocal gender. A registered `voice_id` takes precedence over gender and instrumental decisions because the voice is expected to sing.

The Styles field should describe vocal *performance characteristics* and how they sit in the track: e.g., `dry low-register conversational male lead; short phrasing in sparse verses; wide layered harmonies on the chorus; vocal chop call punctuates the drops`. Lyrics should contain the actual text and high-level section labels. Avoid burying complete lyric paragraphs in the Styles field, and avoid placing mix notes in the lyrics where they might be sung or disregarded.

### 6.2 Vocal arrangement is a separate musical layer

Vocal configuration should include `presence` (none, chops only, lead, duet, narration), `timbre`, `range`, `delivery`, `verse_density`, `hook_density`, `adlibs`, and `mix_position`. A pitched vocal chop used as an instrument is not the same as full lead singing. `Instrumental` in prose can conflict with a request for sustained lyrics. Workbench should flag and resolve the contradiction rather than rely on Suno to guess.

A productive example: a trap/UKG crossover can specify a dry, spoken-rhythmic verse, slightly sung pre-chorus, and a wide melodic hook, while preserving the same shuffled hats. This is a vocal *arrangement* rather than a vague description of the singer's personality.

### 6.3 Lyric structure and phrase density

A useful Custom Lyrics scaffold is:

```text
[Intro]
[Verse 1]
[Pre-Chorus]
[Chorus]
[Instrumental Drop]
[Verse 2]
[Bridge]
[Final Chorus]
[Outro]
```

Use only the sections that the song requires; the labels are guidance, not an absolute bar-by-bar arrangement control. For half-time trap grooves, lyric syllables should respect slower backbeat perception even if the nominal tempo is 140 BPM. DnB vocal phrases may be short, syncopated and rhythmically grouped across a fast break. House can support repetitive short hook phrases over longer groove arcs. A dense rap verse, highly ornamented singing and complex bass fills may compete for the same rhythmic foreground; give one element priority per section.

### 6.4 Vocal controls and priority conflicts

| Situation | Recommended routing | Warning |
|:--|:--|:--|
| New instrumental | Set `instrumental=true` in supported generation; no lead lyrics | The text `instrumental` alone is not a robust substitute for a mode control. |
| Full vocal song | Set `instrumental=false`, provide lyrics or explicit Simple-mode request | Make lyric section sequence agree with the Styles arrangement. |
| Vocal chops but no lead | Describe `wordless pitched chops used as percussion; no sustained lead verse` and inspect output | Some models may interpret chops as vocals; check actual result. |
| Male or female lead | Set supported `vocal_gender` plus delivery in Styles | Do not assume the gender field exists in dedicated mashup and cover tools. |
| Authorized voice model | Use eligible `voice_id` and matching lyric/performance instructions | A registered voice overrides the instrumental flag and gender choice in the connector. |
| Cover with original lyrics | Supply lyrics explicitly to dedicated cover route when intended and permitted | The connected dedicated cover does not automatically inherit the source lyrics if omitted. |
| Source remix with vocal identity | Set preservation requirement and suitable source influence; avoid blanket instrumental instruction | A source hook can disappear when lyrics, instrumental intent, and low source influence compete. |

One observation from the earlier library audit was that a small number of generated clips carried an 'instrumental' style description while their stored lyric field contained substantial verses. This demonstrates the need to test the actual input combination rather than infer an instrumental outcome from one word.

### 6.5 A cross-field consistency checker

The linter should flag: (a) `instrumental=true` plus a lead-vocal requirement; (b) `voice_id` plus an expectation of no singing; (c) lyrics naming a chorus absent from the requested arrangement; (d) a drop that is said to be 'vocal-free' while the chorus is assigned across that section; (e) source vocal preservation alongside a command to remove all source-derived phrases; and (f) multiple incompatible vocal identities without section ownership. These are not reasons to reject every hybrid, but reasons to require an intentional arrangement map.

## 7. Covers, remixes, source-audio preservation, and the style prompt

### 7.1 Remix is a family of operations, not a single algorithm

**[OFFICIAL]** Suno uses Remix as an umbrella for Cover, Extend, Replace Section, Sample, changing style or speed, and Mashup. V6 can interpret a source-based instruction in Simple mode, while dedicated operations offer narrower workflows. Choose the route from the desired change scope: `whole-song restyle`, `continue from point`, `replace one section`, `reuse a snippet`, or `merge two songs`. Do not silently rebuild a whole song when only a short section is defective.

### 7.2 Preservation and transformation are distinct objectives

Before writing a style prompt for a source-conditioned request, define a *preservation map*:

| Source attribute | Preserve, adapt, or replace? | How to express it |
|:--|:--|:--|
| Melody / motif | Preserve if recognition depends on it | `Keep the source's recurring rising three-note hook` |
| Harmonic center | Keep or intentionally transpose | `Retain the source's harmonic mood; change percussion, not its progression` |
| Lyrics / vocal hook | Keep only if desired and authorized | `Keep recognizable vocal phrase and phrasing as the recurring hook` |
| Groove / tempo | Retain, reinterpret, or replace | `Recast the source groove in shuffled 2-step without losing its pickup rhythm` |
| Form / transitions | Preserve section order or rebuild | `Retain chorus-return points; add a heavier second drop` |
| Instrumentation | Rebuild into target genre | `Replace the backing with dry 808 drums and responsive FM bass` |
| Mix aesthetics | Change deliberately | `Shift to mono sub and wider chord tails; preserve core hook audibility` |

The more source features a prompt simultaneously replaces, the less recognizable the result may be even when source audio is provided. A fixed new BPM/key, completely new motif, new song form, and 'instrumental' instruction can erase source identity under low Audio Influence.

### 7.3 Audio Influence and written styles: how they interact

**[OFFICIAL]** Audio Influence controls how much source audio guides a source-conditioned result when the control is available. **[CONNECTED]** The dedicated cover route describes higher values as staying closer to the source. It does not specify a simple source/new-music blending equation. High Style Influence and high Audio Influence can be compatible when the styles prompt defines a new *arrangement around the original hook*. They may be in tension when the styles prompt explicitly replaces the melody, tempo, chord language, and vocal presence. Weirdness and Variety add further degrees of reinterpretation; Max Mode does not act as a preservation percentage.

Three experimental starting modes:

| Transformation intention | Audio Influence | Style Influence | Weirdness | Variety | Prompt priority |
|:--|:--|:--|:--|:--|:--|
| Faithful new production | ~70-85% | ~60-80% | ~25-45% | Off | Preserve motif, phrase and harmony; change instrumentation |
| Recognizable hybrid remix | ~45-65% | ~80-95% | ~45-65% | Off / Normal | Keep one or two identity anchors; redesign rhythm and drops |
| Radical reinterpretation | ~10-35% | ~85-100% | ~60-85% | Normal / High | Use source as loose inspiration; permit new hooks and form |

These percentages are **[HEURISTIC]** experiment anchors, not official calibration and not guaranteed thresholds. Source material, prompt conflicts and model variation can dominate the result. Max Mode can be tested for longer or source-faithful songs if the user accepts extra credit cost.

### 7.4 Mini case study: why recognizable source can disappear

A recent *Tender Kisses* pair used Audio Influence 15%, Style Influence 95%, Weirdness 75%, Variety Normal, and Max Mode On. Both written styles directed a new 140 BPM F-minor UKG/Trapstep instrumental arrangement. The apparent original upload was analyzed closer to a G-minor, ~109 BPM club recording with distinctive clipped vocal and pluck figures. Although the metadata does not reveal conclusive parent links, the contrast illustrates a general point: low source guidance plus explicit new key, tempo, instrumental status, and full new arrangement is a coherent request for **restyling**, not strong source recognition.

The right fix is not necessarily 'raise everything': first preserve a recognizable phrase in the prompt, remove unnecessary forced transposition/tempo, and test Audio Influence at 35%, 55%, and 75% with other variables held constant. Only after source recognition is evaluated should the new arrangement be further intensified.

## 8. Mashups, sampling, and cross-source arrangements

### 8.1 Dedicated mashup versus multi-reference V6 generation

**[CONNECTED]** The dedicated `audio_mashups_create` operation takes exactly two complete source clips and a single Styles instruction, with one Audio Influence value describing adherence to the *pair*. It does not expose independent sliders for Source A versus Source B. **[OFFICIAL / CONNECTED]** V6 Simple mode can also use multiple reference songs, and the connected `reference_audio_ids` parameter accepts up to ten. That broader operation can describe mashup, source edit, restyle or sample intentions, but should not be conflated with the narrow two-parent route.

### 8.2 Choose a role for each parent

A mashup prompt should assign *ownership*, not just name both genres:

`Source A supplies the recurring chopped vocal hook and melodic contour. Source B supplies shuffled garage percussion and a syncopated bass groove. Keep A's hook audible over B's rhythm during the main section; use a new FM bass phrase as a response in the drops. Avoid stacking both sources' full bass parts simultaneously.`

This is stronger than `Combine two songs into trap and dubstep`, because source roles are observable. If only one parent's melody should remain, say so. Do not claim a 60% Audio Influence setting means 60% A and 40% B.

### 8.3 Tempo, downbeat, key, phrase and stem checks

If two sources are separated by only a few percent in BPM, modest stretch may preserve groove; more distant tempos may need halftime/double-time interpretation or a full re-generation rather than aggressive stretching. Align downbeats and phrase starts (often 8/16-bar units, genre dependent), then assess vocal timing, harmonic compatibility and masking. Relative minor/major or closely related keys are sometimes useful starting points but are not universal guarantees; check actual chord content and vocal range. Large transposition may produce unnatural artifacts.

When acoustic evidence shows two simultaneous basslines, isolate stems or choose one low-end owner. When the main issue is phrase alignment or transition masking, a DAW-like timeline is more reliable than adding more adjectives to a style prompt. Suno Studio 2.0 supports audio and MIDI editing, effects and automation; recent October 2026 updates added auto-stretch behavior for imported audio and finer pitch adjustment. Do not infer those exact controls exist in every MCP generation call.

### 8.4 Sampling and rights boundaries

Only use audio whose reuse is authorized by ownership, license, public-domain status, or permitted platform remix rules. Distinguish the composition from the actual sound recording, and do not assume that public song visibility makes sampling or commercial reuse lawful. A short source clip can instead inspire an **original** contour, timbre, groove and rhythmic attitude without requiring protected melody or lyrics replication.

**Contractual caveat:** Suno's 2026 Remix help pages discuss conditions under which remixes of one's own music can be commercially used, whereas the current published Terms include restrictive language concerning Remix commercialization. The Terms are higher-authority contractual text, and the available official guidance is not perfectly harmonized. Workbench should not mark a remix 'cleared for monetization' automatically; it should present a rights-check workflow and link to the current Terms. This report is technical guidance, not legal advice.

## 9. Slider interactions, models, and generation strategies

### 9.1 Controls are conditional signals, not linear weights

| Control | Official / connected meaning | Consequences for prompt design | What it cannot promise |
|:--|:--|:--|:--|
| Weirdness | Safe-to-chaotic novelty; 50% described as ordinary in official slider documentation | Raise when sound design is too generic; lower when the intended groove or form drifts | Exact novelty percentage, superior audio quality, perfect subdivisions |
| Style Influence | Loose-to-strong adherence to supplied style input | Raise for a coherent, precise brief; reduce if a dense prompt overrules useful source traits | A direct mix balance between source and new style |
| Audio Influence | Source/voice resemblance on eligible routes | Raise to preserve original motif, phrasing or timbre; must be valid for operation | Exact percentage of sample retention or per-parent mashup weighting |
| Variety | Reinterprets or updates style tags; Off=0 preserves author control | Keep Off during controlled tests; use Normal/High for discovery after validating style identity | Independent quality improvement or guaranteed genre fidelity |
| Max Mode | Extra compute/credits for consistency, long songs and style transfer | Consider for >2-minute songs or source-faithful covers; test budget/benefit | Automatic source loyalty or mastering improvements |
| V6 / V6 Wild / V6 Mini | Precise flagship / exploratory / efficient generation family | Use V6 for controlled experiments; Wild for divergence; Mini for quick ideation | Identical behavior across models and slider configurations |

Suno explicitly says Variety changes style prompts and recommends 0 for tag-level control; Max Mode is an optional higher-credit path for longer songs, covers and style consistency. Current Creative Sliders documentation describes the core meanings of Weirdness, Style Influence and Audio Influence. Do not infer an internal probabilistic formula from these user-facing descriptions.

### 9.2 Interaction patterns worth testing

- **High Style, low Audio, high Weirdness:** strongly scripted new style with loose source conditioning and experimental divergence; appropriate for radical restyling, not a faithful cover.
- **High Style, moderate Audio, moderate Weirdness:** controlled genre transformation with a chance of preserving key source features; useful for recognizable hybrid remixes.
- **High Audio, lower Weirdness, moderate Style:** source-forward restyle; prompt should change accompaniment instead of replacing hook or structure.
- **High Style, Variety Off:** the most interpretable A/B setting for assessing a precise six-part brief.
- **High Weirdness plus V6 Wild plus high Variety:** three sources of divergence can make experiments hard to diagnose; use deliberately for discovery, not a reproducible benchmark.
- **Max Mode with contradictory instructions:** extra compute may help consistency but does not determine which contradictory musical identity is correct. Resolve contradictions first.

### 9.3 Suggested experiment presets (not official Suno prescriptions)

| Goal | Model | Weirdness | Style | Audio* | Variety | Max Mode |
|:--|:--|:--|:--|:--|:--|:--|
| Accurate bass-genre benchmark | V6 | 45-60% | 85-95% | n/a | Off | Off initially; On for longer final tests |
| Complex trap drums + groove | V6 | 50-65% | 85-95% | n/a | Off | User-selected by budget |
| Exploratory hybrid sound design | V6 Wild or V6 | 65-80% | 70-90% | n/a | Normal / High | Usually unnecessary for sketches |
| Faithful cover | V6 | 25-45% | 60-80% | 70-85% | Off | Consider On |
| Recognizable hybrid remix | V6 | 45-65% | 80-95% | 45-65% | Off / Normal | Consider On |
| Radical authorized remix | V6 or Wild | 60-85% | 85-100% | 10-35% | Normal / High | Optional |
| Two-source mashup | V6 | 40-65% | 65-90% | 45-70% | Off / Normal | Consider for long full-length results |

`*` Audio Influence applies only where supported by the selected route and source conditioning. These ranges are starting hypotheses. They are **not** mechanical formulas or causal estimates from the earlier 100-generation library review.

### 9.4 Controlled A/B protocol

Select one objective such as `preserve source hook`, `maintain shuffled UKG tops`, or `deliver discernible 32nd electronic hat ratchets`. Fix the source, style prompt, model, lyrics, duration and all controls except the one under test. Generate enough pairs to reduce the influence of chance, then compare blind where feasible. Record the exact prompt hash, model, controls, seed if exposed (the current connector does not promise seed control), clip IDs, timestamps, and listening notes. A/B changes should be small enough to interpret but large enough to reveal a difference. When comparing controls and prompt revisions, use separate stages.

This protocol produces directional evidence, not a scientifically causal guarantee. Stochastic generation and unobserved backend changes can affect outputs. The report recommends confidence labels and repeated trials before treating an empirical heuristic as a Workbench default.

## 10. Prompt auditing: from semantic linting to audio evidence

### 10.1 Audit before generation

An effective static auditor should detect defects without pretending to know how the audio will sound. Differentiate errors from creative risks:

| Check | Example flag | Severity | Recommended repair |
|:--|:--|:--|:--|
| Input limit | Style exceeds route's character ceiling | Error | Shorten without deleting anchor groove or motif |
| Mode combination | Simple description sent alongside custom lyrics and style | Error | Select correct creation route |
| Audio control support | Audio Influence supplied to new custom track without eligible voice/source route | Error | Use supported source-conditioned operation or remove it |
| Vocal contradiction | `instrumental` and full lead-vocal verses both required | Error / warning | Assign true vocal intent and matching mode |
| Meter / tempo conflict | Fixed 140 BPM trap and continuous canonical 174 BPM DnB break without transition | Warning | Choose dominant timing grammar or explicit section change |
| Groove ownership | House four-on-floor and UKG two-step both called the primary kick | Warning | Give each ownership of different sections or one secondary role |
| Missing identity | Five layers, no recurring motif or bass-call signature | Warning | Add one hook with recurrence instruction |
| Prompt saturation | Sixteen near-synonymous density adjectives | Warning | Replace adjectives with instrument interaction and variation |
| Bass masking risk | Multiple bass instruments all required to sustain full low end together | Warning | Separate sub owner, FM mids, and timing |
| Drum timbre mismatch | Demands TR-808 hi-hats while excluding every cymbal and hi-hat | Warning | Narrow exclusion to *acoustic* cymbals |
| No final-drop development | `bigger second drop` without a stated musical change | Suggestion | Add groove displacement, hook variation or new bass answers |
| Source preservation conflict | New tempo, key, hook, lyrics, arrangement and low Audio Influence | Warning | Mark intended as radical restyle or protect source anchors |
| Rights unclear | Third-party audio selected with no authorization metadata | Stop / check | Establish permitted use before upload/remix; do not infer rights from visibility |

For implementation, maintain a `conflict_code`, `severity`, `source_field`, `explanation`, and `repair_action`. Use deterministic parsing when possible (exact field presence, length, contradiction keywords); use a language model for semantic interpretation when needed, but keep that classification separately flagged as uncertain.

### 10.2 A useful scoring model

A score is useful for prioritization only if it corresponds to observed criteria. **Proposed rubric, not a Suno quality metric:**

| Dimension | Weight | Measurable or inspectable criteria |
|:--|--:|:--|
| Identity and genre hierarchy | 15 | One primary genre; secondary roles declared; tempo/meter compatible |
| Groove specification | 20 | Backbeat, kick, hats, accents, subdivision and variations are intelligible |
| Hook and bass relationships | 20 | Memorable motif, sub/mid separation, documented interactions |
| Arrangement and progression | 20 | Meaningful section contrasts and defined final-drop development |
| Production focus | 10 | Two or three coherent priorities; no impossible masking demand |
| Controls and mode fit | 10 | Valid route, lyric/vocal coherence, conditional sliders, source awareness |
| Constraints and efficiency | 5 | Exclusions precise; no over-limit text or needless repetition |

The 100-point result is a **human-designed static quality proxy**, not an actual probability of success. The tool should display uncertainty and unresolved flags instead of treating an arbitrary 92/100 as '92% likely to sound right'. Genre-specific weights can change: for deep dubstep, low-end space may deserve greater weight; for liquid DnB, continuity and harmonic identity may count more; for a cover, source preservation must be scored separately.

### 10.3 Audio audit after generation

The earlier audit showed why metadata-only evaluation is insufficient: an intended Jersey/UKG rhythm can be heard as primarily trap or melodic dubstep; a requested 140 BPM song can be measured as 70 BPM because the analysis follows half-time pulse; and a prompt requesting an instrumental may still contain vocal material. An audio audit should compare the **actual recording** with the expected attributes, not merely reread the prompt.

Recommended pipeline:

1. Retrieve clip metadata: title, source type if available, style, lyrics, model, controls, duration, and negative style.
2. Run timing analysis: estimated BPM, key, meter, section map, beat placement, and labels. Normalize half/double-time alternatives instead of marking them wrong automatically.
3. Ask a listening model independent questions: describe the dominant rhythm *without reading the prompt*; describe audible vocal behavior; identify bass and motif recurrence; compare first and second drops; assess low-frequency separation.
4. For a source remix, run the same observations on the source, then compare melody, phrasing, groove, form and recognizable signatures. State when parent links are not available.
5. Compare expectations versus observations by feature, including confidence and evidence. Do not equate 'generated' with 'passed'.
6. Recommend the smallest next intervention: a wording change, a control change, a source selection, a section replacement, or a Studio/MIDI edit.

### 10.4 Audio-validation metrics

Keep qualitative ratings anchored in audible checks. Suggested binary/graded dimensions: `primary_groove_present`, `secondary_genre_role_audible`, `hat_timbre_electronic`, `ratchets_present`, `open_hat_role_audible`, `hook_recurrence`, `sub_kick_separation`, `bass_call_response`, `build_contrast`, `drop_payoff`, `second_drop_development`, `vocal_intent_match`, and `source_recognition` (where relevant). Record `uncertain` separately from `fail`.

Do not claim exact MIDI note positions merely because a listening model reports '32nd hats'. For precision-critical tasks, listen with slowed playback or analyze MIDI if authorized and practical. A converter can mis-transcribe dense audio, so MIDI is evidence to inspect, not proof of what the original generator programmed.

## 11. Workbench software architecture and data contracts

### 11.1 Recommended modular design

| Module | Input | Output | Primary responsibility |
|:--|:--|:--|:--|
| Brief Normalizer | Freeform user goal | Structured creative brief | Resolve intent, genre roles, vocal/source mode and preferences |
| Genre Ontology | Genre names and substyles | Genre signature and tempo/groove expectations | Maintain bass/EDM vocabulary without rigid genre stereotypes |
| Hybrid Role Planner | Genres, dominant identity, constraints | Drum/bass/harmony/vocal ownership map | Prevent equal-weight genre soup and contradictions |
| Rhythm & Bass Planner | Primary groove, section order | Main/build/drop drum-bass relationship map | Specify complexity and progression in actionable timing language |
| Six-Part Compiler | Validated structured brief | Styles text, Exclude text, Lyrics scaffold | Produce concise, field-specific output under size limits |
| Mode Adapter | Target mode, source IDs, voice, controls | Valid Suno tool inputs | Enforce Simple vs Custom vs Cover vs Mashup vs Extend contracts |
| Preflight Linter | All candidate fields | Errors, warnings, repair suggestions | Check lengths, semantics, source rights, mode and role conflicts |
| Experiment Designer | Objective and budget | A/B matrix and identifiers | Change one influential variable at a time |
| Audio Auditor | Finished clips and expected outcomes | Evidence-based scorecard and suggested refinement | Inspect actual music instead of prompt text |
| Provenance Store | Documentation checks, generated artifacts | Versioned evidence log | Track why a rule exists, when it was checked and when to refresh |

The critical separation is `musical semantics -> textual realization -> provider-specific payload`. Do not hardcode production heuristics directly into connector request logic. Store the musical goal independently of which Suno path happens to be available that month.

### 11.2 Mode-specific routing decision tree

```text
User goal
  |
  +-- new song, no source
  |     +-- user controls style and lyrics -> Custom
  |     +-- user wants Suno to invent style/lyrics -> Simple
  |
  +-- one source
  |     +-- transform whole style -> dedicated Cover
  |     +-- continue after point -> Extend
  |     +-- replace one region -> Editor / V6 targeted edit
  |     +-- use snippet as inspiration -> Sample / V6 reference
  |
  +-- two sources and clear blend -> dedicated Mashup
  |
  +-- multiple references, complex request -> V6 Simple reference workflow
  |
  +-- completed track with exact timing defect -> Studio / MIDI / Editor
```

The tool should expose a mode confirmation in its internal structured brief, but not ask unnecessary questions when the request clearly selects the path. Ask for extra information only if the missing fact would change whether the request is valid, rights-cleared, or aligned with the intended result.

### 11.3 Proposed core schema

A full machine-readable rules and example-schema companion accompanies this report. At the conceptual level:

```json
{
  "mode": "custom",
  "identity": {
    "primary_genre": "trapstep",
    "secondary_roles": [
      {"genre": "future_bass", "role": "harmony"},
      {"genre": "deep_dubstep", "role": "bass_timbre"}
    ],
    "bpm": 144,
    "key": "D Phrygian",
    "mood": ["dark", "restless"]
  },
  "groove": {
    "backbeat": "half_time_snare",
    "hat_sound": "electronic_808",
    "closed_hat_base": "16ths",
    "hat_fill": "short_32nd_ratchets",
    "fill_placement": "phrase_turns",
    "open_hat_role": "selected_offbeats"
  },
  "musical_identity": {
    "hook": "D-Eb two-note motif",
    "low_end_owner": "pitched_808_sub",
    "mid_bass_role": "FM_answer_phrases"
  },
  "arrangement": {
    "sections": ["intro", "main", "build", "drop_1",
      "breakdown", "drop_2"],
    "final_drop_delta": "displaced_mid_bass_answers"
  },
  "production": ["dry_machine_drums", "mono_sub", "wide_fx_only"],
  "constraints": {"exclude": ["acoustic_drum_kit"]}
}
```

The six-part object is the *internal truth*. The `style` string is merely one generated view. This makes later formatting changes and different platform limits easier to support without rewriting the genre model.

### 11.4 Semantic relationships and compiler rules

At minimum, represent the following edge types: `supports`, `answers`, `contrasts`, `replaces`, `preserves`, `enters_during`, `drops_out_before`, and `evolves_into`. A prompt with musical relationships can be reconstructed from `glass_pluck_hook -> answered_by -> FM_bass`, `UKG_shuffle -> preserved_during -> halftime_drop`, and `source_vocal_hook -> retained_in -> chorus_and_drop`. This relational representation is more resilient than storing a bag of words.

Prioritize a phrase such as `FM bass answers the glass-pluck hook during gaps between kick accents` over three separate unconnected tags. Genre plug-ins should define the ownership of groove and explain how each secondary influence modifies it. A validator should warn when the only link between genres is 'fused with'.

### 11.5 Character-budget optimization

The renderer should validate character count for the actual provider field after punctuation and whitespace normalization, not count words. Rank clauses by value: (1) defining rhythm and genre, (2) recurring hook, (3) bass interactions, (4) section changes, (5) crucial mix priorities, (6) low-impact decoration. De-duplicate equivalent descriptors and move negative constraints out to Exclude. In strict modes, preserve all invariants while rephrasing lower-priority clauses; never silently delete a hard requirement solely to hit a target length.

Record a `length_report` with original count, optimized count, and an explanation of removed or consolidated instructions. If a user explicitly asks for a 925-975-character prompt, the validation must report pass/fail for that exact range, not merely say 'under 1,000'.

### 11.6 Example validation requirements

The companion JSON defines testable rule IDs. Recommended acceptance tests include:

- `custom_style_1001_chars` returns an error, not a truncated submission.
- `simple_description_with_custom_lyrics` returns invalid input mode.
- `style_says_instrumental_but_has_full_lyrics` warns of semantic conflict.
- `voice_id_plus_instrumental_flag` warns of effective precedence.
- `new_custom_track_with_audio_influence_no_voice` is rejected or rerouted.
- `two_source_mashup` routes to the dedicated two-parent interface.
- `three_source_request` uses the V6 multi-reference path or explains the difference.
- `trap_and_ukg_with_no_primary_groove` asks for or infers rhythm ownership, then annotates the assumption.
- `all_bass_patches_sustain_low_sub` emits a low-end-ownership warning.
- `style_16th_32nd_hats` distinguishes steady base from short ratchet accents.
- `remix_95_style_15_audio_new_key_new_hook` marks strong source-transformation risk.
- `retained_hook_with_high_audio` avoids rewriting the hook in the generated prompt.
- `exact_925_975_chars` meets the strict output window or explicitly fails.

## 12. Cross-genre example prompts and generated variants

The following examples are **[HEURISTIC]** demonstrations of the six-part grammar. They are intended as reusable training fixtures, not promises of a particular render or exact note placement. Original, source-free sketches are used here; when composing a cover, replace newly invented hooks with preserved authorized source features as appropriate.

### 12.1 Trap-led Future Bass x Dubstep, 140 BPM

`140 BPM, A minor. Dark Trap is the rhythmic backbone: hard electronic half-time snare-claps, offset 808 kicks, closed 808 hats in sixteenths with brief 32nd ratchets before phrase turns, and clipped offbeat open hats. A descending four-note glass-pluck hook recurs over bittersweet Future Bass chords. Pitched 808 sub notes fill the long low end while rounded FM growls answer the hook in the gaps. Minimal intro, fully established main groove, snare-and-hat build, melodic first drop, exposed hook breakdown and a second drop that shifts the FM answers and revoices the chords. Dry punchy drums, clean mono sub and wide upper harmonics.`

**Why it works conceptually:** Trap owns time, Future Bass owns harmony, Dubstep owns mid-bass movement, and final-drop development relates to the hook. No conflicting full-time UKG or DnB groove is requested.

### 12.2 Deep 140 x UKG x Wobble Dubstep, 140 BPM

`140 BPM, F minor. Deep 140 dubstep with UK garage shuffle: a weighty half-time snare and sparse kick pressure under swung closed electronic hats, skipping snare ghosts and clipped open-hat accents. A low repeated two-note dub-chord stab leaves room for sliding mono sub pulses. Resonant wobble bass answers the chord on offbeats, alternating short filter sweeps with sustained descending notes. A quiet dub intro reveals the shuffle, followed by a rolling main groove, filtered pressure build and a spacious first drop; the breakdown removes the kick and the final drop adds more syncopated bass phrases while retaining the shuffle. Dry percussion, dub delays and restrained low-mid distortion.`

**Why it works conceptually:** The bass calls and negative space are not overwhelmed by 32nd-note rolls, and UKG supplies a specific top-rhythm characteristic.

### 12.3 Riddim x Color Bass, 140 BPM

`140 BPM, E minor. Repetitive Riddim dubstep owns the drop groove: a steady half-time electronic snare, offset kicks and crisp closed hats surround a two-bar syncopated bass-call pattern. Bright color-bass resonances color the repeating growl motif without replacing its rhythm; short vowel-shaped filter movements alternate with clean sub notes and deliberate eighth-note rests. Begin with an exposed tonal stab, move into an eight-bar groove, tighten the snare and hat fills for the build, and let the first drop repeat a memorable call. The break reduces the pattern to a single pitched accent; the final drop shifts the call to different offbeats and adds a harmonic response. Controlled mono low end, dry snare and bright but contained mid-bass harmonics.`

**Why it works conceptually:** Riddim keeps its repetition, while color bass changes timbre/harmonic perception instead of demanding another complete rhythm system.

### 12.4 Liquid DnB x Melodic Bass, 174 BPM

`174 BPM, B minor. Rolling liquid drum and bass is the groove: crisp edited breaks, warm ghost snares, nimble high hats and a driving two-step kick-snare motion. A recurring soft piano-and-pluck phrase floats above warm minor-seventh pads. Sub notes move in long legato arcs while restrained melodic Dubstep mid-bass phrases answer the motif between the strongest snare hits. Introduce the hook over filtered percussion, let the full rolling break arrive in the main section, increase break edits in the build, then release into a wide melodic drop without losing DnB momentum. The breakdown exposes piano and sub; the final drop revoices the hook and adds a more agile bass counterline. Focused sub, crisp breaks, airy chords and controlled reverb.`

**Why it works conceptually:** DnB owns the fast grid and continued movement; melodic bass provides hook and spectrum, not an unannounced 140 BPM trap backbeat.

### 12.5 Neurofunk x Half-time Trap accents, 174 BPM

`174 BPM, D minor. Neurofunk drum and bass with tightly edited breakbeats, precise ghost snares and dry 16th-note hat interplay. The main sub remains mono while evolving Reese mid-bass stabs move around the break accents in clipped one-bar call-and-response phrases. Trap-style 808 slides and short 32nd hat ratchets decorate selected transitions, not the entire fast-break groove. The first drop keeps the DnB drive and a repeating gated bass signature. The break cuts to a half-time backbeat before a rising filter build; the final drop returns to full-time breaks with the bass signature rhythmically displaced. Aggressive but separated mids, controlled distortion and clear transient hierarchy.`

**Why it works conceptually:** Trap colors transitions while neurofunk retains its native fast break grammar. The half-time section is a conscious arrangement choice rather than conflicting global instructions.

### 12.6 Bass House x Garage shuffle, 128 BPM

`128 BPM, G minor. Bass house with a consistent four-on-floor electronic kick, short claps on the backbeat and lightly swung garage hat ghosts. A clipped three-note distorted bass riff answers tiny vocal-free synth stabs, leaving open space on the offbeats. The main groove stays dry and repetitive; percussion rolls and a one-bar bass filter lift create the build, followed by a tight bass-focused drop that preserves the house kick. The breakdown strips the low end to percussion and chord stabs; the final drop adds a rhythmic bass response without replacing the main riff. Clean kick/sub separation, punchy claps and controlled stereo delay on the stabs.`

**Why it works conceptually:** House owns the floor pulse; garage affects shuffle and ghost notes, not the foundation of every kick.

## 13. Validation protocol and research roadmap for the tool

### Phase 1 - Rules and mode safety

**Deliverable:** a mode-aware six-part data model, field validator, and documented control behavior. **Definition of done:** 100% of deterministic tests for length, modes, tool fields, vocals, source counts and permissions pass. No incompatible operation is silently sent to Suno. This phase requires no paid audio generation.

### Phase 2 - Genre and hybrid engine

**Deliverable:** a versioned taxonomy with source-grounded musical signatures and role templates, plus conflict rules for rhythm ownership, bass overlap, tempo and section structure. **Definition of done:** at least five materially different valid briefs can be generated for each selected genre family, and examples with contradictory tempo/groove roles are flagged or repaired with visible rationale.

### Phase 3 - Arrangement-aware rhythm compiler

**Deliverable:** section-specific drum/bass plans for main, build, first drop, breakdown and final drop. **Definition of done:** generated prompts contain a stable main groove, an identifiable hook, a concrete transition mechanism and an explicit final-drop delta. This is a static textual acceptance test, not yet audio proof.

### Phase 4 - Feedback and evidence loop

**Deliverable:** audio analysis and listening comparisons that score whether the generated music actually matches groove, bass, hook, section evolution, vocal intent and source preservation. **Definition of done:** an audit can point to a particular audible deficiency and recommend a minimal controlled change rather than generic 'improve prompt' language.

### Phase 5 - Model/control experiments

**Deliverable:** reusable controlled experiment plans comparing V6 versus V6 Wild; Weirdness, Style, Audio and Variety; Max Mode versus standard; prompt compression; and source-role variations. **Definition of done:** repeatable test metadata are saved, results are graded with confidence, and default recommendations change only after corroborating evidence rather than one favorable generation.

### Phase 6 - Governance and automated updates

**Deliverable:** official Suno documentation watchlist, connector-schema version capture, rights warnings, and a human-reviewed release note for changed assumptions. **Definition of done:** each provider-dependent rule has an evidence URL, checked date and review trigger. New endpoints or revised field limits are tested before being advertised as supported.

## 14. Operational checklists and evaluation criteria

### 14.1 Before compilation

Confirm the desired operation, dominant genre/groove, BPM/feel, one signature hook, bass low-end owner, section architecture, lead-vocal intent, source-preservation anchors (if any), and exclusion constraints. Missing values can be filled with explicitly labeled defaults if low risk; do not invent a source's identity or rights.

### 14.2 Before generation

Confirm the route-specific input contract, hard length limits, valid controls, rights and remix permission, mode-specific lyrics/voice behavior, and whether a request might spend credits. Preserve a preview of rendered Styles, Lyrics and Exclude fields; keep raw structured intent in the generation record so later revisions are attributable.

### 14.3 After generation

Check if the expected dominant genre can actually be heard; if the bass calls are rhythmic rather than constant mud; if the hat source matches the requested electronic/acoustic distinction; if the hook recurs; if the build creates genuine contrast; if the final drop develops rather than restarts; if vocals match requested presence; and whether a source remix retains the intended motif. A failed criterion should map to a specific instruction or routing change.

### 14.4 Audit uncertainty

Separate `observed`, `likely`, `uncertain`, `not_measured` and `contradicted`. Beat tracking at 70 BPM for a 140 BPM trap track can be a valid half-time interpretation. Automated key tracking can mistake tonal ambiguity. Listening descriptions can mistake processed vocal chops for lead singing or misidentify adjacent bass genres. Document these limitations instead of hiding them behind numerical scores.

## 15. Terminology and practical distinctions

| Term | Operational meaning for Workbench |
|:--|:--|
| Dominant genre | Owns the primary rhythmic grammar and/or unmistakable overall structure |
| Secondary genre | Supplies a named musical role without forcing a whole second beat system |
| Hook | Recognizable recurring pitch, rhythm, vocal, bass or chord signature |
| Drum grid | A rhythmic subdivision and pattern, not a requested sound by itself |
| TR-808-style hats | Electronic timbre; modern sequencer ratchets can exceed original hardware step granularity |
| Hat ratchet | Rapid repeated notes concentrated within a short subdivision or phrase |
| Swing | Timing and accent displacement of subdivisions, not random rhythmic imprecision |
| Ghost note | Quiet ornamental hit reinforcing motion without replacing the main accent |
| Half-time | Perceptual backbeat feel at half the nominal pulse; not necessarily a different BPM |
| FM bass | Frequency-modulated bass timbre, often carrying midrange growl or articulations |
| Reese bass | Detuned/moving bass texture, often sustained or rhythmically gated |
| Pitched 808 | Tuned low bass voice, separate in purpose from an 808-style transient kick |
| Call-and-response | Two phrases take turns; useful for bass and hook interactions and masking control |
| Source preservation | Retention of chosen source characteristics, not a linear crossfade percentage |
| Style Influence | Strength of adherence to textual style input, where supported |
| Audio Influence | Strength of eligible source/voice conditioning; mode-specific |
| Variety | Degree to which style tags are reinterpreted before generation |
| Weirdness | Degree of exploratory deviation from normal expectations |
| Max Mode | Additional computation/credit cost, oriented toward consistency on selected longer or complex tasks |
| Prompt saturation | Instructions become repetitive, competing, or too dense to express coherent musical priorities |
| Audio audit | Comparison of recorded music to a predefined musical and generation brief |

## 16. Source register, currency, and governance notes

The following official documents were checked on November 23, 2026. A linked page's historical edit date may be older than this verification date. Connector field limits in this report were read from the authenticated Suno tool contract on that date and may evolve independently of website documentation.

1. **Suno V6 FAQ** (edited September 9, 2026): https://help.suno.com/en/articles/13924481 - models, Variety, Max Mode, reference-based creation, typical generation credit cost.
2. **What's New in V6** (September 9, 2026): https://help.suno.com/en/articles/13924801 - model differences and advertised eight-minute capability.
3. **Introducing V6** (September 9, 2026): https://suno.com/release-notes/introducing-v6 - natural-language edits, source combinations, sampling and restyling.
4. **Creative Sliders** (edited June 3, 2025): https://help.suno.com/en/articles/6141377 - official descriptions of Weirdness, Style Influence and Audio Influence.
5. **Suno MCP** (edited November 18, 2026): https://help.suno.com/en/articles/14551361 - connected creation, analysis, vocals, covers, mashups and library capabilities.
6. **Custom Mode and Lyrics**: https://help.suno.com/en/articles/2415873 and https://help.suno.com/en/articles/3726721 - independent Styles, Lyrics, Instrumental and advanced-options workflow.
7. **Vocal Gender** (edited September 9, 2026): https://help.suno.com/en/articles/10153473 - supported male/female advanced choice and Styles vocal descriptors.
8. **Exclude Styles** (edited December 19, 2025): https://help.suno.com/en/articles/3161921 - exclusions as independent Custom Mode input.
9. **Remix product overview**: https://suno.com/remix-welcome - Cover, Mashup, Replace Section, Extend, Sample and style changes.
10. **Sample and Mashup launch** (January 20, 2026): https://suno.com/release-notes/meet-our-new-create-features-sample-mashup - dedicated source workflows.
11. **Studio 2.0** (edited August 13, 2026): https://help.suno.com/en/articles/13670529 - MIDI, effects, automation, stem and timeline capabilities.
12. **Studio updates** (October 8 and October 29, 2026): https://suno.com/release-notes - audio stretch, pitch, clip and beat-alignment changes.
13. **Suno Terms of Service** (effective September 3, 2026): https://suno.com/terms - contractual rights, outputs and remix limitations; check current version for each commercialization decision.
14. **Can I monetize a Remix?** (edited October 6, 2026): https://help.suno.com/en/articles/9604993 - additional published guidance whose relationship to current Terms should be reviewed before commercial decisions.
15. **Suno Song Editor**: https://help.suno.com/en/articles/6141505 - region and section editing rather than global prompt rewriting.

**Freshness rule:** Recheck official Help and release notes when model families, slider semantics, limits, mode names or Studio controls change. Recheck the Terms whenever legal/rights consequences matter. Maintain `last_verified`, `source_url`, `source_date`, `applies_to_route`, and `review_trigger` fields in Workbench's rules data.

## Conclusion

Suno Workbench can mature from a phrase generator into a **music-aware prompt compiler and evaluation system**. The most significant change is conceptual: make a song's rhythm, melody, bass, form and source identity relational, rather than treating them as interchangeable style keywords. The six-part grammar provides a portable design surface across bass genres, while a provider adapter enforces what Suno can currently execute. Control heuristics should remain experiments, not hard-coded promises. Audio audits, timing analysis, source comparisons and section-aware revision are what turn those experiments into evidence.

The recommended build order is **schema and mode validation -> genre-role ontology -> section-aware groove engine -> six-part text compiler -> connected audio auditor -> evidence-based experiment loop**. That sequence produces value even if Suno changes its API or introduces new models, because the core musical concepts remain independent of any one model generation.

---

**End of report.** Companion: `suno-workbench-prompt-engine-rules-2026-11-23.json` (implementation-focused, versioned starter configuration and tests).
