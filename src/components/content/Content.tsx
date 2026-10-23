import React from "react";

/** Shared building blocks for the Home and Guide pages so both read with one rhythm. */

export function ContentPage({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="w-full max-w-[76rem] mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col gap-14">
      {children}
    </main>
  );
}

export function Section({ id, eyebrow, title, intro, children }: {
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
        {eyebrow && (
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--fg-subtle)] mb-2">{eyebrow}</p>
        )}
        <h2 id={headingId} className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-[var(--fg)]">
          {title}
        </h2>
        {intro && <div className="mt-2 text-sm text-[var(--fg-muted)] leading-relaxed">{intro}</div>}
      </div>
      {children}
    </section>
  );
}

export function Card({ title, children, footer }: { title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] p-5 flex flex-col gap-2">
      <h3 className="text-base font-semibold text-[var(--fg)]">{title}</h3>
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

export function ButtonLink({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center h-11 px-5 rounded-[var(--r-md)] text-sm font-semibold transition-all ${
        primary
          ? "bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90"
          : "border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
      }`}
    >
      {children}
    </a>
  );
}
