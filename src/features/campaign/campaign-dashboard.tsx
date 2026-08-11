"use client";

import { BarChart3, BookOpenText, History, Newspaper, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PollChart } from "@/components/game/poll-chart";
import { StatGauge } from "@/components/game/stat-gauge";
import { Dialog } from "@/components/ui/dialog";
import type { GameState, StatementEvolution } from "@/game/types";
import { CATEGORY_LABELS, formatCampaignDate, formatInteger } from "@/lib/game-presentation";
import { cn } from "@/lib/utils";

type DashboardTab = "overview" | "program" | "history" | "news";

const tabs: Array<{ id: DashboardTab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "Synthèse", icon: BarChart3 },
  { id: "program", label: "Programme", icon: BookOpenText },
  { id: "history", label: "Décisions", icon: History },
  { id: "news", label: "Actualités", icon: Newspaper },
];

const EVOLUTION_LABELS: Partial<Record<StatementEvolution, string>> = {
  gradual_evolution: "Évolution progressive",
  coherent_compromise: "Compromis cohérent",
  strategic_repositioning: "Repositionnement",
  contradiction: "Contradiction",
  abrupt_reversal: "Revirement",
};

function DashboardTabs({
  tab,
  onTabChange,
}: {
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollAffordance = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    updateScrollAffordance();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateScrollAffordance);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={updateScrollAffordance}
        className="-mx-1 flex gap-1 overflow-x-auto scroll-px-1 px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Rubriques du tableau de bord"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex min-h-11 shrink-0 scroll-mx-1 items-center gap-2 rounded-xl px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
              tab === id
                ? "bg-[var(--navy-950)] text-white"
                : "text-[var(--ink-muted)] hover:bg-[var(--surface-raised)]",
            )}
          >
            <Icon aria-hidden="true" className="size-4" /> {label}
          </button>
        ))}
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-[linear-gradient(90deg,var(--paper),transparent)] transition-opacity duration-150",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-8 bg-[linear-gradient(270deg,var(--paper),transparent)] transition-opacity duration-150",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

