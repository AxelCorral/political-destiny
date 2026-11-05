import { ArrowRight, BarChart3, CalendarDays, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BRANDING } from "@/config/branding";
import { ActiveCampaignCard } from "@/features/campaign/active-campaign-card";
import { NewCampaignButton } from "@/features/campaign/new-campaign-button";
import { HomeStage3D } from "@/features/three/stage-3d";

const promises = [
  { icon: CalendarDays, value: "8 mois", label: "de campagne" },
  { icon: BarChart3, value: "≈ 30", label: "décisions" },
  { icon: ShieldCheck, value: "100 % local", label: "sans compte" },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-[var(--navy-950)] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0_55%,rgba(210,173,98,0.12)_55%_56%,transparent_56%),radial-gradient(circle_at_80%_20%,rgba(76,131,203,0.28),transparent_32rem)]"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-[var(--gold-300)]">
              <span className="h-px w-8 bg-current" aria-hidden="true" />
              Simulation narrative française
            </p>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.92] tracking-[-0.03em] sm:text-7xl lg:text-8xl">
              Vers
              <br />
              <span className="text-[var(--gold-300)]">l’Élysée</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-200 sm:text-xl">
              {BRANDING.tagline} Faites campagne, survivez aux crises et tentez de convaincre sans
              jamais tout contrôler.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {/* Intention explicite : ce CTA démarre une campagne. Il ne doit
                  jamais devenir un alias silencieux de « Reprendre » quand une
                  sauvegarde existe — mais il laisse le choix, car le joueur qui
                  clique ici ne sait pas forcément qu'une campagne l'attend. */}
              <NewCampaignButton asLink offerResume size="large">
                Lancer une campagne <ArrowRight aria-hidden="true" className="size-5" />
              </NewCampaignButton>
              <Button
                asChild
                size="large"
                variant="secondary"
                className="border-white/25 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/methodologie">Comment fonctionne la simulation ?</Link>
              </Button>
            </div>
          </div>

          <div className="relative -mx-4 sm:mx-0">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_50%_40%,#f6efe2,#d9cbb3)] shadow-2xl">
              <HomeStage3D />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {promises.map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-black/15 p-3">
                  <Icon aria-hidden="true" className="mb-3 size-5 text-[var(--gold-300)]" />
                  <strong className="block text-sm sm:text-base">{value}</strong>
                  <span className="text-xs text-slate-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ActiveCampaignCard />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[var(--line)] bg-white/65 p-5 text-sm leading-relaxed text-[var(--ink-muted)] sm:p-6">
          <strong className="text-[var(--ink)]">Fiction satirique.</strong> Les candidats sont les
          personnalités réellement déclarées pour 2027, représentées en figurines caricaturales. Les
          péripéties, sondages, résultats et scénarios (primaires, désistements, inéligibilité…)
          sont inventés pour le jeu : aucune citation ni accusation n’est attribuée à une personne
          réelle. Le projet est indépendant, sans affiliation avec un parti, et ne constitue pas une
          prédiction.
        </div>
      </section>
    </>
  );
}
