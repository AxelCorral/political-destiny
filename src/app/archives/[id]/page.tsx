import type { Metadata } from "next";

import { ArchiveDetailClient } from "@/features/meta/archive-pages";

export const metadata: Metadata = { title: "Détail d’une campagne" };

export default async function ArchiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArchiveDetailClient id={id} />;
}
