"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Flag,
  Gauge,
  Landmark,
  Menu,
  Newspaper,
  Save,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";

import { PartyMark } from "@/components/game/party-mark";
import { PollChart } from "@/components/game/poll-chart";
import { RegionalMap } from "@/components/game/regional-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gameContent } from "@/game/data";
import type {
  ElectionRoundResult,
  EventChoice,
  GameEventDefinition,
  GameState,
  PartyState,
  RegionId,
  RegionalResult,
} from "@/game/types";
import {
  CATEGORY_LABELS,
  daysBetween,
  formatCampaignDate,
  formatPercent,
} from "@/lib/game-presentation";
import { cn } from "@/lib/utils";

import { CampaignDashboard } from "./campaign-dashboard";
import { useGameStore } from "./gameStore";

const CATEGORY_ICONS = {
  campaign: Flag,
  media: Newspaper,
  debate: Users,
  program: BookOpenCheck,
  internal: Landmark,
  alliance: Users,
  world: Gauge,
  scandal: ShieldAlert,
  party: Landmark,
  rare: Sparkles,
  between_rounds: Trophy,
  government: Landmark,
} as const;

function MainStats({ party }: { party: PartyState }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl border border-[var(--line)] bg-white p-3">
        <span className="block text-[0.65rem] font-bold text-[var(--ink-muted)]">Intentions</span>
        <strong className="mt-1 block text-lg tabular-nums">
          {party.stats.polling.toFixed(1)} %
        </strong>
      </div>
      <div className="rounded-xl border border-[var(--line)] bg-white p-3">
        <span className="block text-[0.65rem] font-bold text-[var(--ink-muted)]">Popularité</span>
        <strong className="mt-1 block text-lg tabular-nums">
          {Math.round(party.stats.popularity)}
        </strong>
      </div>
      <div className="rounded-xl border border-[var(--line)] bg-white p-3">
        <span className="block text-[0.65rem] font-bold text-[var(--ink-muted)]">Dynamique</span>
        <strong className="mt-1 block text-lg tabular-nums">
          {Math.round(party.stats.momentum)}
        </strong>
      </div>
    </div>
  );
}

function CampaignHeader({
  state,
  onDashboard,
  onSaveAndQuit,
}: {
  state: GameState;
  onDashboard: () => void;
  onSaveAndQuit: () => void | Promise<void>;
}) {
  const party = state.parties[state.playerPartyId];
  if (!party) return null;
  const remaining = daysBetween(state.currentDate, state.electionDate);
  const progress = Math.min(
    100,
    (state.decisionIndex / Math.max(1, state.maxTargetDecisions)) * 100,
  );

  return (
    <header className="border-b border-[var(--line)] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <PartyMark visual={party.visual} name={party.displayName} size="small" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <strong className="truncate text-sm">{state.player.displayName}</strong>
            <span className="shrink-0 text-xs font-black text-[var(--blue-700)]">
              {state.phase === "government_epilogue" ? "Premiers jours" : `J − ${remaining}`}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-raised)]"
            aria-label={`Progression ${Math.round(progress)} %`}
          >
            <div
              className="h-full rounded-full bg-[var(--blue-600)] transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={onDashboard}
          aria-label="Ouvrir le tableau de bord"
        >
          <Menu aria-hidden="true" className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSaveAndQuit}
          aria-label="Sauvegarder et quitter"
        >
          <Save aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </header>
  );
}

