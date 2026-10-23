import React from "react";
import { ResizeMode } from "../../hooks/useResizableDeck.ts";

type StartResize = (mode: ResizeMode, e: React.PointerEvent) => void;

const EDGE =
  "absolute z-40 group flex items-center justify-center select-none hover:bg-[var(--accent)]/30 active:bg-[var(--accent)]/50 transition-colors";
const GRIP = "rounded-full bg-[var(--border-strong)] group-hover:bg-[var(--accent)] transition-colors opacity-40 group-hover:opacity-100";
const CORNER =
  "absolute bottom-0 w-6 h-6 z-50 flex items-end p-1 select-none group hover:bg-[var(--accent)]/40 active:bg-[var(--accent)]/60 transition-colors";

function CornerIcon({ side }: { side: "left" | "right" }) {
  const lines =
    side === "right"
      ? [[20, 8, 8, 20], [20, 14, 14, 20]]
      : [[4, 8, 16, 20], [4, 14, 10, 20]];
  return (
    <svg
      className="w-3.5 h-3.5 text-[var(--fg-subtle)] group-hover:text-[var(--accent)] transition-colors"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      {lines.map(([x1, y1, x2, y2]) => (
        <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </svg>
  );
}

/** Drag edges and corners of the studio deck; pointer-only, so hidden on small screens. */
export default function ResizeHandles({ onStart }: { onStart: StartResize }) {
  return (
    <div className="hidden md:block" aria-hidden="true">
      <div
        onPointerDown={(e) => onStart("width-right", e)}
        className={`${EDGE} top-0 right-0 bottom-0 w-3.5 cursor-ew-resize`}
        title="Drag to resize width"
      >
        <div className={`${GRIP} w-1 h-12`} />
      </div>
      <div
        onPointerDown={(e) => onStart("width-left", e)}
        className={`${EDGE} top-0 left-0 bottom-0 w-3.5 cursor-ew-resize`}
        title="Drag to resize width"
      >
        <div className={`${GRIP} w-1 h-12`} />
      </div>
      <div
        onPointerDown={(e) => onStart("height", e)}
        className={`${EDGE} bottom-0 left-0 right-0 h-3.5 cursor-ns-resize`}
        title="Drag to resize height"
      >
        <div className={`${GRIP} h-1 w-20`} />
      </div>
      <div
        onPointerDown={(e) => onStart("both", e)}
        className={`${CORNER} right-0 cursor-nwse-resize rounded-br-2xl justify-end`}
        title="Drag to resize width and height"
      >
        <CornerIcon side="right" />
      </div>
      <div
        onPointerDown={(e) => onStart("both", e)}
        className={`${CORNER} left-0 cursor-nesw-resize rounded-bl-2xl justify-start`}
        title="Drag to resize width and height"
      >
        <CornerIcon side="left" />
      </div>
    </div>
  );
}
