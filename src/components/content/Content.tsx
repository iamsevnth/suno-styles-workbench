import React from "react";
import { headlineCase } from "../../lib/text/headline-case.ts";
import Icon from "../icons/Icon.tsx";
import type { IconName } from "../icons/icon-data.ts";

/** Shared building blocks for the Home and Guide pages so both read with one rhythm. */

export function ContentPage({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="w-full max-w-[76rem] mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col gap-14">
      {children}
    </main>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-24 flex flex-col gap-5">
      <div className="max-w-3xl">
        {eyebrow && <p className="label-caps eyebrow mb-2">{eyebrow}</p>}
        <h2 id={headingId} className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-[var(--fg)]">
          {headlineCase(title)}
        </h2>
        {intro && <div className="mt-2 text-sm text-[var(--fg-muted)] leading-relaxed">{intro}</div>}
      </div>
      {children}
    </section>
  );
}

export type TileColor = "blue" | "violet" | "magenta" | "coral" | "orange" | "cyan" | "green" | "amber";

/** A rounded icon tile: tinted with one brand hue in both themes. */
export function IconTile({ icon, color, size = 40 }: { icon: IconName; color: TileColor; size?: number }) {
  return (
    <span className={`icon-tile tile-${color}`} style={{ width: size, height: size }}>
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </span>
  );
}

export function Card({
  title,
  children,
  footer,
  icon,
  tile = "blue",
  accent,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  icon?: IconName;
  tile?: TileColor;
  /** A thin colored rule across the top of the card in light mode. */
  accent?: "blue" | "violet" | "orange";
}) {
  return (
    <div
      className={`surface rounded-[var(--r-xl)] p-5 flex flex-col gap-2 ${accent ? `card-accent accent-${accent}` : ""}`}
    >
      <div className="flex items-center gap-3">
        {icon && <IconTile icon={icon} color={tile} />}
        <h3 className="text-base font-semibold text-[var(--fg)]">
          {typeof title === "string" ? headlineCase(title) : title}
        </h3>
      </div>
      <div className="text-sm text-[var(--fg-muted)] leading-relaxed flex flex-col gap-2">{children}</div>
      {footer && <div className="pt-2 mt-auto">{footer}</div>}
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl text-sm text-[var(--fg-muted)] leading-relaxed flex flex-col gap-3">{children}</div>;
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[0.8rem] rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[var(--fg)]">
      {children}
    </code>
  );
}

export function ButtonLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[var(--r-md)] text-sm font-semibold transition-all ${
        primary ? "btn-primary" : "surface text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
      }`}
    >
      {children}
      {primary && <Icon name="arrowRight" size={16} />}
    </a>
  );
}

/** A table on wider screens; a stack of labeled cards on phones, where columns get too narrow to read. */
export function Table({ head, rows, caption }: { head: string[]; rows: React.ReactNode[][]; caption?: string }) {
  return (
    <>
      <div className="md:hidden flex flex-col gap-2" aria-label={caption}>
        {rows.map((row, r) => (
          <div
            key={r}
            className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-sm"
          >
            <p className="font-semibold text-[var(--fg)]">{row[0]}</p>
            <dl>
              {row.slice(1).map((cell, i) => (
                <div key={i} className="mt-2">
                  <dt className="label-caps-sm">{head[i + 1]}</dt>
                  <dd className="text-[var(--fg-muted)] leading-relaxed">{cell}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <TableGrid head={head} rows={rows} caption={caption} />
    </>
  );
}

function TableGrid({ head, rows, caption }: { head: string[]; rows: React.ReactNode[][]; caption?: string }) {
  return (
    <div className="hidden md:block overflow-x-auto rounded-[var(--r-xl)] border border-[var(--border)]">
      <table className="w-full text-sm text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-[var(--bg-elevated)] text-[var(--fg)]">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-t border-[var(--border)] align-top">
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-4 py-3 font-medium text-[var(--fg)] whitespace-nowrap">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="px-4 py-3 text-[var(--fg-muted)]">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type ProvenanceKind = "suno" | "community" | "workbench";

const PROVENANCE: Record<ProvenanceKind, { label: string; className: string }> = {
  suno: {
    label: "Suno official",
    className:
      "border-emerald-500/40 text-emerald-300 bg-emerald-500/10 light:border-emerald-300 light:text-emerald-700 light:bg-emerald-50",
  },
  community: {
    label: "Community-tested",
    className: "border-sky-500/40 text-sky-300 bg-sky-500/10 light:border-sky-300 light:text-sky-700 light:bg-sky-50",
  },
  workbench: {
    label: "Workbench recommendation",
    className:
      "border-amber-500/40 text-amber-200 bg-amber-500/10 light:border-amber-300 light:text-amber-700 light:bg-amber-50",
  },
};

/** Labels where a claim comes from, so readers can weigh it. */
export function Provenance({ kind }: { kind: ProvenanceKind }) {
  const { label, className } = PROVENANCE[kind];
  return (
    <span className={`label-caps-sm inline-block whitespace-nowrap rounded-full border px-2 py-0.5 ${className}`}>
      {label}
    </span>
  );
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      className="underline underline-offset-2 text-[var(--fg)] hover:opacity-80"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
