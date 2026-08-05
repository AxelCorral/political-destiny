"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Dices,
  Flag,
  Landmark,
  Palette,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PartyMark } from "@/components/game/party-mark";
import { ScreenShell } from "@/components/game/screen-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CUSTOM_PARTY_COLORS,
  CUSTOM_PARTY_SYMBOLS,
  buildCustomParty,
  describeCustomPartyElectorate,
  gameContent,
  ideologyQuestions,
  signatureMeasures,
  type CustomPartyInput,
  type LeadershipModel,
  type OrganizationPriority,
} from "@/game/data";
import type { GameMode, PartyDefinition } from "@/game/types";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/features/campaign/gameStore";

const MODE_OPTIONS: Array<{
  id: GameMode;
  icon: typeof Landmark;
  title: string;
  description: string;
  detail: string;
}> = [
  {
    id: "existing_party",
    icon: Landmark,
    title: "Un parti existant",
    description: "Prenez la tête d’un des neuf mouvements proposés.",
    detail: "Identité réelle, candidats et scénarios fictifs",
  },
  {
    id: "custom_party",
    icon: Palette,
    title: "Créer mon parti",
    description: "Façonnez en quelques choix une nouvelle force politique.",
    detail: "Nom, doctrine, organisation et mesures phares",
  },
  {
    id: "random",
    icon: Dices,
    title: "Tout aléatoire",
    description: "Laissez la graine choisir votre parti et votre stratégie.",
    detail: "Idéal pour une campagne surprise",
  },
];

function candidateForParty(partyId: string) {
  return gameContent.actors.find(
    (actor) => actor.partyId === partyId && actor.role === "candidate",
  );
}

export function ModeSelectionScreen() {
  const selectMode = useGameStore((state) => state.selectMode);

  return (
    <ScreenShell
      eyebrow="Nouvelle partie"
      title="Choisissez votre point de départ"
      description="Votre choix définit le socle de la campagne, jamais son résultat. Chaque partie reste probabiliste et reproductible avec sa graine."
      aside={
        <Card className="sticky top-24 overflow-hidden p-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--navy-950)] text-[var(--gold-300)]">
            <ShieldCheck aria-hidden="true" className="size-6" />
          </div>
          <h2 className="mt-5 text-lg font-black">Une fiction locale</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            Aucun compte, aucune API payante et aucune donnée envoyée. Les personnes jouables et les
            situations sensibles sont fictives.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-[var(--surface)] p-3">
              <dt className="text-[var(--ink-muted)]">Durée</dt>
              <dd className="mt-1 font-black">10–15 min</dd>
            </div>
            <div className="rounded-xl bg-[var(--surface)] p-3">
              <dt className="text-[var(--ink-muted)]">Décisions</dt>
              <dd className="mt-1 font-black">≈ 30</dd>
            </div>
          </dl>
        </Card>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {MODE_OPTIONS.map(({ id, icon: Icon, title, description, detail }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectMode(id)}
            className="group min-h-72 rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] p-6 text-left shadow-[0_16px_50px_rgba(12,30,58,0.08)] transition hover:-translate-y-1 hover:border-[var(--blue-400)] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--surface-raised)] text-[var(--blue-700)] transition-colors group-hover:bg-[var(--blue-700)] group-hover:text-white">
              <Icon aria-hidden="true" className="size-7" />
            </span>
            <strong className="mt-7 block font-display text-2xl font-black uppercase leading-tight">
              {title}
            </strong>
            <span className="mt-3 block text-sm leading-relaxed text-[var(--ink-muted)]">
              {description}
            </span>
            <span className="mt-7 flex items-center justify-between border-t border-[var(--line)] pt-4 text-xs font-bold text-[var(--blue-700)]">
              {detail}
              <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
            </span>
          </button>
        ))}
      </div>
    </ScreenShell>
  );
}

