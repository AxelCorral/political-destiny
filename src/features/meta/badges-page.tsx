"use client";

import { Award, LockKeyhole, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { gameContent } from "@/game/data";
import type { AchievementDefinition } from "@/game/types";
import { getLocalProfile, type LocalProfile } from "@/lib/storage/game-database";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<AchievementDefinition["category"], string> = {
  first_campaigns: "Premières campagnes",
  wins: "Victoires et qualifications",
  party: "Partis et fidélité",
  communication: "Communication et débats",
  ideology: "Idéologie et programme",
  alliances: "Alliances et rivalités",
  records: "Records de campagne",
  secret_endings: "Fins secrètes",
};

export function BadgesPageClient() {
  const [profile, setProfile] = useState<LocalProfile>();

  useEffect(() => {
    void getLocalProfile().then(setProfile);
  }, []);

  const unlocked = new Set(profile?.unlockedAchievementIds ?? []);
  const visibleUnlocked = gameContent.achievements.filter((badge) => unlocked.has(badge.id)).length;
  const categories = Object.keys(CATEGORY_LABELS) as AchievementDefinition["category"][];

  return (
    <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_19rem] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--blue-600)]">
            Collection locale
          </p>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-none">
            Succès de campagne
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--ink-muted)]">
            Chaque badge récompense une trajectoire, un style de jeu ou une fin particulière. Les
            succès secrets gardent leur intitulé caché jusqu’à leur découverte.
          </p>
        </div>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-[var(--warning)]">
              <Trophy aria-hidden="true" className="size-6" />
            </span>
            <div>
              <strong className="font-display text-3xl font-black">{visibleUnlocked}</strong>
              <span className="ml-1 text-sm text-[var(--ink-muted)]">
                / {gameContent.achievements.length}
              </span>
              <span className="block text-xs text-[var(--ink-muted)]">badges débloqués</span>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-raised)]">
            <div
              className="h-full rounded-full bg-[var(--gold-400)]"
              style={{ width: `${(visibleUnlocked / gameContent.achievements.length) * 100}%` }}
            />
          </div>
        </Card>
      </div>

      {profile === undefined ? (
        <p className="mt-10 text-sm text-[var(--ink-muted)]">Lecture de votre collection…</p>
      ) : (
        <div className="mt-10 space-y-10">
          {categories.map((category) => {
            const badges = gameContent.achievements.filter((badge) => badge.category === category);
            return (
              <section key={category} aria-labelledby={`category-${category}`}>
                <h2
                  id={`category-${category}`}
                  className="flex items-center gap-2 text-xl font-black"
                >
                  <Award aria-hidden="true" className="size-5 text-[var(--blue-600)]" />{" "}
                  {CATEGORY_LABELS[category]}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {badges.map((badge) => {
                    const isUnlocked = unlocked.has(badge.id);
                    const concealed = badge.secret && !isUnlocked;
                    return (
                      <Card
                        key={badge.id}
                        className={cn(
                          "flex min-h-36 gap-4 p-5",
                          !isUnlocked && "bg-[var(--surface-raised)] opacity-70",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid size-12 shrink-0 place-items-center rounded-2xl text-2xl",
                            isUnlocked ? "bg-amber-50" : "bg-white text-[var(--ink-muted)]",
                          )}
                        >
                          {isUnlocked ? badge.icon : <LockKeyhole className="size-5" />}
                        </span>
                        <div>
                          <p className="text-[0.65rem] font-black uppercase tracking-[0.13em] text-[var(--ink-muted)]">
                            {isUnlocked ? "Débloqué" : "À découvrir"}
                          </p>
                          <h3 className="mt-1 font-black">
                            {concealed ? "Succès secret" : badge.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                            {concealed
                              ? "Une trajectoire inhabituelle révélera ce badge."
                              : badge.description}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
