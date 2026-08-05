import type { Metadata } from "next";

import { BadgesPageClient } from "@/features/meta/badges-page";

export const metadata: Metadata = {
  title: "Succès",
  description: "Collection locale des badges de campagne.",
};

export default function BadgesPage() {
  return <BadgesPageClient />;
}
