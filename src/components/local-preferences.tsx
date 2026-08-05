"use client";

import { useEffect } from "react";

import { getLocalSettings } from "@/lib/storage/game-database";

export function LocalPreferences() {
  useEffect(() => {
    void getLocalSettings()
      .then((settings) => {
        document.documentElement.dataset.reduceMotion = String(settings.reducedMotion);
      })
      .catch(() => undefined);
  }, []);
  return null;
}