export function CampaignEventScreen({
  onSaveAndQuit,
}: {
  onSaveAndQuit: () => void | Promise<void>;
}) {
  const state = useGameStore((store) => store.gameState);
  const chooseEventOption = useGameStore((store) => store.chooseEventOption);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  if (!state) return null;
  const party = state.parties[state.playerPartyId];
  const event = gameContent.events.find((candidate) => candidate.id === state.currentEventId);
  if (!party || !event) return null;
  const Icon = CATEGORY_ICONS[event.category];

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[var(--surface)]">
      <CampaignHeader
        state={state}
        onDashboard={() => setDashboardOpen(true)}
        onSaveAndQuit={onSaveAndQuit}
      />
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-7 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-8">
        <main className="min-w-0">
          {event.category === "debate" || event.id === "runoff_final_debate" ? (
            <DebateCard key={event.id} event={event} onChoose={chooseEventOption} />
          ) : (
            <EventCard event={event} onChoose={chooseEventOption} />
          )}
        </main>
        <aside className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--navy-950)] text-[var(--gold-300)]">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <span className="block text-[0.65rem] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  Séquence
                </span>
                <strong className="text-sm">
                  {state.decisionIndex + 1} / {state.maxTargetDecisions}
                </strong>
              </div>
            </div>
            <div className="mt-5">
              <MainStats party={party} />
            </div>
            <Button
              className="mt-4 w-full"
              variant="secondary"
              onClick={() => setDashboardOpen(true)}
            >
              <BarChart3 aria-hidden="true" className="size-4" /> Tableau de bord
            </Button>
          </Card>
          {state.publicNews.at(-1) ? (
            <Card className="p-5">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-[var(--blue-600)]">
                Dernière nouvelle
              </p>
              <h2 className="mt-2 text-sm font-black leading-snug">
                {state.publicNews.at(-1)?.headline}
              </h2>
              <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-[var(--ink-muted)]">
                {state.publicNews.at(-1)?.body}
              </p>
            </Card>
          ) : null}
          <p className="px-2 text-xs leading-relaxed text-[var(--ink-muted)]">
            Les effets annoncés sont publics. D’autres conséquences peuvent apparaître plus tard.
          </p>
        </aside>
      </div>
      <CampaignDashboard state={state} open={dashboardOpen} onOpenChange={setDashboardOpen} />
    </div>
  );
}

