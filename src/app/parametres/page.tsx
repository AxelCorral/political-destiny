import type { Metadata } from "next";

import { SettingsPageClient } from "@/features/meta/settings-page";

export const metadata: Metadata = {
  title: "Paramètres",
  description: "Préférences et données locales du jeu.",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
