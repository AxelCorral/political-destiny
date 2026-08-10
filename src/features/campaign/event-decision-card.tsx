"use client";

import {
  BookOpenCheck,
  CalendarDays,
  Flag,
  Gauge,
  History,
  Landmark,
  Newspaper,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";

import { PartyMark } from "@/components/game/party-mark";
import { Card } from "@/components/ui/card";
import type { EventChoice, GameEventDefinition, GameState } from "@/game/types";
import { CATEGORY_LABELS, formatCampaignDate } from "@/lib/game-presentation";
import { cn } from "@/lib/utils";

import type { ChainOrigin, DecisionCardVariant } from "./decision-card-variant";
import { findChainOrigin, resolveDecisionCardVariant } from "./decision-card-variant";

export const EVENT_ICONS = {
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

function ChainOriginBadge({
  chainOrigin,
  tone,
}: {
  chainOrigin: ChainOrigin;
  tone: "light" | "dark";
}) {
  const decisions = chainOrigin.decisionsAgo;
  return (
    <div
      className={cn(
        "mb-4 inline-flex max-w-full items-start gap-2.5 rounded-xl border px-3 py-2 text-xs",
        tone === "light"
          ? "border-[var(--gold-400)]/50 bg-[var(--surface-raised)] text-[var(--ink)]"
          : "border-white/20 bg-white/[0.08] text-white",
      )}
    >
      <History
        aria-hidden="true"
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "light" ? "text-[var(--blue-700)]" : "text-[var(--gold-300)]",
        )}
      />
      <span className="min-w-0">
        <span
          className={cn(
            "block font-black uppercase tracking-[0.1em]",
            tone === "light" ? "text-[var(--blue-700)]" : "text-[var(--gold-300)]",
          )}
        >
          Retour de dossier
        </span>
        <span
          className={cn(
            "mt-0.5 block",
            tone === "light" ? "text-[var(--ink-muted)]" : "text-slate-300",
          )}
        >
          Il y a {decisions} décision{decisions > 1 ? "s" : ""} · « {chainOrigin.record.choiceLabel}{" "}
          »
        </span>
      </span>
    </div>
  );
}

function ChoiceButtons({
  choices,
  chosenId,
  onChoose,
}: {
  choices: EventChoice[];
  chosenId: string | undefined;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <div className="mt-4 grid gap-3">
      {choices.map((choice, index) => (
        <button
          key={choice.id}
          type="button"
          data-testid="event-choice"
          aria-disabled={Boolean(chosenId)}
          onClick={() => onChoose(choice.id)}
          className={cn(
            "group flex min-h-16 w-full items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 sm:p-5",
            chosenId
              ? chosenId === choice.id
                ? "border-[var(--blue-600)] bg-blue-50"
                : "opacity-50"
              : "hover:border-[var(--blue-400)] hover:bg-[var(--surface)]",
          )}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-raised)] font-display text-lg font-black text-[var(--blue-700)]">
            {String.fromCharCode(65 + index)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold leading-snug">{choice.label}</span>
            {choice.immediatePublicHint ? (
              <span className="mt-1.5 block text-xs font-normal leading-relaxed text-[var(--ink-muted)]">
                {choice.immediatePublicHint}
              </span>
            ) : null}
            {choice.visibleTag ? (
              <span className="mt-2 inline-flex rounded-full border border-current/20 px-2.5 py-1 text-[0.62rem] font-black tracking-wider text-[var(--ink-muted)]">
                {choice.visibleTag}
              </span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}

const VARIANT_EYEBROW: Partial<Record<DecisionCardVariant, string>> = {
  major: "Décision importante",
  decisive: "Décisif",
  rare: "Édition spéciale",
};

function StandardDecisionCard({
  event,
  date,
  state,
  onChoose,
}: {
  event: GameEventDefinition;
  date: string;
  state: GameState;
  onChoose: (choiceId: string) => void;
}) {
  const Icon = EVENT_ICONS[event.category];
  const [chosenId, setChosenId] = useState<string>();
  const handleChoose = (choiceId: string) => {
    if (chosenId) return;
    setChosenId(choiceId);
    onChoose(choiceId);
  };

  const { variant, isChainFollowUp } = resolveDecisionCardVariant(event);
  const chainOrigin = isChainFollowUp ? findChainOrigin(event, state) : undefined;
  const isElevated = variant === "decisive" || variant === "rare";

  return (
    <Card
      className={cn(
        "overflow-hidden",
        variant === "major" && "border-[var(--blue-400)]/50",
        variant === "rare" && "border-[var(--gold-400)]/60",
        isElevated && "animate-card-enter",
      )}
    >
      {isElevated ? (
        <div
          className={cn(
            "relative overflow-hidden bg-[var(--navy-950)] p-5 text-white sm:p-8",
            variant === "rare" && "border-l-4 border-[var(--gold-400)]",
          )}
        >
          {variant === "rare" ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(210,173,98,0.22),transparent_26rem)]"
            />
          ) : null}
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[var(--gold-300)]">
                <Icon aria-hidden="true" className="size-4" /> {VARIANT_EYEBROW[variant]}
              </span>
              <time className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <CalendarDays aria-hidden="true" className="size-4" />
                {formatCampaignDate(date)}
              </time>
            </div>
            {chainOrigin ? <ChainOriginBadge chainOrigin={chainOrigin} tone="dark" /> : null}
            <h1 className="mt-5 break-words font-display text-3xl font-black uppercase leading-[1] tracking-tight sm:text-4xl">
              {event.title}
            </h1>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "bg-[linear-gradient(90deg,var(--blue-600),var(--gold-400))]",
            variant === "major" ? "h-2" : "h-1.5",
          )}
        />
      )}
      <article className="p-5 sm:p-8 lg:p-10" data-category={event.category} data-variant={variant}>
        {!isElevated ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[var(--blue-700)]">
                <Icon aria-hidden="true" className="size-4" /> {CATEGORY_LABELS[event.category]}
              </span>
              <time className="flex items-center gap-2 text-xs font-bold text-[var(--ink-muted)]">
                <CalendarDays aria-hidden="true" className="size-4" />
                {formatCampaignDate(date)}
              </time>
            </div>
            {chainOrigin ? <ChainOriginBadge chainOrigin={chainOrigin} tone="light" /> : null}
            <h1 className="mt-7 break-words font-display text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-5xl">
              {event.title}
            </h1>
          </>
        ) : null}
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--ink-muted)] sm:text-lg">
          {event.summary}
        </p>
        <fieldset className="mt-8">
          <legend className="text-sm font-black uppercase tracking-[0.12em]">
            Quelle décision prenez-vous ?
          </legend>
          <ChoiceButtons choices={event.choices} chosenId={chosenId} onChoose={handleChoose} />
        </fieldset>
      </article>
    </Card>
  );
}