function EventCard({
  event,
  onChoose,
}: {
  event: GameEventDefinition;
  onChoose: (choiceId: string) => void;
}) {
  const [selected, setSelected] = useState<string>();
  const Icon = CATEGORY_ICONS[event.category];
  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 bg-[linear-gradient(90deg,var(--blue-600),var(--gold-400))]" />
      <article className="p-5 sm:p-8 lg:p-10" data-category={event.category}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[var(--blue-700)]">
            <Icon aria-hidden="true" className="size-4" /> {CATEGORY_LABELS[event.category]}
          </span>
          <time className="flex items-center gap-2 text-xs font-bold text-[var(--ink-muted)]">
            <CalendarDays aria-hidden="true" className="size-4" />
            {formatCampaignDate(useGameStore.getState().gameState?.currentDate ?? "2027-01-01")}
          </time>
        </div>
        <h1 className="mt-7 font-display text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-5xl">
          {event.title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--ink-muted)] sm:text-lg">
          {event.summary}
        </p>
        <fieldset className="mt-8">
          <legend className="text-sm font-black uppercase tracking-[0.12em]">
            Quelle décision prenez-vous ?
          </legend>
          <div className="mt-4 grid gap-3">
            {event.choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                aria-pressed={selected === choice.id}
                onClick={() => setSelected(choice.id)}
                className={cn(
                  "group flex min-h-16 w-full items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 sm:p-5",
                  selected === choice.id
                    ? "border-[var(--blue-600)] bg-blue-50 shadow-md"
                    : "border-[var(--line)] bg-white hover:border-[var(--blue-400)] hover:bg-[var(--surface)]",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl font-display text-lg font-black",
                    selected === choice.id
                      ? "bg-[var(--blue-600)] text-white"
                      : "bg-[var(--surface-raised)] text-[var(--blue-700)]",
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="min-w-0 flex-1 font-bold leading-snug">{choice.label}</span>
                {choice.visibleTag ? (
                  <span className="hidden shrink-0 rounded-full border border-current/20 px-2.5 py-1 text-[0.62rem] font-black tracking-wider text-[var(--ink-muted)] sm:block">
                    {choice.visibleTag}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mt-7 flex justify-end">
          <Button size="large" disabled={!selected} onClick={() => selected && onChoose(selected)}>
            Confirmer ma décision <ArrowRight aria-hidden="true" className="size-5" />
          </Button>
        </div>
      </article>
    </Card>
  );
}

type DebateStyle = "prudent" | "bold" | "collective" | "technical";

function styleForChoice(choice: EventChoice): DebateStyle {
  if (
    choice.visibleTag === "RISQUÉ" ||
    choice.visibleTag === "OFFENSIF" ||
    choice.visibleTag === "CLIVANT"
  )
    return "bold";
  if (choice.visibleTag === "RASSEMBLEUR" || choice.visibleTag === "LOYAL") return "collective";
  if (choice.visibleTag === "TECHNIQUE") return "technical";
  return "prudent";
}

const DEBATE_TACTICS: Array<{ style: DebateStyle; title: string; body: string }> = [
  {
    style: "prudent",
    title: "Précision",
    body: "Répondre avec méthode, preuves et limites explicites.",
  },
  { style: "bold", title: "Offensive", body: "Imposer le rythme et retourner les attaques." },
  {
    style: "collective",
    title: "Rassemblement",
    body: "Chercher un accord et parler au-delà de son camp.",
  },
  {
    style: "technical",
    title: "Démonstration",
    body: "Entrer dans le fond et défendre chaque articulation.",
  },
];

function DebateCard({
  event,
  onChoose,
}: {
  event: GameEventDefinition;
  onChoose: (choiceId: string) => void;
}) {
  const [round, setRound] = useState(0);
  const [styles, setStyles] = useState<DebateStyle[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const selectTactic = (style: DebateStyle) => {
    setStyles((current) => [...current, style]);
    setRound((current) => current + 1);
  };

  const resolveFinal = () => {
    const choice = event.choices.find((candidate) => candidate.id === selectedChoice);
    if (!choice) return;
    const finalStyle = styleForChoice(choice);
    const allStyles = [...styles, finalStyle];
    const counts = allStyles.reduce<Record<DebateStyle, number>>(
      (accumulator, style) => ({ ...accumulator, [style]: accumulator[style] + 1 }),
      { prudent: 0, bold: 0, collective: 0, technical: 0 },
    );
    const dominant =
      (Object.entries(counts) as Array<[DebateStyle, number]>).sort(
        (left, right) => right[1] - left[1] || (left[0] === finalStyle ? -1 : 1),
      )[0]?.[0] ?? finalStyle;
    const resolvedChoice =
      event.choices.find((candidate) => styleForChoice(candidate) === dominant) ?? choice;
    onChoose(resolvedChoice.id);
  };

  const headings = ["Économie et social", "Sécurité et institutions", "Conclusion libre"];
  return (
    <Card className="overflow-hidden border-[var(--blue-400)]">
      <div className="bg-[var(--navy-950)] p-5 text-white sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-300)]">
            Débat en direct · Manche {round + 1}/3
          </span>
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 w-8 rounded-full",
                  index <= round ? "bg-[var(--gold-300)]" : "bg-white/20",
                )}
              />
            ))}
          </div>
        </div>
        <h1 className="mt-4 font-display text-3xl font-black uppercase sm:text-4xl">
          {headings[round]}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          {round === 2
            ? event.summary
            : "Choisissez votre posture. La ligne dominante des trois manches déterminera la réponse finale de votre candidate ou candidat."}
        </p>
      </div>
      <div className="p-5 sm:p-8">
        {round < 2 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {DEBATE_TACTICS.map((tactic) => (
              <button
                key={tactic.style}
                type="button"
                onClick={() => selectTactic(tactic.style)}
                className="min-h-40 rounded-2xl border border-[var(--line)] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--blue-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
              >
                <span className="text-xs font-black uppercase tracking-[0.15em] text-[var(--blue-600)]">
                  {tactic.style}
                </span>
                <strong className="mt-3 block text-lg">{tactic.title}</strong>
                <span className="mt-2 block text-sm leading-relaxed text-[var(--ink-muted)]">
                  {tactic.body}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div className="grid gap-3">
              {event.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  aria-pressed={selectedChoice === choice.id}
                  onClick={() => setSelectedChoice(choice.id)}
                  className={cn(
                    "min-h-16 rounded-2xl border p-4 text-left font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2",
                    selectedChoice === choice.id
                      ? "border-[var(--blue-600)] bg-blue-50"
                      : "border-[var(--line)] hover:border-[var(--blue-400)]",
                  )}
                >
                  <span className="mr-3 inline-block rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-[0.62rem] font-black uppercase text-[var(--blue-700)]">
                    {choice.visibleTag ?? "Réponse"}
                  </span>
                  {choice.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button size="large" disabled={!selectedChoice} onClick={resolveFinal}>
                Prononcer la conclusion <ArrowRight aria-hidden="true" className="size-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function OutcomeScreen() {
  const record = useGameStore((state) => state.lastRecord);
  const outcome = useGameStore((state) => state.lastOutcome);
  const achievementIds = useGameStore((state) => state.newAchievementIds);
  const continueAfterOutcome = useGameStore((state) => state.continueAfterOutcome);
  if (!record || !outcome) return null;
  const achievements = achievementIds
    .map((id) => gameContent.achievements.find((achievement) => achievement.id === id))
    .filter((achievement) => achievement !== undefined);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl items-center px-4 py-10 sm:px-6">
      <Card className="w-full overflow-hidden" aria-live="polite">
        <div className="border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4 text-sm sm:px-8">
          <span className="font-black text-[var(--blue-700)]">
            {CATEGORY_LABELS[record.eventCategory]}
          </span>
          <span className="mx-2 text-[var(--line)]">/</span>
          <span className="text-[var(--ink-muted)]">{record.eventTitle}</span>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">Votre choix : {record.choiceLabel}</p>
        </div>
        <article className="p-6 sm:p-9">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--navy-950)] text-[var(--gold-300)]">
            <CheckCircle2 aria-hidden="true" className="size-7" />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.17em] text-[var(--blue-600)]">
            Conséquence
          </p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase leading-none sm:text-5xl">
            {outcome.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--ink-muted)] sm:text-lg">
            {record.narrative}
          </p>
          {record.visibleEffects.length ? (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Effets visibles">
              {record.visibleEffects.map((effect, index) => (
                <li
                  key={`${effect.label}-${index}`}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-black",
                    effect.tone === "positive"
                      ? "bg-emerald-50 text-[var(--success)]"
                      : effect.tone === "negative"
                        ? "bg-red-50 text-[var(--red-700)]"
                        : "bg-[var(--surface-raised)] text-[var(--ink-muted)]",
                  )}
                >
                  {effect.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl bg-[var(--surface)] p-4 text-sm text-[var(--ink-muted)]">
              Aucun effet immédiat clairement mesurable.
            </p>
          )}
          {achievements.length ? (
            <div className="mt-7 rounded-2xl border border-[var(--gold-400)] bg-amber-50 p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--warning)]">
                <Trophy aria-hidden="true" className="size-4" /> Succès débloqué
              </p>
              {achievements.map((achievement) => (
                <div key={achievement.id} className="mt-3 flex items-start gap-3">
                  <span aria-hidden="true" className="text-2xl">
                    {achievement.icon}
                  </span>
                  <div>
                    <strong>{achievement.title}</strong>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-8 flex justify-end">
            <Button size="large" onClick={continueAfterOutcome}>
              Continuer <ArrowRight aria-hidden="true" className="size-5" />
            </Button>
          </div>
        </article>
      </Card>
    </div>
  );
}

function regionalProjection(state: GameState): RegionalResult[] {
  const latestPoll = state.pollHistory.at(-1);
  const partyIds = Object.keys(state.parties).filter((id) => state.parties[id]?.active);
  const regionIds: RegionId[] = [
    "north",
    "west",
    "ile_de_france",
    "east",
    "central",
    "south_west",
    "south_east",
    "overseas",
  ];
  return regionIds.map((regionId) => {
    const raw = Object.fromEntries(
      partyIds.map((partyId) => {
        const party = state.parties[partyId]!;
        const national = latestPoll?.results[partyId] ?? party.stats.polling;
        return [
          partyId,
          Math.max(0.01, national * (0.72 + party.regionalAffinity[regionId] / 180)),
        ];
      }),
    );
    const total = Object.values(raw).reduce((sum, value) => sum + value, 0);
    const results = Object.fromEntries(
      Object.entries(raw).map(([id, value]) => [id, (value / total) * 100]),
    );
    const winnerPartyId =
      Object.entries(results).sort((left, right) => right[1] - left[1])[0]?.[0] ??
      state.playerPartyId;
    return { regionId, winnerPartyId, results };
  });
}

export function RaceBulletinScreen() {
  const state = useGameStore((store) => store.gameState);
  const closeRace = useGameStore((store) => store.closeRace);
  if (!state) return null;
  const poll = state.pollHistory.at(-1);
  const party = state.parties[state.playerPartyId];
  if (!poll || !party) return null;
  const projection = regionalProjection(state);
  const trendCopy =
    poll.playerTrend > 0.4
      ? "Votre dynamique progresse"
      : poll.playerTrend < -0.4
        ? "Votre campagne recule"
        : "Votre socle reste stable";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--blue-600)]">
            Bulletin fictif · {formatCampaignDate(poll.date)}
          </p>
          <h1 className="mt-3 font-display text-4xl font-black uppercase sm:text-5xl">
            État de la course
          </h1>
          <p className="mt-3 text-[var(--ink-muted)]">
            Un instantané bruité de la campagne, jamais une vérité électorale.
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black",
            poll.playerTrend >= 0
              ? "bg-emerald-50 text-[var(--success)]"
              : "bg-red-50 text-[var(--red-700)]",
          )}
        >
          {poll.playerTrend >= 0 ? (
            <TrendingUp aria-hidden="true" className="size-5" />
          ) : (
            <TrendingDown aria-hidden="true" className="size-5" />
          )}
          {poll.playerTrend >= 0 ? "+" : ""}
          {poll.playerTrend.toFixed(1)} point
        </div>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[var(--ink-muted)]">
                {poll.instituteLabel}
              </p>
              <h2 className="mt-1 text-xl font-black">Intentions de vote</h2>
            </div>
            <span className="rounded-full bg-[var(--navy-950)] px-3 py-1 text-xs font-black text-white">
              Rang {poll.playerRank}
            </span>
          </div>
          <div className="mt-6">
            <PollChart poll={poll} parties={state.parties} />
          </div>
        </Card>
        <Card className="p-5 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.13em] text-[var(--ink-muted)]">
            Projection qualitative
          </p>
          <h2 className="mt-1 text-xl font-black">Rapport de forces régional</h2>
          <div className="mt-5">
            <RegionalMap results={projection} parties={state.parties} />
          </div>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <Card className="p-6">
          <PartyMark visual={party.visual} name={party.displayName} size="large" />
          <h2 className="mt-5 text-xl font-black">{trendCopy}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            Vous êtes crédité de{" "}
            {formatPercent(poll.results[state.playerPartyId] ?? party.stats.polling)}. La
            mobilisation et la crédibilité pèseront autant que ce chiffre lors du vote simulé.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-xl font-black">
            <Newspaper aria-hidden="true" className="size-5 text-[var(--blue-600)]" /> Dernières
            nouvelles
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {state.publicNews
              .slice(-4)
              .reverse()
              .map((item) => (
                <article key={item.id} className="rounded-xl bg-[var(--surface)] p-4">
                  <time className="text-[0.65rem] text-[var(--ink-muted)]">
                    {formatCampaignDate(item.date)}
                  </time>
                  <h3 className="mt-1 text-sm font-black">{item.headline}</h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--ink-muted)]">
                    {item.body}
                  </p>
                </article>
              ))}
          </div>
        </Card>
      </div>
      <div className="mt-8 flex justify-end">
        <Button size="large" onClick={closeRace}>
          Reprendre la campagne <ArrowRight aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </div>
  );
}

export function ElectionNightScreen({ round }: { round: 1 | 2 }) {
  const state = useGameStore((store) => store.gameState);
  const continueAfterMilestone = useGameStore((store) => store.continueAfterMilestone);
  if (!state) return null;
  const result = round === 1 ? state.firstRoundResult : state.secondRoundResult;
  if (!result) return null;
  const playerParty = state.parties[state.playerPartyId];
  if (!playerParty) return null;
  const playerScore = result.results[state.playerPartyId] ?? 0;
  const playerRank = result.ranking.indexOf(state.playerPartyId) + 1;
  const qualified = round === 1 && state.qualifiedPartyIds?.includes(state.playerPartyId);
  const won = round === 2 && result.ranking[0] === state.playerPartyId;
  const title =
    round === 1
      ? qualified
        ? "Vous êtes au second tour"
        : `${playerRank}e au premier tour`
      : won
        ? "Vous remportez l’élection"
        : "Le verdict des urnes";

  return (
    <div className="bg-[var(--navy-950)] py-10 text-white sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold-300)]">
            Soirée électorale fictive · {round === 1 ? "Premier tour" : "Second tour"}
          </p>
          <h1 className="mt-4 font-display text-5xl font-black uppercase leading-none sm:text-7xl">
            {title}
          </h1>
          <p className="mt-5 text-2xl font-black tabular-nums text-[var(--gold-300)]">
            {formatPercent(playerScore)}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Participation simulée : {formatPercent(result.turnout)}. Ces résultats sont
            intégralement fictifs et propres à votre graine.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <ElectionRanking result={result} state={state} />
          <Card className="p-5 text-[var(--ink)] sm:p-7">
            <h2 className="text-xl font-black">Territoires en tête</h2>
            <div className="mt-5">
              <RegionalMap results={result.regionalResults} parties={state.parties} />
            </div>
          </Card>
        </div>
        {round === 1 ? (
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.06] p-5 text-sm text-slate-200 sm:p-6">
            {qualified
              ? "Deux semaines décisives commencent. Les reports de voix, les alliances et le débat final peuvent encore tout changer."
              : "Votre candidature est éliminée, mais votre choix d’entre-deux-tours peut encore peser sur la suite et sur votre héritage politique."}
          </div>
        ) : null}
        <div className="mt-8 flex justify-center">
          <Button
            size="large"
            className="bg-[var(--gold-400)] text-[var(--navy-950)] hover:bg-[var(--gold-300)]"
            onClick={continueAfterMilestone}
          >
            {round === 1
              ? "Entrer dans l’entre-deux-tours"
              : won
                ? "Former les premiers choix"
                : "Découvrir le bilan"}
            <ArrowRight aria-hidden="true" className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ElectionRanking({ result, state }: { result: ElectionRoundResult; state: GameState }) {
  const maximum = result.results[result.ranking[0] ?? ""] ?? 1;
  return (
    <Card className="p-5 text-[var(--ink)] sm:p-7">
      <h2 className="text-xl font-black">Résultats nationaux simulés</h2>
      <ol className="mt-5 space-y-3">
        {result.ranking.map((partyId, index) => {
          const party = state.parties[partyId];
          const score = result.results[partyId] ?? 0;
          if (!party) return null;
          return (
            <li
              key={partyId}
              className={cn(
                "grid grid-cols-[2rem_2.5rem_1fr_auto] items-center gap-3 rounded-xl p-2",
                partyId === state.playerPartyId && "bg-blue-50 ring-1 ring-[var(--blue-400)]",
              )}
            >
              <span className="text-center font-display text-lg font-black">{index + 1}</span>
              <PartyMark visual={party.visual} name={party.displayName} size="small" />
              <div className="min-w-0">
                <span className="block truncate text-sm font-black">{party.displayName}</span>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(score / maximum) * 100}%`,
                      backgroundColor: party.visual.primaryColor,
                    }}
                  />
                </div>
              </div>
              <strong className="w-14 text-right text-sm tabular-nums">{score.toFixed(1)} %</strong>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