export function CampaignDashboard({
  state,
  open,
  onOpenChange,
}: {
  state: GameState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const party = state.parties[state.playerPartyId];
  const latestPoll = state.pollHistory.at(-1);
  if (!party) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Quartier général"
      description={`${state.player.displayName} · ${party.displayName}`}
      className="max-w-4xl"
    >
      <DashboardTabs tab={tab} onTabChange={setTab} />

      {tab === "overview" ? (
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
          <section aria-labelledby="dashboard-stats">
            <h3
              id="dashboard-stats"
              className="text-sm font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]"
            >
              Indicateurs principaux
            </h3>
            <div className="mt-4 grid gap-4 rounded-2xl bg-[var(--surface)] p-5 sm:grid-cols-2">
              <StatGauge label="Intentions de vote" value={party.stats.polling} format="percent" />
              <StatGauge label="Popularité" value={party.stats.popularity} />
              <StatGauge label="Mobilisation" value={party.stats.mobilization} />
              <StatGauge label="Trésorerie" value={party.stats.finances} format="money" />
              <StatGauge label="Crédibilité" value={party.stats.credibility} />
              <StatGauge label="Cohésion" value={party.stats.cohesion} />
              <StatGauge label="Rejet" value={party.stats.rejection} polarity="unfavorable" />
            </div>
            <h3 className="mt-6 text-sm font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Signaux de campagne
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {[
                ["Adhérents", formatInteger(party.stats.members)],
                ["Présence média", Math.round(party.stats.mediaPresence)],
                ["Notoriété", Math.round(party.stats.awareness)],
                ["Dynamique", Math.round(party.stats.momentum)],
                ["Implantation", Math.round(party.stats.localStrength)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--line)] bg-white p-3">
                  <dt className="text-xs text-[var(--ink-muted)]">{label}</dt>
                  <dd className="mt-1 font-black tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="dashboard-poll">
            <h3
              id="dashboard-poll"
              className="text-sm font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]"
            >
              Dernier sondage
            </h3>
            {latestPoll ? (
              <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-5">
                <div className="mb-5 flex items-start justify-between gap-3 text-sm">
                  <div>
                    <strong>{latestPoll.instituteLabel}</strong>
                    <span className="block text-xs text-[var(--ink-muted)]">
                      {formatCampaignDate(latestPoll.date)}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-black",
                      latestPoll.playerTrend >= 0
                        ? "bg-emerald-50 text-[var(--success)]"
                        : "bg-red-50 text-[var(--red-700)]",
                    )}
                  >
                    {latestPoll.playerTrend >= 0 ? "+" : ""}
                    {latestPoll.playerTrend.toFixed(1)} pt
                  </span>
                </div>
                <PollChart poll={latestPoll} parties={state.parties} />
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {tab === "program" ? (
        <section className="mt-5">
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Orientations et déclarations
          </h3>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div>
              <h4 className="font-black">Programme initial</h4>
              <ol className="mt-3 space-y-2">
                {party.program.map((item, index) => (
                  <li key={item} className="flex gap-3 rounded-xl bg-[var(--surface)] p-4 text-sm">
                    <span className="font-black text-[var(--blue-600)]">{index + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h4 className="font-black">Positions prises en campagne</h4>
              {party.alliedWith.length ? (
                <p className="mt-2 rounded-xl bg-blue-50 p-3 text-xs text-[var(--blue-700)]">
                  Alliances actives :{" "}
                  {party.alliedWith
                    .map((partyId) => state.parties[partyId]?.shortName ?? partyId)
                    .join(", ")}
                </p>
              ) : null}
              {state.statementLedger.length ? (
                <ol className="mt-3 space-y-2">
                  {state.statementLedger
                    .slice()
                    .reverse()
                    .map((statement) => (
                      <li
                        key={`${statement.decisionIndex}-${statement.eventId}`}
                        className="rounded-xl border border-[var(--line)] p-4 text-sm"
                      >
                        <span className="text-xs font-black uppercase text-[var(--blue-600)]">
                          {statement.topic}
                        </span>
                        <p className="mt-1">« {statement.text} »</p>
                        {statement.evolution && EVOLUTION_LABELS[statement.evolution] ? (
                          <span
                            className={cn(
                              "mt-2 inline-flex rounded-full px-2 py-1 text-[0.65rem] font-black",
                              ["contradiction", "abrupt_reversal"].includes(statement.evolution)
                                ? "bg-red-50 text-[var(--red-700)]"
                                : "bg-emerald-50 text-[var(--success)]",
                            )}
                          >
                            {EVOLUTION_LABELS[statement.evolution]}
                          </span>
                        ) : null}
                      </li>
                    ))}
                </ol>
              ) : (
                <p className="mt-3 rounded-xl bg-[var(--surface)] p-4 text-sm text-[var(--ink-muted)]">
                  Vos prises de position apparaîtront ici au fil des événements de programme.
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {tab === "history" ? (
        <section className="mt-5">
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Journal des décisions
          </h3>
          {state.decisionHistory.length ? (
            <ol className="mt-4 space-y-3">
              {state.decisionHistory
                .slice()
                .reverse()
                .map((record) => (
                  <li
                    key={record.decisionIndex}
                    className="rounded-xl border border-[var(--line)] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-muted)]">
                      <span className="font-black uppercase text-[var(--blue-600)]">
                        Décision {record.decisionIndex} · {CATEGORY_LABELS[record.eventCategory]}
                      </span>
                      <time>{formatCampaignDate(record.date)}</time>
                    </div>
                    <h4 className="mt-2 font-black">{record.eventTitle}</h4>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">{record.choiceLabel}</p>
                    <p className="mt-2 text-sm font-bold">{record.outcomeTitle}</p>
                  </li>
                ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-[var(--ink-muted)]">
              Aucune décision prise pour l’instant.
            </p>
          )}
        </section>
      ) : null}

      {tab === "news" ? (
        <section className="mt-5">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            <Newspaper aria-hidden="true" className="size-4" /> Fil de campagne
          </h3>
          {state.publicNews.length ? (
            <ol className="mt-4 space-y-3">
              {state.publicNews
                .slice()
                .reverse()
                .map((item) => (
                  <li key={item.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
                    <time className="text-xs text-[var(--ink-muted)]">
                      {formatCampaignDate(item.date)}
                    </time>
                    <h4 className="mt-1 font-black">{item.headline}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                      {item.body}
                    </p>
                  </li>
                ))}
            </ol>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--surface)] p-4 text-sm text-[var(--ink-muted)]">
              <Users aria-hidden="true" className="size-5" /> La campagne s’installe. Les premières
              nouvelles arriveront bientôt.
            </div>
          )}
          {state.opponentActions.length ? (
            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <h4 className="text-sm font-black">Mouvements adverses récents</h4>
              <ol className="mt-3 space-y-2">
                {state.opponentActions
                  .slice(-5)
                  .reverse()
                  .map((action) => (
                    <li
                      key={`${action.decisionIndex}-${action.partyId}-${action.kind}`}
                      className="rounded-xl bg-[var(--surface)] p-3 text-sm text-[var(--ink-muted)]"
                    >
                      {action.summary}
                    </li>
                  ))}
              </ol>
            </div>
          ) : null}
        </section>
      ) : null}
    </Dialog>
  );
}
