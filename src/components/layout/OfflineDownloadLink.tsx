const OFFLINE_FILE = "suno-workbench.html";

/** The offline file is built next to index.html; a copy opened from disk has nothing to download. */
export const isOfflineCopy = typeof window !== "undefined" && window.location.protocol === "file:";

export default function OfflineDownloadLink({ className = "", label = "Download Offline File" }: { className?: string; label?: string }) {
  if (isOfflineCopy) return null;
  return (
    <a
      href={`${import.meta.env.BASE_URL}${OFFLINE_FILE}`}
      download={OFFLINE_FILE}
      title="One self-contained HTML file that runs with no internet connection"
      className={`items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-subtle)] text-[var(--fg)] text-xs font-semibold h-8 px-3 transition-colors shadow-sm ${className}`}
    >
      <span aria-hidden="true">💾</span>
      <span>{label}</span>
    </a>
  );
}
