"use client";

import {
  Archive,
  Award,
  Check,
  Copy,
  Landmark,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PartyMark } from "@/components/game/party-mark";
import { StatGauge } from "@/components/game/stat-gauge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gameContent } from "@/game/data";
import type { GameState, IdeologyAxis } from "@/game/types";
import { formatInteger, formatPercent, REGION_LABELS } from "@/lib/game-presentation";
import { ShareResult } from "@/features/sharing/share-result";
import { useGameStore } from "@/features/campaign/gameStore";

const IDEOLOGY_LABELS: Record<IdeologyAxis, [string, string, string]> = {
  economy: ["Économie", "État", "Marché"],
  society: ["Société", "Progressisme", "Conservatisme"],
  europe: ["Europe", "Souveraineté", "Fédéralisme"],
  ecology: ["Écologie", "Production", "Transformation"],
  authority: ["Autorité", "Libertés", "Ordre"],
  immigration: ["Immigration", "Ouverture", "Restriction"],
};

export function FinalScreen({ onReplay }: { onReplay: () => void | Promise<void> }) {
  const state = useGameStore((store) => store.gameState);
  const [copied, setCopied] = useState(false);
  if (!state?.finalResult) return null;
  const result = state.finalResult;
  const party = state.parties[state.playerPartyId];
  const rival = state.parties[result.rivalPartyId];
  if (!party) return null;
  const initialMembers = Number(state.flags.initialMembers ?? party.stats.members);
  const initialPopularity = Number(state.flags.initialPopularity ?? party.stats.popularity);
  const highlights = result.highlightDecisionIds
    .map((index) => state.decisionHistory.find((decision) => decision.decisionIndex === index))
    .filter((record) => record !== undefined)
    .slice(0, 5);
  const best = result.bestDecisionIndex
    ? state.decisionHistory.find((record) => record.decisionIndex === result.bestDecisionIndex)
    : undefined;
  const costliest = result.costliestDecisionIndex
    ? state.decisionHistory.find((record) => record.decisionIndex === result.costliestDecisionIndex)
    : undefined;
  const badges = result.unlockedAchievementIds
    .map((id) => gameContent.achievements.find((achievement) => achievement.id === id))
    .filter((achievement) => achievement !== undefined);

  const copySeed = async () => {
    await navigator.clipboard.writeText(state.seed);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_800);
  };

  return (
    <div className="bg-[var(--surface)]">
      <section className="relative overflow-hidden bg-[var(--navy-950)] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(210,173,98,0.18),transparent_30rem),linear-gradient(120deg,transparent_0_62%,rgba(76,131,203,0.17)_62%_63%,transparent_63%)]"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-9 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <div className="flex items-center gap-4">
              <PartyMark visual={party.visual} name={party.displayName} size="large" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-300)]">
                  Fin de campagne · Résultat fictif
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {state.player.displayName} · {party.displayName}
                </p>
              </div>
            </div>
            <h1 className="mt-8 max-w-4xl font-display text-5xl font-black uppercase leading-[0.92] tracking-tight sm:text-7xl">
              {result.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-200">
              {result.narrative}
            </p>
          </div>
          <div
            className="grid size-52 shrink-0 place-items-center justify-self-center rounded-full p-4 lg:justify-self-end"
            style={{
              background: `conic-gradient(var(--gold-400) ${result.score}%, rgba(255,255,255,.12) 0)`,
            }}
            aria-label={`Score global ${result.score} sur 100`}
          >
            <div className="grid size-full place-items-center rounded-full bg-[var(--navy-950)] text-center">
              <div>
                <span className="font-display text-6xl font-black text-[var(--gold-300)]">
                  {result.score}
                </span>
                <span className="block text-xs font-black uppercase tracking-[0.15em] text-slate-300">
                  sur 100
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
          aria-label="Résultats principaux"
        >
          <ResultMetric
            label="Premier tour"
            value={`${result.playerRank}${result.playerRank === 1 ? "er" : "e"}`}
            detail={formatPercent(result.firstRound.results[state.playerPartyId] ?? 0)}
          />
          <ResultMetric
            label={result.secondRound ? "Second tour" : "Dernier score"}
            value={formatPercent(result.finalVoteShare)}
            detail={
              result.won ? "Victoire" : result.qualified ? "Qualification obtenue" : "Élimination"
            }
          />
          <ResultMetric
            label="Progression"
            value={`${result.pollingProgression >= 0 ? "+" : ""}${result.pollingProgression.toFixed(1)} pt`}
            detail={`Départ : ${result.startingPolling.toFixed(1)} %`}
            positive={result.pollingProgression >= 0}
          />
          <ResultMetric
            label="Participation"
            value={formatPercent((result.secondRound ?? result.firstRound).turnout)}
            detail="Scrutin simulé"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5 sm:p-7">
            <h2 className="text-2xl font-black">Évolution de la campagne</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Intentions de vote fictives observées dans les bulletins.
            </p>
            <PollTrend state={state} />
          </Card>
          <Card className="p-5 sm:p-7">
            <h2 className="text-2xl font-black">Pourquoi ce score ?</h2>
            <div className="mt-5 space-y-4">
              {[
                ["Performance électorale", result.breakdown.electoralPerformance, 30],
                ["Progression", result.breakdown.progression, 20],
                ["Qualification et victoire", result.breakdown.qualificationAndVictory, 15],
                ["Croissance du parti", result.breakdown.partyGrowth, 10],
                ["Cohérence stratégique", result.breakdown.consistency, 10],
                [
                  "Héritage et exploits",
                  result.breakdown.legacy + result.breakdown.specialAchievements,
                  15,
                ],
              ].map(([label, value, maximum]) => (
                <div key={String(label)}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-bold text-[var(--ink-muted)]">{label}</span>
                    <strong>
                      {value} / {maximum}
                    </strong>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                    <div
                      className="h-full rounded-full bg-[var(--blue-600)]"
                      style={{ width: `${(Number(value) / Number(maximum)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5 sm:p-7">
            <h2 className="text-2xl font-black">Le mouvement à l’arrivée</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <StatGauge
                label={`Popularité · départ ${Math.round(initialPopularity)}`}
                value={party.stats.popularity}
              />
              <StatGauge label="Trésorerie finale" value={party.stats.finances} format="money" />
              <StatGauge label="Cohésion finale" value={party.stats.cohesion} />
              <StatGauge label="Mobilisation finale" value={party.stats.mobilization} />
            </div>
            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-[var(--surface)] p-4">
              <Users aria-hidden="true" className="size-7 text-[var(--blue-600)]" />
              <div>
                <span className="block text-xs text-[var(--ink-muted)]">
                  Évolution des adhérents
                </span>
                <strong className="text-lg">
                  {party.stats.members - initialMembers >= 0 ? "+" : ""}
                  {formatInteger(party.stats.members - initialMembers)}
                </strong>
                <span className="ml-2 text-xs text-[var(--ink-muted)]">
                  ({formatInteger(party.stats.members)} au total)
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-5 sm:p-7">
            <h2 className="text-2xl font-black">Positionnement final</h2>
            <div className="mt-5 space-y-4">
              {(Object.keys(IDEOLOGY_LABELS) as IdeologyAxis[]).map((axis) => {
                const [label, left, right] = IDEOLOGY_LABELS[axis];
                const value = party.perceivedIdeology[axis];
                return (
                  <div key={axis}>
                    <div className="flex justify-between text-xs">
                      <strong>{label}</strong>
                      <span className="text-[var(--ink-muted)]">
                        {value < -12 ? left : value > 12 ? right : "Équilibre"}
                      </span>
                    </div>
                    <div className="relative mt-2 h-2 rounded-full bg-[linear-gradient(90deg,var(--blue-400),var(--surface-raised),var(--red-700))]">
                      <span
                        className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--navy-950)] shadow"
                        style={{ left: `${(value + 100) / 2}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <Card className="p-5 sm:p-7">
            <h2 className="flex items-center gap-2 text-2xl font-black">
              <Landmark aria-hidden="true" className="size-6 text-[var(--blue-600)]" /> Territoires
              forts
            </h2>
            <ol className="mt-5 space-y-3">
              {result.strongestRegions.map((regionId, index) => (
                <li
                  key={regionId}
                  className="flex items-center gap-3 rounded-xl bg-[var(--surface)] p-4"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-[var(--navy-950)] font-black text-white">
                    {index + 1}
                  </span>
                  <strong>{REGION_LABELS[regionId]}</strong>
                </li>
              ))}
            </ol>
            {rival ? (
              <div className="mt-5 border-t border-[var(--line)] pt-5">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                  Principal rival
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <PartyMark visual={rival.visual} name={rival.displayName} size="small" />
                  <strong>{rival.displayName}</strong>
                </div>
              </div>
            ) : null}
          </Card>
          <Card className="p-5 sm:p-7">
            <h2 className="text-2xl font-black">Moments marquants</h2>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2">
              {highlights.map((record) => (
                <li
                  key={record.decisionIndex}
                  className="rounded-xl border border-[var(--line)] p-4"
                >
                  <span className="text-[0.65rem] font-black uppercase tracking-wider text-[var(--blue-600)]">
                    Décision {record.decisionIndex}
                  </span>
                  <h3 className="mt-1 font-black">{record.eventTitle}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">{record.outcomeTitle}</p>
                </li>
              ))}
            </ol>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {best ? (
                <div className="rounded-xl bg-emerald-50 p-4">
                  <span className="text-xs font-black text-[var(--success)]">Meilleur choix</span>
                  <p className="mt-1 text-sm font-bold">{best.choiceLabel}</p>
                </div>
              ) : null}
              {costliest ? (
                <div className="rounded-xl bg-red-50 p-4">
                  <span className="text-xs font-black text-[var(--red-700)]">
                    Décision la plus coûteuse
                  </span>
                  <p className="mt-1 text-sm font-bold">{costliest.choiceLabel}</p>
                </div>
              ) : null}
            </div>
          </Card>
        </section>

        <Card className="p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <Award aria-hidden="true" className="size-7 text-[var(--warning)]" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[var(--ink-muted)]">
                Collection locale
              </p>
              <h2 className="text-2xl font-black">Badges débloqués</h2>
            </div>
          </div>
          {badges.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <div key={badge.id} className="flex gap-3 rounded-xl bg-amber-50 p-4">
                  <span aria-hidden="true" className="text-2xl">
                    {badge.icon}
                  </span>
                  <div>
                    <strong className="text-sm">{badge.title}</strong>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-[var(--ink-muted)]">
              Cette campagne n’a pas encore révélé de badge.
            </p>
          )}
        </Card>

        <Card className="p-5 sm:p-7">
          <ShareResult state={state} />
        </Card>

        <Card className="p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[var(--ink-muted)]">
                Graine déterministe
              </p>
              <code className="mt-2 block max-w-full break-all rounded-lg bg-[var(--surface)] px-3 py-2 text-sm">
                {state.seed}
              </code>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" onClick={copySeed}>
                {copied ? (
                  <Check aria-hidden="true" className="size-4" />
                ) : (
                  <Copy aria-hidden="true" className="size-4" />
                )}
                {copied ? "Copiée" : "Copier la graine"}
              </Button>
              <Button asChild variant="secondary">
                <Link href="/archives">
                  <Archive aria-hidden="true" className="size-4" /> Voir au panthéon
                </Link>
              </Button>
              <Button onClick={onReplay}>
                <RotateCcw aria-hidden="true" className="size-4" /> Rejouer
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

function ResultMetric({
  label,
  value,
  detail,
  positive,
}: {
  label: string;
  value: string;
  detail: string;
  positive?: boolean;
}) {
  return (
    <Card className="p-5">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {label}
      </span>
      <div className="mt-3 flex items-center gap-2">
        {positive === true ? (
          <TrendingUp aria-hidden="true" className="size-5 text-[var(--success)]" />
        ) : positive === false ? (
          <TrendingDown aria-hidden="true" className="size-5 text-[var(--red-700)]" />
        ) : null}
        <strong className="font-display text-3xl font-black">{value}</strong>
      </div>
      <span className="mt-2 block text-xs text-[var(--ink-muted)]">{detail}</span>
    </Card>
  );
}

function PollTrend({ state }: { state: GameState }) {
  const values = state.pollHistory.map((poll) => poll.results[state.playerPartyId] ?? 0);
  const all = values.length ? values : [state.parties[state.playerPartyId]?.initialPolling ?? 0];
  const width = 620;
  const height = 180;
  const max = Math.max(...all, 10) + 2;
  const min = Math.max(0, Math.min(...all) - 2);
  const points = all
    .map((value, index) => {
      const x = all.length === 1 ? width / 2 : (index / (all.length - 1)) * width;
      const y = height - ((value - min) / Math.max(1, max - min)) * (height - 24) - 12;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <figure className="mt-5">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Évolution des intentions de vote de ${all[0]?.toFixed(1)} à ${all.at(-1)?.toFixed(1)} pour cent`}
      >
        <defs>
          <linearGradient id="poll-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d56a0" stopOpacity="0.3" />
            <stop offset="1" stopColor="#1d56a0" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={height * ratio}
            y2={height * ratio}
            stroke="#d8d6d0"
            strokeDasharray="4 6"
          />
        ))}
        <polyline
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#poll-area)"
          stroke="none"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#1d56a0"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs text-[var(--ink-muted)]">
        <span>Premier bulletin · {all[0]?.toFixed(1)} %</span>
        <span>Dernier bulletin · {all.at(-1)?.toFixed(1)} %</span>
      </figcaption>
    </figure>
  );
}
