import Icon from "../icons/Icon.tsx";

const OFFLINE_FILE = "suno-workbench.html";

/** The offline file is built next to index.html; a copy opened from disk has nothing to download. */
export const isOfflineCopy = typeof window !== "undefined" && window.location.protocol === "file:";

export default function OfflineDownloadLink({
  className = "",
  label = "Download Offline File",
  primary = false,
}: {
  className?: string;
  label?: string;
  primary?: boolean;
}) {
  if (isOfflineCopy) return null;
  return (
    <a
      href={`${import.meta.env.BASE_URL}${OFFLINE_FILE}`}
      download={OFFLINE_FILE}
      title="One self-contained HTML file that runs with no internet connection"
      className={`items-center justify-center gap-1.5 rounded-lg text-xs font-semibold h-8 px-3 transition-all ${
        primary
          ? "btn-primary"
          : "border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--fg)] shadow-sm"
      } ${className}`}
    >
      <Icon name="download" size={14} />
      <span>{label}</span>
    </a>
  );
}
