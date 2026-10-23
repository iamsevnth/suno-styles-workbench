import React, { useRef, useState } from "react";

export type ResizeMode = "width-right" | "width-left" | "height" | "both";

const WIDTH_KEY = "suno_wb_width";
const HEIGHT_KEY = "suno_wb_height";
const MIN_WIDTH = 680;
const MIN_HEIGHT = 500;

function readSize(key: string): number | null {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? parseInt(saved, 10) : null;
  } catch {
    return null;
  }
}

function writeSize(key: string, value: number | null): void {
  try {
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, String(value));
  } catch {
    // Storage blocked: the size simply resets next visit.
  }
}

/** Drag-to-resize for the studio deck; sizes persist for the browser session. */
export function useResizableDeck() {
  const deckRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(() => readSize(WIDTH_KEY));
  const [height, setHeight] = useState<number | null>(() => readSize(HEIGHT_KEY));
  const [resizing, setResizing] = useState<ResizeMode | null>(null);

  const startResize = (mode: ResizeMode, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const deck = deckRef.current;
    if (!deck) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const { width: startW, height: startH } = deck.getBoundingClientRect();

    setResizing(mode);
    document.body.style.userSelect = "none";
    document.body.style.cursor = mode === "height" ? "ns-resize" : mode === "both" ? "nwse-resize" : "ew-resize";

    const onPointerMove = (move: PointerEvent) => {
      if (mode !== "height") {
        const deltaX = mode === "width-left" ? startX - move.clientX : move.clientX - startX;
        setWidth(Math.max(MIN_WIDTH, Math.min(window.innerWidth - 24, Math.round(startW + deltaX * 2))));
      }
      if (mode === "height" || mode === "both") {
        setHeight(Math.max(MIN_HEIGHT, Math.round(startH + move.clientY - startY)));
      }
    };

    const onPointerUp = () => {
      setResizing(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      const rect = deckRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (mode !== "height") writeSize(WIDTH_KEY, Math.round(rect.width));
      if (mode === "height" || mode === "both") writeSize(HEIGHT_KEY, Math.round(rect.height));
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const resetSize = () => {
    setWidth(null);
    setHeight(null);
    writeSize(WIDTH_KEY, null);
    writeSize(HEIGHT_KEY, null);
  };

  const isFullWidth = width != null && width > window.innerWidth - 60;

  const toggleFullWidth = () => {
    if (isFullWidth) {
      resetSize();
      return;
    }
    const full = window.innerWidth - 32;
    setWidth(full);
    writeSize(WIDTH_KEY, full);
  };

  return { deckRef, width, height, resizing, startResize, resetSize, isFullWidth, toggleFullWidth };
}
