import Link from "next/link";

import { BRANDING } from "@/config/branding";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface-raised)]">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-[var(--ink-muted)] sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <p>{BRANDING.shortFictionNotice} Aucun compte, aucune collecte de données.</p>
        <nav aria-label="Informations" className="flex flex-wrap gap-x-5">
          <Link
            className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            href="/methodologie"
          >
            Méthodologie
          </Link>
          <Link
            className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            href="/confidentialite"
          >
            Confidentialité
          </Link>
          <Link
            className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            href="/parametres"
          >
            Paramètres
          </Link>
        </nav>
      </div>
    </footer>
  );
}
