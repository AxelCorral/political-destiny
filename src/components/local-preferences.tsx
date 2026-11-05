"use client";

import { useEffect } from "react";

import { getLocalSettings } from "@/lib/storage/game-database";

export function LocalPreferences() {
  useEffect(() => {
    void getLocalSettings()
      .then((settings) => {
        document.documentElement.dataset.reduceMotion = String(settings.reducedMotion);
        document.documentElement.dataset.scenes3d = String(settings.scenes3d);
        document.documentElement.dataset.tragicEvents = String(settings.tragicEvents);
      })
      .catch(() => undefined);
  }, []);
  return null;
}
