import type { Metadata } from "next";
import Link from "next/link";

import { logoutAction } from "../admin-actions";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

const TABS = [
  { href: "/admin/analytics/overview", label: "Overview" },
  { href: "/admin/analytics/equilibrage", label: "Équilibrage" },
  { href: "/admin/analytics/gameplay", label: "Gameplay" },
  { href: "/admin/analytics/retention", label: "Rétention / Replay" },
  { href: "/admin/analytics/qualite", label: "Qualité" },
  { href: "/admin/analytics/versions", label: "Versions" },
] as const;

export default function AdminAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--blue-600)]">
            Espace privé
          </p>
          <h1 className="font-display text-3xl font-black uppercase">Analytics — Vers l’Élysée</h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-bold"
          >
            Déconnexion
          </button>
        </form>
      </div>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-[var(--line)] pb-3">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--ink-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
