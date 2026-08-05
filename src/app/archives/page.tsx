import type { Metadata } from "next";

import { ArchivesPageClient } from "@/features/meta/archive-pages";

export const metadata: Metadata = {
  title: "Archives",
  description: "Panthéon local de vos campagnes fictives.",
};

export default function ArchivesPage() {
  return <ArchivesPageClient />;
}
