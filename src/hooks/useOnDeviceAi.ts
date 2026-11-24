import { useCallback, useEffect, useState } from "react";
import { aiAvailability, loadAiPref, saveAiPref, type AiAvailability } from "../lib/ai/on-device.ts";

export interface OnDeviceAi {
  /** What this browser offers: "unavailable" outside desktop Chrome with built-in AI. */
  availability: AiAvailability;
  /** The user turned AI on (after agreeing in the permission dialog) and the browser supports it. */
  on: boolean;
  /** The permission dialog is open. */
  asking: boolean;
  /** Chrome has its model (or the user already agreed to the download this visit): no download prompt. */
  modelReady: boolean;
  /** The user agreed to the model download; applies to every result card. */
  allowDownload: () => void;
  /** Opens the permission dialog; AI stays off until the user agrees. */
  requestOn: () => void;
  agree: () => void;
  decline: () => void;
  turnOff: () => void;
}

/** On-device AI state. Off unless the user turns it on and agrees in the permission dialog. */
export function useOnDeviceAi(): OnDeviceAi {
  const [availability, setAvailability] = useState<AiAvailability>("unavailable");
  const [pref, setPref] = useState(loadAiPref);
  const [asking, setAsking] = useState(false);
  const [downloadAllowed, setDownloadAllowed] = useState(false);

  useEffect(() => {
    let live = true;
    aiAvailability().then((a) => live && setAvailability(a));
    return () => {
      live = false;
    };
  }, []);

  const set = useCallback((v: boolean) => {
    setPref(v);
    saveAiPref(v);
  }, []);

  return {
    availability,
    on: pref && availability !== "unavailable",
    asking,
    modelReady: availability === "available" || downloadAllowed,
    allowDownload: () => setDownloadAllowed(true),
    requestOn: () => setAsking(true),
    agree: () => {
      set(true);
      setAsking(false);
    },
    decline: () => setAsking(false),
    turnOff: () => set(false),
  };
}
