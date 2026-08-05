import { Archive, Award, Landmark } from "lucide-react";
import Link from "next/link";

import { BRANDING } from "@/config/branding";

const nav = [
  { href: "/archives", label: "Archives", icon: Archive },
  { href: "/badges", label: "Succès", icon: Award },
  { href: "/a-propos", label: "À propos", icon: Landmark },
];

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-[var(--navy-950)] text-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-400)]"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full border border-[var(--gold-400)] text-[var(--gold-300)]"
          >
            V
          </span>
          <span className="font-display text-lg font-black uppercase tracking-[0.09em]">
            {BRANDING.name}
          </span>
        </Link>
        <nav aria-label="Navigation principale" className="flex items-center gap-1 sm:gap-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-slate-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-400)] sm:px-3"
            >
              <Icon aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
