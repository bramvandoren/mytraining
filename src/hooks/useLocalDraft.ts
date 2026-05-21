import { useEffect, useRef, useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";

const PREFIX = "ta-draft:";

/**
 * Persist arbitrary form state to localStorage with a debounce so we don't
 * thrash the disk. Returns the latest status for a "Saving... / Saved ✓" UI.
 *
 * Pass `enabled = false` (e.g. after a successful submit) to clear the draft
 * and stop persisting until re-enabled.
 */
export function useLocalDraft<T>(key: string, value: T, enabled = true, delayMs = 800) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullKey = PREFIX + key;

  useEffect(() => {
    if (!enabled) {
      try { localStorage.removeItem(fullKey); } catch { /* ignore */ }
      setStatus("idle");
      return;
    }
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(fullKey, JSON.stringify(value));
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delayMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [fullKey, value, enabled, delayMs]);

  return status;
}

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
}
