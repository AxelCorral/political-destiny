"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { flush, flushOnPageHide, track } from "@/analytics/client";
import { getAnalyticsMode } from "@/analytics/config";

const FLUSH_INTERVAL_MS = 30_000;

/**
 * Wires the analytics client's retry triggers to real browser lifecycle
 * events. Mounted once in the root layout, alongside PwaRegistrar and
 * LocalPreferences — same pattern, same guarantee: this component never
 * renders anything and never throws into the tree it sits in.
 */
export function AnalyticsProvider() {
  const pathname = usePathname();
  const sessionAnnounced = useRef(false);

  useEffect(() => {
    if (getAnalyticsMode() === "off") return;
    void flush();
    const onOnline = () => void flush();
    const onPageHide = () => flushOnPageHide();
    window.addEventListener("online", onOnline);
    window.addEventListener("pagehide", onPageHide);
    const interval = window.setInterval(() => void flush(), FLUSH_INTERVAL_MS);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (sessionAnnounced.current) return;
    sessionAnnounced.current = true;
    track("session_started", undefined, { entryPath: pathname ?? "/" });
    // Only ever announced once per app mount — not once per route change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