function DebateDecisionCard({
  event,
  onChoose,
}: {
  event: GameEventDefinition;
  onChoose: (choiceId: string) => void;
}) {
  const [chosenId, setChosenId] = useState<string>();
  const handleChoose = (choiceId: string) => {
    if (chosenId) return;
    setChosenId(choiceId);
    onChoose(choiceId);
  };

  return (
    <Card className="overflow-hidden border-[var(--blue-400)]">
      <div className="bg-[var(--navy-950)] p-5 text-white sm:p-7">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-300)]">
          Débat en direct · prise de position
        </span>
        <h1 className="mt-4 break-words font-display text-3xl font-black uppercase sm:text-4xl">
          {event.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{event.summary}</p>
      </div>
      <div className="p-5 sm:p-8">
        <div className="grid gap-3">
          {event.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              data-testid="event-choice"
              aria-disabled={Boolean(chosenId)}
              onClick={() => handleChoose(choice.id)}
              className={cn(
                "min-h-20 rounded-2xl border border-[var(--line)] p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2",
                chosenId
                  ? chosenId === choice.id
                    ? "border-[var(--blue-600)] bg-blue-50"
                    : "opacity-50"
                  : "hover:border-[var(--blue-400)]",
              )}
            >
              <span className="mr-3 inline-block rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-[0.62rem] font-black uppercase text-[var(--blue-700)]">
                {choice.visibleTag ?? "Position"}
              </span>
              <strong>{choice.label}</strong>
              {choice.immediatePublicHint ? (
                <span className="mt-2 block text-sm font-normal leading-relaxed text-[var(--ink-muted)]">
                  {choice.immediatePublicHint}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function GovernmentDecisionCard({
  event,
  date,
  state,
  onChoose,
}: {
  event: GameEventDefinition;
  date: string;
  state: GameState;
  onChoose: (choiceId: string) => void;
}) {
  const party = state.parties[state.playerPartyId];
  const [chosenId, setChosenId] = useState<string>();
  const handleChoose = (choiceId: string) => {
    if (chosenId) return;
    setChosenId(choiceId);
    onChoose(choiceId);
  };

  return (
    <Card className="animate-card-enter overflow-hidden border-[var(--gold-400)]/40">
      <div className="relative overflow-hidden bg-[var(--navy-950)] p-6 text-white sm:p-9">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(210,173,98,0.18),transparent_28rem),linear-gradient(120deg,transparent_0_62%,rgba(76,131,203,0.17)_62%_63%,transparent_63%)]"
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            {party ? (
              <PartyMark visual={party.visual} name={party.displayName} size="small" />
            ) : null}
            <div>
              <span className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--gold-300)]">
                Vous gouvernez désormais
              </span>
              <time className="mt-0.5 block text-xs text-slate-300">
                {formatCampaignDate(date)}
              </time>
            </div>
          </div>
          <h1 className="mt-6 break-words font-display text-3xl font-black uppercase leading-[1.02] tracking-tight sm:text-4xl">
            {event.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {event.summary}
          </p>
        </div>
      </div>
      <div className="p-5 sm:p-8 lg:p-10">
        <fieldset>
          <legend className="text-sm font-black uppercase tracking-[0.12em]">
            Quelle décision prenez-vous ?
          </legend>
          <ChoiceButtons choices={event.choices} chosenId={chosenId} onChoose={handleChoose} />
        </fieldset>
      </div>
    </Card>
  );
}

export function EventDecisionCard({
  event,
  date,
  state,
  onChoose,
}: {
  event: GameEventDefinition;
  date: string;
  state: GameState;
  onChoose: (choiceId: string) => void;
}) {
  const isDebate = event.category === "debate" || event.id === "runoff_final_debate";
  if (isDebate) {
    return <DebateDecisionCard event={event} onChoose={onChoose} />;
  }
  if (event.category === "government") {
    return <GovernmentDecisionCard event={event} date={date} state={state} onChoose={onChoose} />;
  }
  return <StandardDecisionCard event={event} date={date} state={state} onChoose={onChoose} />;
}
