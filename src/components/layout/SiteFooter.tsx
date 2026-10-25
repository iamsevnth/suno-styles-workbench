import { hrefFor, REPO_URL } from "../../routes.ts";

const CONTACT_EMAIL = "mateus@sevnthlabs.com";
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Suno Workbench: Site Support")}`;

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] mt-8">
      <div className="max-w-[76rem] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-[var(--fg-subtle)]">
        <p className="max-w-xl leading-relaxed">
          Suno Workbench is an independent tool and is not affiliated with or endorsed by Suno, Inc. Everything runs in
          your browser; nothing you type is sent anywhere.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-4">
          <a href={hrefFor("guide")} className="hover:text-[var(--fg)]">
            Guide &amp; Privacy
          </a>
          <a href={CONTACT_HREF} className="hover:text-[var(--fg)]">
            Contact or Report Broken Feature
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--fg)]">
            Source on GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
