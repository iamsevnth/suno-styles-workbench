import React, { useState } from "react";
import ArrangerStudio from "./ArrangerStudio.tsx";
import { convertToPhonetics } from "../lib/lyrics/phonetics.ts";
import type { PhoneticResult } from "../lib/lyrics/types.ts";

interface LyricsStudioProps {
  onShowDialog: (kind: "ok" | "error", title: string, body: string) => void;
  copyToClipboard: (text: string) => Promise<boolean>;
}

export default function LyricsStudio({ onShowDialog, copyToClipboard }: LyricsStudioProps) {
  const [activeSubTab, setActiveSubTab] = useState<"creator" | "phonetics">("creator");
  const [phoneticInput, setPhoneticInput] = useState("");
  const [phoneticResult, setPhoneticResult] = useState<PhoneticResult | null>(null);
  const [phoneticDisplayMode, setPhoneticDisplayMode] = useState<"pure" | "interlinear" | "split">("pure");
  const [phoneticStyleMode, setPhoneticStyleMode] = useState<"rap" | "natural">("rap");

  const handleSendToPhonetics = (lyrics: string) => {
    if (!lyrics.trim()) return;
    setPhoneticInput(lyrics);
    setPhoneticResult(convertToPhonetics(lyrics, { mode: phoneticStyleMode }));
    setActiveSubTab("phonetics");
  };

  const handleConvertPhonetics = () => {
    if (!phoneticInput.trim()) {
      onShowDialog("error", "Input Empty", "Paste or type lyrics to convert to American phonetics.");
      return;
    }
    setPhoneticResult(convertToPhonetics(phoneticInput, { mode: phoneticStyleMode }));
  };

  const handleCopyPhonetics = async () => {
    if (!phoneticResult) return;
    const ok = await copyToClipboard(phoneticResult.fullPhonetic);
    onShowDialog(ok ? "ok" : "error", ok ? "Phonetic Lyrics Copied" : "Clipboard Blocked",
      ok ? "American-English phonetic lyrics copied. Suno pronunciation is not guaranteed."
        : "Unable to write to clipboard. Select the text and copy manually.");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Built-in Sub-navigation Rail for Lyrics Tools */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveSubTab("creator")}
            className={`h-8 px-4 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeSubTab === "creator"
                ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-md"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            Lyrics Arranger
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("phonetics")}
            className={`h-8 px-4 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              activeSubTab === "phonetics"
                ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-md"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            <span>American Phonetics Converter</span>
          </button>
        </div>

        <div className="text-xs text-[var(--fg-subtle)] font-mono hidden sm:flex items-center gap-3">
          <span>LEFT: Original Lyrics & Structure</span>
          <span>→</span>
          <span>RIGHT: Verified Suno Output</span>
        </div>
      </div>

      {activeSubTab === "creator" ? (
        <ArrangerStudio onShowDialog={onShowDialog} copyToClipboard={copyToClipboard}
          onSendToPhonetics={handleSendToPhonetics} />
      ) : (
        /* ============================================================ */
        /* ITEM 5: AMERICAN PHONETICS CONVERTER (ZERO HYPHENS)           */
        /* ============================================================ */
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8 items-start">
          {/* Input column */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xl p-5 sm:p-6 flex flex-col gap-5">
            <div className="border-b border-[var(--border)] pb-3">
              <span className="label-caps text-[var(--accent)]">
                Input Lyrics
              </span>
              <h2 className="text-base font-semibold text-[var(--fg)] mt-0.5">
                Paste Lyrics for American English Phonetic Conversion
              </h2>
              <p className="text-xs text-[var(--fg-subtle)] mt-1">
                Converts spelling to authentic American singer/rap pronunciation with <strong>ZERO hyphens</strong> (e.g. "tha", "problee", "droppin", "wit", "bout").
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="phonetic-in" className="label-caps text-[var(--fg)]">
                  Original Lyric Lines
                </label>
                {phoneticInput && (
                  <button
                    type="button"
                    onClick={() => setPhoneticInput("")}
                    className="text-[11px] text-[var(--fg-muted)] hover:text-red-400 light:hover:text-red-700"
                  >
                    Clear Input
                  </button>
                )}
              </div>
              <textarea
                id="phonetic-in"
                rows={16}
                value={phoneticInput}
                onChange={(e) => setPhoneticInput(e.target.value)}
                placeholder={`Paste any song lyrics here...

Example:
[Verse 1]
The rapper will probably drop the bass with style
Looking at the city from about a mile
I am going to keep on rolling tonight
Without a shadow of fear in the neon light`}
                className="w-full min-h-[360px] rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] p-4 text-xs font-mono resize-y leading-relaxed focus:border-[var(--ring)] focus:outline-none"
              />
            </div>

            {/* Pronunciation Cadence Mode */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label-caps block mb-1.5 text-[var(--fg)]">
                  Vocal Cadence Style
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneticStyleMode("rap");
                      if (phoneticInput) {
                        setPhoneticResult(convertToPhonetics(phoneticInput, { mode: "rap" }));
                      }
                    }}
                    className={`flex-1 h-9 rounded-lg border text-xs font-medium transition-all ${
                      phoneticStyleMode === "rap"
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-semibold"
                        : "border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                    }`}
                  >
                    Rap & Singer Flow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneticStyleMode("natural");
                      if (phoneticInput) {
                        setPhoneticResult(convertToPhonetics(phoneticInput, { mode: "natural" }));
                      }
                    }}
                    className={`flex-1 h-9 rounded-lg border text-xs font-medium transition-all ${
                      phoneticStyleMode === "natural"
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-semibold"
                        : "border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                    }`}
                  >
                    Clear American Phonetic
                  </button>
                </div>
              </div>

              <div>
                <label className="label-caps block mb-1.5 text-[var(--fg)]">
                  Convert Action
                </label>
                <button
                  type="button"
                  onClick={handleConvertPhonetics}
                  className="btn-primary w-full h-9 rounded-lg font-bold text-xs transition-all"
                >
                  Convert to American Phonetics
                </button>
              </div>
            </div>

            {/* Quick sample loader */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
              <span className="text-[11px] text-[var(--fg-subtle)] font-mono">Load Sample:</span>
              <button
                type="button"
                onClick={() => {
                  const sample = `[Chorus]\nThe rhythm is probably gonna make you fall in love tonight\nGoing around the city with the bass turned high\nLooking at the lights without a single doubt\nTell me what you really want to talk about`;
                  setPhoneticInput(sample);
                  setPhoneticResult(convertToPhonetics(sample, { mode: phoneticStyleMode }));
                }}
                className="text-[11px] px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                "The rhythm is probably gonna make you fall..."
              </button>
            </div>
          </section>

          {/* Output column */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xl p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div>
                <span className="label-caps text-emerald-400 light:text-emerald-700">
                  Phonetic Output
                </span>
                <h2 className="text-base font-semibold text-[var(--fg)] mt-0.5">
                  American Phonetic Lyrics
                </h2>
              </div>

              {phoneticResult && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-[var(--border)] rounded-lg bg-[var(--bg)] p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setPhoneticDisplayMode("pure")}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        phoneticDisplayMode === "pure"
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] font-semibold"
                          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                      }`}
                    >
                      Clean Phonetic
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoneticDisplayMode("interlinear")}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        phoneticDisplayMode === "interlinear"
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] font-semibold"
                          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                      }`}
                    >
                      Side by Side
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPhonetics}
                    className="h-8 px-3 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-xs hover:opacity-90 shadow-sm"
                  >
                    Copy Phonetics
                  </button>
                </div>
              )}
            </div>

            {phoneticResult ? (
              <div className="flex flex-col gap-3">
                {phoneticDisplayMode === "pure" ? (
                  <textarea
                    rows={18}
                    readOnly
                    value={phoneticResult.fullPhonetic}
                    className="w-full min-h-[360px] rounded-xl border border-[var(--border)] bg-[var(--bg)] text-emerald-300 p-4 text-xs font-mono resize-y leading-relaxed focus:outline-none light:text-emerald-700"
                  />
                ) : (
                  <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
                    {phoneticResult.lines.map((l, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border text-xs font-mono flex flex-col gap-1 ${
                          l.isTag
                            ? "bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--accent)] font-bold"
                            : "bg-[var(--bg)] border-[var(--border)]"
                        }`}
                      >
                        <div className="text-[11px] text-[var(--fg-muted)] flex items-center justify-between">
                          <span>{l.original || "(blank)"}</span>
                          <span className="text-[10px] text-[var(--fg-subtle)]">orig</span>
                        </div>
                        <div className="text-emerald-300 font-semibold flex items-center justify-between light:text-emerald-700">
                          <span>{l.phonetic || "(blank)"}</span>
                          <span className="text-[10px] text-emerald-500/70 light:text-emerald-600">american phonetics</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--fg-muted)] pt-2 border-t border-[var(--border)]">
                  <span>Guaranteed 100% zero hyphens. Uses American English letters only.</span>
                  <button
                    type="button"
                    onClick={handleCopyPhonetics}
                    className="h-8 px-4 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-xs hover:opacity-90 shadow-sm"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-h-[360px] rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-xs text-[var(--fg-muted)] flex flex-col items-center justify-center text-center gap-3">
                <span className="text-2xl">🗣️</span>
                <strong className="text-[var(--fg)] text-sm">No Phonetic Conversion Yet</strong>
                <p className="max-w-md text-[var(--fg-subtle)]">
                  Paste lyrics on the left and click <strong>"Convert to American Phonetics"</strong>. The engine will transform every word into natural American singer & rapper pronunciation without using any hyphens.
                </p>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-[11px] text-left text-[var(--fg-subtle)] max-w-sm">
                  <p className="text-[var(--fg)] font-semibold mb-1">Key Pronunciation Rules:</p>
                  <p>• "the" → <span className="text-emerald-300 font-mono light:text-emerald-700">tha</span></p>
                  <p>• "probably" → <span className="text-emerald-300 font-mono light:text-emerald-700">problee</span></p>
                  <p>• "with" → <span className="text-emerald-300 font-mono light:text-emerald-700">wit</span></p>
                  <p>• "dropping" → <span className="text-emerald-300 font-mono light:text-emerald-700">droppin</span></p>
                  <p>• "going to" → <span className="text-emerald-300 font-mono light:text-emerald-700">gonna</span></p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