export function PartySelectionScreen() {
  const openParty = useGameStore((state) => state.openParty);
  const goToScreen = useGameStore((state) => state.goToScreen);

  return (
    <ScreenShell
      eyebrow="Étape 1 sur 2"
      title="Choisissez votre mouvement"
      description="Les noms et identités visuelles évoquent des organisations existantes. Les candidatures, valeurs de départ et histoires de campagne sont des paramètres fictifs de gameplay."
    >
      <Button variant="ghost" className="mb-5" onClick={() => goToScreen("mode")}>
        <ArrowLeft aria-hidden="true" className="size-4" /> Retour
      </Button>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gameContent.parties.map((party) => {
          const candidate = candidateForParty(party.id);
          return (
            <button
              key={party.id}
              type="button"
              onClick={() => openParty(party.id)}
              className="group rounded-[1.25rem] border border-[var(--line)] bg-[var(--paper)] p-5 text-left shadow-[0_12px_35px_rgba(12,30,58,0.07)] transition hover:-translate-y-0.5 hover:border-[var(--blue-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-4">
                <PartyMark party={party} size="large" />
                <ChevronRight
                  aria-hidden="true"
                  className="mt-2 size-5 text-[var(--slate-500)] transition-transform group-hover:translate-x-1"
                />
              </div>
              <strong className="mt-5 block text-lg font-black leading-tight">
                {party.displayName}
              </strong>
              <span className="mt-1 block text-sm text-[var(--ink-muted)]">
                {candidate?.displayName ?? "Candidature fictive"}
              </span>
              <div className="mt-5 flex flex-wrap gap-2">
                {party.strengths.slice(0, 2).map((strength) => (
                  <span
                    key={strength}
                    className="rounded-full bg-[var(--surface-raised)] px-3 py-1 text-[0.68rem] font-bold text-[var(--slate-700)]"
                  >
                    {strength}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </ScreenShell>
  );
}

export function PartyDetailScreen() {
  const partyId = useGameStore((state) => state.partyDetailId);
  const confirmParty = useGameStore((state) => state.confirmParty);
  const goToScreen = useGameStore((state) => state.goToScreen);
  const party = gameContent.parties.find((candidate) => candidate.id === partyId);

  if (!party) {
    return (
      <ScreenShell title="Parti introuvable">
        <Button onClick={() => goToScreen("party_list")}>Revenir à la liste</Button>
      </ScreenShell>
    );
  }

  const candidate = candidateForParty(party.id);
  return (
    <ScreenShell
      eyebrow="Profil de campagne"
      title={party.displayName}
      description={`Vous incarnez ${candidate?.displayName ?? "une personnalité fictive"}. Le profil politique sert uniquement à la simulation.`}
      aside={
        <Card className="sticky top-24 p-6">
          <PartyMark party={party} size="hero" />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.15em] text-[var(--ink-muted)]">
            Candidature fictive
          </p>
          <p className="mt-1 text-xl font-black">{candidate?.displayName}</p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-[var(--line)] pb-3">
              <dt className="text-[var(--ink-muted)]">Socle initial</dt>
              <dd className="font-black">{party.baseline.baseSupport.toFixed(1)} %</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[var(--line)] pb-3">
              <dt className="text-[var(--ink-muted)]">Potentiel</dt>
              <dd className="font-black">{party.baseline.potentialSupport.toFixed(0)} %</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink-muted)]">Adhérents simulés</dt>
              <dd className="font-black">{party.baseline.members.toLocaleString("fr-FR")}</dd>
            </div>
          </dl>
          <Button className="mt-7 w-full" size="large" onClick={() => confirmParty(party.id)}>
            Choisir ce parti <ArrowRight aria-hidden="true" className="size-5" />
          </Button>
        </Card>
      }
    >
      <Button variant="ghost" className="mb-5" onClick={() => goToScreen("party_list")}>
        <ArrowLeft aria-hidden="true" className="size-4" /> Tous les partis
      </Button>
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Sparkles aria-hidden="true" className="size-5 text-[var(--blue-600)]" /> Forces
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--ink-muted)]">
            {party.strengths.map((item) => (
              <li key={item} className="flex gap-3">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-[var(--success)]"
                />
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Flag aria-hidden="true" className="size-5 text-[var(--red-700)]" /> Fragilités
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--ink-muted)]">
            {party.weaknesses.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--red-700)]"
                />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mt-5 p-6">
        <h2 className="text-lg font-black">Orientations programmatiques simplifiées</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {party.program.map((item, index) => (
            <div key={item} className="flex gap-3 rounded-xl bg-[var(--surface)] p-4 text-sm">
              <span className="font-display text-xl font-black text-[var(--blue-600)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Card>
      <p className="mt-5 text-xs leading-relaxed text-[var(--ink-muted)]">
        Ces paramètres sont éditoriaux, datés et révisables. Ils ne mesurent pas la valeur d’un
        parti et ne prédisent aucun résultat réel.
      </p>
    </ScreenShell>
  );
}

const DEFAULT_ANSWERS = Object.fromEntries(
  ideologyQuestions.map((question) => [
    question.id,
    question.options[1]?.id ?? question.options[0]!.id,
  ]),
);

type StrategyVariant = "natural" | "broad" | "territorial";

function applyStrategyVariant(party: PartyDefinition, variant: StrategyVariant): PartyDefinition {
  const next = structuredClone(party);
  if (variant === "broad") {
    next.baseline.potentialSupport += 2;
    next.baseline.mobilization -= 2;
    for (const key of Object.keys(next.electorateAffinity) as Array<
      keyof typeof next.electorateAffinity
    >) {
      next.electorateAffinity[key] = Math.min(100, next.electorateAffinity[key] + 2);
    }
    next.uniqueEventTags.push("broad_strategy");
  }
  if (variant === "territorial") {
    next.baseline.localStrength += 7;
    next.baseline.mediaPresence -= 3;
    for (const key of Object.keys(next.regionalAffinity) as Array<
      keyof typeof next.regionalAffinity
    >) {
      next.regionalAffinity[key] = Math.min(100, next.regionalAffinity[key] + 4);
    }
    next.uniqueEventTags.push("territorial_strategy");
  }
  return next;
}

export function CustomPartyScreen() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<CustomPartyInput>({
    name: "Mouvement des possibles",
    shortName: "MDP",
    primaryColor: CUSTOM_PARTY_COLORS[0]!,
    symbol: CUSTOM_PARTY_SYMBOLS[0]!,
    answers: DEFAULT_ANSWERS,
    leadershipModel: "balanced",
    organizationPriority: "members",
    measureIds: signatureMeasures.slice(0, 3).map((measure) => measure.id),
  });
  const [variant, setVariant] = useState<StrategyVariant>("natural");
  const goToScreen = useGameStore((state) => state.goToScreen);
  const confirmCustomParty = useGameStore((state) => state.confirmCustomParty);
  const party = useMemo(
    () => applyStrategyVariant(buildCustomParty(input), variant),
    [input, variant],
  );
  const steps = ["Identité", "Idées I", "Idées II", "Organisation", "Mesures", "Synthèse"];

  const updateAnswer = (questionId: string, optionId: string) =>
    setInput((current) => ({
      ...current,
      answers: { ...current.answers, [questionId]: optionId },
    }));

  const toggleMeasure = (measureId: string) =>
    setInput((current) => {
      const selected = current.measureIds.includes(measureId);
      if (!selected && current.measureIds.length >= 3) return current;
      return {
        ...current,
        measureIds: selected
          ? current.measureIds.filter((id) => id !== measureId)
          : [...current.measureIds, measureId],
      };
    });

  const canAdvance =
    step !== 0 || (input.name.trim().length >= 2 && input.shortName.trim().length >= 1);

  return (
    <ScreenShell
      eyebrow={`Création · ${steps[step]}`}
      title="Fondez votre mouvement"
      description="Un parcours court pour définir votre identité. Les valeurs de gameplay sont calculées automatiquement à partir de vos réponses."
    >
      <div
        className="mb-8 flex items-center gap-1"
        aria-label={`Étape ${step + 1} sur ${steps.length}`}
      >
        {steps.map((label, index) => (
          <div key={label} className="min-w-0 flex-1">
            <div
              className={cn(
                "h-1.5 rounded-full",
                index <= step ? "bg-[var(--blue-600)]" : "bg-[var(--line)]",
              )}
            />
            <span className="mt-2 hidden truncate text-[0.65rem] font-bold text-[var(--ink-muted)] sm:block">
              {label}
            </span>
          </div>
        ))}
      </div>

      {step === 0 ? (
        <Card className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_15rem]">
          <div className="space-y-5">
            <label className="block text-sm font-bold">
              Nom du mouvement
              <input
                value={input.name}
                maxLength={50}
                onChange={(event) =>
                  setInput((current) => ({ ...current, name: event.target.value }))
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base font-medium focus:border-[var(--blue-600)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]/25"
              />
            </label>
            <label className="block text-sm font-bold">
              Sigle
              <input
                value={input.shortName}
                maxLength={8}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    shortName: event.target.value.toUpperCase(),
                  }))
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base font-black uppercase focus:border-[var(--blue-600)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]/25"
              />
            </label>
            <fieldset>
              <legend className="text-sm font-bold">Couleur principale</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {CUSTOM_PARTY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Choisir la couleur ${color}`}
                    aria-pressed={input.primaryColor === color}
                    onClick={() => setInput((current) => ({ ...current, primaryColor: color }))}
                    className={cn(
                      "size-11 rounded-full border-4 border-white shadow-sm ring-2 transition",
                      input.primaryColor === color ? "ring-[var(--ink)]" : "ring-[var(--line)]",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <label className="relative flex size-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-[var(--line)] bg-white">
                  <span className="sr-only">Couleur personnalisée</span>
                  <Palette aria-hidden="true" className="size-5" />
                  <input
                    type="color"
                    value={input.primaryColor}
                    onChange={(event) =>
                      setInput((current) => ({ ...current, primaryColor: event.target.value }))
                    }
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-bold">Symbole original</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {CUSTOM_PARTY_SYMBOLS.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    aria-label={`Choisir le symbole ${symbol}`}
                    aria-pressed={input.symbol === symbol}
                    onClick={() => setInput((current) => ({ ...current, symbol }))}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl border text-xl",
                      input.symbol === symbol
                        ? "border-[var(--blue-600)] bg-[var(--blue-600)] text-white"
                        : "border-[var(--line)] bg-white",
                    )}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl bg-[var(--surface)] p-5 text-center">
            <PartyMark party={party} size="hero" />
            <strong className="mt-4 text-lg">{party.displayName}</strong>
            <span className="text-sm text-[var(--ink-muted)]">{party.shortName}</span>
          </div>
        </Card>
      ) : null}

      {[1, 2].includes(step) ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {ideologyQuestions.slice(step === 1 ? 0 : 4, step === 1 ? 4 : 8).map((question) => (
            <Card key={question.id} className="p-5">
              <fieldset>
                <legend className="font-black">{question.prompt}</legend>
                <div className="mt-4 space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition",
                        input.answers[question.id] === option.id
                          ? "border-[var(--blue-600)] bg-blue-50 text-[var(--blue-700)]"
                          : "border-[var(--line)] bg-white hover:border-[var(--blue-400)]",
                      )}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={input.answers[question.id] === option.id}
                        onChange={() => updateAnswer(question.id, option.id)}
                        className="size-4 accent-[var(--blue-600)]"
                      />
                      <span className="font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </Card>
          ))}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <ChoiceFieldset<LeadershipModel>
            legend="Comment se décide la ligne ?"
            value={input.leadershipModel}
            onChange={(leadershipModel) => setInput((current) => ({ ...current, leadershipModel }))}
            options={[
              [
                "vertical",
                "Direction verticale",
                "Décisions rapides, cohésion forte, implantation moindre",
              ],
              ["balanced", "Équilibre des pouvoirs", "Arbitrages réguliers et profil polyvalent"],
              [
                "decentralized",
                "Parti décentralisé",
                "Militants autonomes, implantation forte, frondes possibles",
              ],
            ]}
          />
          <ChoiceFieldset<OrganizationPriority>
            legend="Qui doit peser le plus ?"
            value={input.organizationPriority}
            onChange={(organizationPriority) =>
              setInput((current) => ({ ...current, organizationPriority }))
            }
            options={[
              ["officials", "Les élus", "Relais institutionnels et expérience"],
              ["members", "Les militants", "Réseau humain et force de mobilisation"],
              ["experts", "Les experts", "Crédibilité technique et préparation"],
            ]}
          />
        </div>
      ) : null}

      {step === 4 ? (
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--ink-muted)]">
              Choisissez jusqu’à trois mesures phares.
            </p>
            <span className="rounded-full bg-[var(--navy-950)] px-3 py-1 text-xs font-black text-white">
              {input.measureIds.length} / 3
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {signatureMeasures.map((measure) => {
              const selected = input.measureIds.includes(measure.id);
              return (
                <button
                  key={measure.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={!selected && input.measureIds.length >= 3}
                  onClick={() => toggleMeasure(measure.id)}
                  className={cn(
                    "min-h-28 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45",
                    selected
                      ? "border-[var(--blue-600)] bg-blue-50"
                      : "border-[var(--line)] bg-[var(--paper)] hover:border-[var(--blue-400)]",
                  )}
                >
                  <span className="flex items-start justify-between gap-3">
                    <strong>{measure.label}</strong>
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-[var(--blue-600)] bg-[var(--blue-600)] text-white"
                          : "border-[var(--line)]",
                      )}
                    >
                      {selected ? <Check aria-hidden="true" className="size-4" /> : null}
                    </span>
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-[var(--ink-muted)]">
                    {measure.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <PartyMark party={party} size="hero" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--blue-600)]">
                  Votre mouvement
                </p>
                <h2 className="mt-1 font-display text-3xl font-black uppercase">
                  {party.displayName}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                  {describeCustomPartyElectorate(party)}
                </p>
              </div>
            </div>
            <h3 className="mt-8 font-black">Mesures phares</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {party.program.map((measure) => (
                <li key={measure} className="rounded-xl bg-[var(--surface)] p-3 text-sm font-bold">
                  {measure}
                </li>
              ))}
            </ul>
            <fieldset className="mt-8">
              <legend className="font-black">Variante stratégique</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  ["natural", "Socle naturel", "Assumer le profil calculé"],
                  ["broad", "Conquête", "Élargir le potentiel, moins mobiliser"],
                  ["territorial", "Territoires", "S’implanter, moins médiatiser"],
                ].map(([id, label, description]) => (
                  <label
                    key={id}
                    className={cn(
                      "cursor-pointer rounded-xl border p-3 text-sm",
                      variant === id
                        ? "border-[var(--blue-600)] bg-blue-50"
                        : "border-[var(--line)]",
                    )}
                  >
                    <input
                      type="radio"
                      name="strategy-variant"
                      value={id}
                      checked={variant === id}
                      onChange={() => setVariant(id as StrategyVariant)}
                      className="mr-2 accent-[var(--blue-600)]"
                    />
                    <strong>{label}</strong>
                    <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                      {description}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Profil initial
            </h3>
            <dl className="mt-5 space-y-4 text-sm">
              {[
                ["Potentiel", `${party.baseline.potentialSupport.toFixed(0)} %`],
                ["Mobilisation", party.baseline.mobilization],
                ["Cohésion", party.baseline.cohesion],
                ["Crédibilité", party.baseline.governingCredibility],
                ["Implantation", party.baseline.localStrength],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b border-[var(--line)] pb-3"
                >
                  <dt className="text-[var(--ink-muted)]">{label}</dt>
                  <dd className="font-black">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row">
        <Button
          variant="ghost"
          onClick={() => (step === 0 ? goToScreen("mode") : setStep((current) => current - 1))}
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> Retour
        </Button>
        {step < steps.length - 1 ? (
          <Button disabled={!canAdvance} onClick={() => setStep((current) => current + 1)}>
            Continuer <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        ) : (
          <Button size="large" onClick={() => confirmCustomParty(party)}>
            Valider ce mouvement <PartyPopper aria-hidden="true" className="size-5" />
          </Button>
        )}
      </div>
    </ScreenShell>
  );
}

function ChoiceFieldset<T extends string>({
  legend,
  value,
  onChange,
  options,
}: {
  legend: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<[T, string, string]>;
}) {
  return (
    <Card className="p-6">
      <fieldset>
        <legend className="flex items-center gap-2 text-lg font-black">
          <Users aria-hidden="true" className="size-5 text-[var(--blue-600)]" /> {legend}
        </legend>
        <div className="mt-5 space-y-3">
          {options.map(([id, label, description]) => (
            <label
              key={id}
              className={cn(
                "block cursor-pointer rounded-xl border p-4",
                value === id ? "border-[var(--blue-600)] bg-blue-50" : "border-[var(--line)]",
              )}
            >
              <span className="flex items-center gap-3 font-black">
                <input
                  type="radio"
                  checked={value === id}
                  onChange={() => onChange(id)}
                  className="size-4 accent-[var(--blue-600)]"
                />
                {label}
              </span>
              <span className="mt-2 block pl-7 text-sm text-[var(--ink-muted)]">{description}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </Card>
  );
}

export function MethodSelectionScreen() {
  const setup = useGameStore((state) => state.setup);
  const chooseMethod = useGameStore((state) => state.chooseMethod);
  const updateLaunchDetails = useGameStore((state) => state.updateLaunchDetails);
  const launchCampaign = useGameStore((state) => state.launchCampaign);
  const goToScreen = useGameStore((state) => state.goToScreen);
  const error = useGameStore((state) => state.error);
  const selectedParty =
    setup.customParty ?? gameContent.parties.find((party) => party.id === setup.selectedPartyId);
  const defaultCandidate = setup.selectedPartyId
    ? candidateForParty(setup.selectedPartyId)?.displayName
    : undefined;
  const isRandom = setup.mode === "random";

  return (
    <ScreenShell
      eyebrow={isRandom ? "Mode surprise" : "Étape 2 sur 2"}
      title={isRandom ? "Fixez la graine du destin" : "Choisissez votre méthode"}
      description={
        isRandom
          ? "Le même texte de graine reproduira exactement le même tirage initial et les mêmes conséquences si vous reprenez les mêmes décisions."
          : "Votre méthode apporte un avantage net et un coût. Elle oriente la partie sans verrouiller votre stratégie."
      }
    >
      {!isRandom ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {gameContent.methods.map((method) => {
            const selected = setup.selectedMethodId === method.id;
            return (
              <button
                key={method.id}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseMethod(method.id)}
                className={cn(
                  "min-h-64 rounded-[1.25rem] border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2",
                  selected
                    ? "border-[var(--blue-600)] bg-[var(--navy-950)] text-white shadow-xl"
                    : "border-[var(--line)] bg-[var(--paper)] hover:-translate-y-0.5 hover:border-[var(--blue-400)]",
                )}
              >
                <span
                  className={cn(
                    "font-display text-4xl",
                    selected ? "text-[var(--gold-300)]" : "text-[var(--blue-600)]",
                  )}
                >
                  {method.symbol}
                </span>
                <strong className="mt-5 block font-display text-xl font-black uppercase leading-tight">
                  {method.title}
                </strong>
                <span
                  className={cn(
                    "mt-3 block text-sm leading-relaxed",
                    selected ? "text-slate-300" : "text-[var(--ink-muted)]",
                  )}
                >
                  {method.description}
                </span>
                <span className="mt-4 block space-y-1 text-xs font-bold">
                  {method.effects
                    .filter((effect) => effect.visibility !== "hidden" && effect.label)
                    .slice(0, 3)
                    .map((effect) => (
                      <span key={effect.label} className="block">
                        {effect.label}
                      </span>
                    ))}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <Card className="mx-auto max-w-2xl p-7 text-center">
          <Dices aria-hidden="true" className="mx-auto size-14 text-[var(--blue-600)]" />
          <h2 className="mt-5 font-display text-3xl font-black uppercase">
            Parti et méthode tirés au sort
          </h2>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Le tirage est déterministe : partagez la graine pour proposer exactement le même défi.
          </p>
        </Card>
      )}

      <Card className="mt-6 grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        {!isRandom ? (
          <label className="text-sm font-bold">
            Nom de votre candidate ou candidat fictif
            <input
              value={setup.candidateName ?? ""}
              placeholder={defaultCandidate ?? "Camille Horizon"}
              maxLength={60}
              onChange={(event) => updateLaunchDetails({ candidateName: event.target.value })}
              className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 font-medium focus:border-[var(--blue-600)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]/25"
            />
          </label>
        ) : (
          <div>
            <p className="text-sm font-bold">Configuration</p>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Candidat, parti et méthode fictifs seront révélés au lancement.
            </p>
          </div>
        )}
        <label className="text-sm font-bold">
          Graine de partie <span className="font-normal text-[var(--ink-muted)]">(facultatif)</span>
          <input
            value={setup.seed ?? ""}
            placeholder="Générée automatiquement"
            maxLength={80}
            spellCheck={false}
            onChange={(event) => updateLaunchDetails({ seed: event.target.value })}
            className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 font-mono text-sm focus:border-[var(--blue-600)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]/25"
          />
        </label>
        <Button
          size="large"
          disabled={!isRandom && !setup.selectedMethodId}
          onClick={launchCampaign}
        >
          Lancer la campagne <ArrowRight aria-hidden="true" className="size-5" />
        </Button>
      </Card>
      {selectedParty ? (
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Mouvement sélectionné :{" "}
          <strong className="text-[var(--ink)]">{selectedParty.displayName}</strong>
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm font-bold text-[var(--red-700)]">
          {error}
        </p>
      ) : null}
      <Button
        variant="ghost"
        className="mt-5"
        onClick={() =>
          goToScreen(
            isRandom ? "mode" : setup.mode === "custom_party" ? "custom_party" : "party_list",
          )
        }
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Modifier mon choix
      </Button>
    </ScreenShell>
  );
}

export function CampaignIntroScreen() {
  const gameState = useGameStore((state) => state.gameState);
  const beginCampaign = useGameStore((state) => state.beginCampaign);
  if (!gameState) return null;
  const party = gameState.parties[gameState.playerPartyId];
  if (!party) return null;

  return (
    <section className="relative isolate overflow-hidden bg-[var(--navy-950)] text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_20%,rgba(76,131,203,0.34),transparent_28rem),linear-gradient(125deg,transparent_0_58%,rgba(210,173,98,0.12)_58%_59%,transparent_59%)]"
      />
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <PartyMark party={party} size="hero" className="ring-8 ring-white/10" />
        <p className="mt-8 text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-300)]">
          Il reste 365 jours
        </p>
        <h1 className="mt-4 font-display text-5xl font-black uppercase leading-[0.93] sm:text-7xl">
          {gameState.player.displayName},
          <br />
          la campagne commence
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">
          Vous portez les couleurs de {party.displayName} avec la méthode «{" "}
          {gameState.player.archetype} ». Répondez aux événements, surveillez votre coalition et
          acceptez que le hasard garde sa part.
        </p>
        <div className="mt-8 grid w-full max-w-2xl grid-cols-3 gap-2 text-left">
          {[
            ["Socle", `${party.initialPolling.toFixed(1)} %`],
            ["Mobilisation", Math.round(party.stats.mobilization)],
            ["Crédibilité", Math.round(party.stats.credibility)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/[0.06] p-3 sm:p-4"
            >
              <span className="block text-xs text-slate-300">{label}</span>
              <strong className="mt-1 block text-lg sm:text-xl">{value}</strong>
            </div>
          ))}
        </div>
        <Button
          size="large"
          className="mt-10 bg-[var(--gold-400)] text-[var(--navy-950)] hover:bg-[var(--gold-300)]"
          onClick={beginCampaign}
        >
          Entrer en campagne <ArrowRight aria-hidden="true" className="size-5" />
        </Button>
        <p className="mt-8 max-w-xl text-xs leading-relaxed text-slate-400">
          Simulation politique fictive et indépendante. Les résultats ne constituent aucune
          prévision. Graine : <span className="font-mono text-slate-300">{gameState.seed}</span>
        </p>
      </div>
    </section>
  );
}
