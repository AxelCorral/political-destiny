"use client";

import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Flag,
  Gauge,
  Landmark,
  Newspaper,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GameEventDefinition } from "@/game/types";
import { CATEGORY_LABELS, formatCampaignDate } from "@/lib/game-presentation";
import { cn } from "@/lib/utils";

const EVENT_ICONS = {
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

function StandardDecisionCard({
  event,
  date,
  onChoose,
}: {
  event: GameEventDefinition;
  date: string;
  onChoose: (choiceId: string) => void;
}) {
  const [selected, setSelected] = useState<string>();
  const Icon = EVENT_ICONS[event.category];

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
            {formatCampaignDate(date)}
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

function DebateDecisionCard({
  event,
  onChoose,
}: {
  event: GameEventDefinition;
  onChoose: (choiceId: string) => void;
}) {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  return (
    <Card className="overflow-hidden border-[var(--blue-400)]">
      <div className="bg-[var(--navy-950)] p-5 text-white sm:p-7">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-300)]">
          Débat en direct · prise de position
        </span>
        <h1 className="mt-4 font-display text-3xl font-black uppercase sm:text-4xl">
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
              aria-pressed={selectedChoice === choice.id}
              onClick={() => setSelectedChoice(choice.id)}
              className={cn(
                "min-h-20 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2",
                selectedChoice === choice.id
                  ? "border-[var(--blue-600)] bg-blue-50"
                  : "border-[var(--line)] hover:border-[var(--blue-400)]",
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
        <div className="mt-6 flex justify-end">
          <Button
            size="large"
            disabled={!selectedChoice}
            onClick={() => selectedChoice && onChoose(selectedChoice)}
          >
            Défendre cette position <ArrowRight aria-hidden="true" className="size-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function EventDecisionCard({
  event,
  date,
  onChoose,
}: {
  event: GameEventDefinition;
  date: string;
  onChoose: (choiceId: string) => void;
}) {
  const isDebate = event.category === "debate" || event.id === "runoff_final_debate";
  return isDebate ? (
    <DebateDecisionCard event={event} onChoose={onChoose} />
  ) : (
    <StandardDecisionCard event={event} date={date} onChoose={onChoose} />
  );
}
