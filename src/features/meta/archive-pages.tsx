"use client";

import { Archive, ArrowLeft, CalendarDays, Share2, Trash2, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PartyMark } from "@/components/game/party-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { NewCampaignButton } from "@/features/campaign/new-campaign-button";
import { gameContent } from "@/game/data";
import type { CompletedRunSummary, PollSnapshot } from "@/game/types";
import {
  deleteCompletedRun,
  getCompletedRun,
  listCompletedRuns,
  type LocalProfile,
  getLocalProfile,
} from "@/lib/storage/game-database";
import { formatCampaignDate, formatPercent } from "@/lib/game-presentation";

export function ArchivesPageClient() {
  const [runs, setRuns] = useState<CompletedRunSummary[]>();
  const [profile, setProfile] = useState<LocalProfile>();
  const [deleteTarget, setDeleteTarget] = useState<CompletedRunSummary>();

  const refresh = async () => {
    const [nextRuns, nextProfile] = await Promise.all([listCompletedRuns(), getLocalProfile()]);
    setRuns(nextRuns);
    setProfile(nextProfile);
  };

  useEffect(() => {
    let active = true;
    void Promise.all([listCompletedRuns(), getLocalProfile()]).then(([nextRuns, nextProfile]) => {
      if (!active) return;
      setRuns(nextRuns);
      setProfile(nextProfile);
    });
    return () => {
      active = false;
    };
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteCompletedRun(deleteTarget.id);
    setDeleteTarget(undefined);
    await refresh();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-14 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--blue-600)]">
        Panthéon local
      </p>
      <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <h1 className="font-display text-5xl font-black uppercase leading-none">
            Archives des campagnes
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--ink-muted)]">
            Vos carrières terminées restent sur cet appareil. Ouvrez une campagne pour revoir ses
            moments décisifs.
          </p>
        </div>
        {profile ? (
          <dl className="grid grid-cols-3 gap-2">
            <ArchiveMetric label="Campagnes" value={profile.completedRuns} />
            <ArchiveMetric label="Victoires" value={profile.victories} />
            <ArchiveMetric label="Record" value={`${profile.bestScore}/100`} />
          </dl>
        ) : null}
      </div>

      {runs === undefined ? (
        <p className="mt-10 text-sm text-[var(--ink-muted)]">Lecture des archives locales…</p>
      ) : runs.length ? (
        <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {runs.map((run) => (
            <Card key={run.id} className="flex flex-col overflow-hidden">
              <div className="h-2" style={{ backgroundColor: run.partyVisual.primaryColor }} />
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <PartyMark visual={run.partyVisual} name={run.partyName} size="large" />
                  <strong className="font-display text-4xl font-black text-[var(--blue-700)]">
                    {run.score}
                    <span className="text-base">/100</span>
                  </strong>
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.13em] text-[var(--blue-600)]">
                  {run.resultTitle}
                </p>
                <h2 className="mt-2 text-xl font-black">{run.candidateName}</h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">{run.partyName}</p>
                <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-[var(--surface)] p-3">
                    <dt className="text-xs text-[var(--ink-muted)]">Dernier score</dt>
                    <dd className="mt-1 font-black">{formatPercent(run.finalVoteShare)}</dd>
                  </div>
                  <div className="rounded-xl bg-[var(--surface)] p-3">
                    <dt className="text-xs text-[var(--ink-muted)]">Badges</dt>
                    <dd className="mt-1 font-black">{run.badges.length}</dd>
                  </div>
                </dl>
                <p className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                  <CalendarDays aria-hidden="true" className="size-4" />{" "}
                  {new Date(run.completedAt).toLocaleDateString("fr-FR")}
                </p>
                <div className="mt-6 flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/archives/${run.id}`}>Ouvrir</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Supprimer la campagne de ${run.candidateName}`}
                    onClick={() => setDeleteTarget(run)}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-9 p-8 text-center sm:p-12">
          <Archive aria-hidden="true" className="mx-auto size-12 text-[var(--blue-600)]" />
          <h2 className="mt-5 text-2xl font-black">Le panthéon est encore vide</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--ink-muted)]">
            Terminez une campagne : son score, ses badges et ses décisions marquantes seront
            archivés automatiquement.
          </p>
          {/* Même libellé que le CTA de l'accueil, donc même intention : démarrer
              une campagne, jamais reprendre silencieusement la sauvegarde active
              (le panthéon peut être vide alors qu'une campagne est en cours). */}
          <NewCampaignButton asLink className="mt-6">
            Lancer une campagne
          </NewCampaignButton>
        </Card>
      )}

      <Dialog
        open={deleteTarget !== undefined}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Supprimer cette campagne ?"
        description="Cette action efface uniquement cette archive de cet appareil."
      >
        <p className="text-sm text-[var(--ink-muted)]">
          La carrière de {deleteTarget?.candidateName} ne pourra pas être récupérée, sauf si vous
          avez exporté vos données.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(undefined)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            <Trash2 aria-hidden="true" className="size-4" /> Supprimer
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function ArchiveMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-24 rounded-xl border border-[var(--line)] bg-white p-3 text-center">
      <dt className="text-[0.65rem] font-bold text-[var(--ink-muted)]">{label}</dt>
      <dd className="mt-1 font-black">{value}</dd>
    </div>
  );
}

export function ArchiveDetailClient({ id }: { id: string }) {
  const [run, setRun] = useState<CompletedRunSummary | null>();

  useEffect(() => {
    let active = true;
    void getCompletedRun(id).then((value) => {
      if (active) setRun(value ?? null);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (run === undefined)
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-[var(--ink-muted)]">
        Lecture de la campagne…
      </div>
    );
  if (run === null)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-black uppercase">Archive introuvable</h1>
        <p className="mt-4 text-[var(--ink-muted)]">
          Elle a peut-être été supprimée de cet appareil.
        </p>
        <Button asChild className="mt-6">
          <Link href="/archives">
            <ArrowLeft aria-hidden="true" className="size-4" /> Revenir aux archives
          </Link>
        </Button>
      </div>
    );

  const badges = run.badges
    .map((badgeId) => gameContent.achievements.find((badge) => badge.id === badgeId))
    .filter((badge) => badge !== undefined);
  return (
    <div>
      <section className="bg-[var(--navy-950)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Button
            asChild
            variant="ghost"
            className="mb-7 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <Link href="/archives">
              <ArrowLeft aria-hidden="true" className="size-4" /> Toutes les archives
            </Link>
          </Button>
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <PartyMark visual={run.partyVisual} name={run.partyName} size="large" />
              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-300)]">
                {run.resultTitle}
              </p>
              <h1 className="mt-2 font-display text-5xl font-black uppercase sm:text-6xl">
                {run.candidateName}
              </h1>
              <p className="mt-3 text-slate-300">
                {run.partyName} · {new Date(run.completedAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="font-display text-7xl font-black text-[var(--gold-300)]">
              {run.score}
              <span className="text-2xl">/100</span>
            </div>
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <Card className="p-5 sm:p-7">
            <h2 className="text-2xl font-black">Courbe de campagne</h2>
            <ArchivePollTrend polls={run.pollHistory} partyId={run.partyId} />
          </Card>
          <Card className="p-5 sm:p-7">
            <h2 className="text-2xl font-black">Fiche de carrière</h2>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                ["Résultat final", formatPercent(run.finalVoteShare)],
                [
                  "Progression",
                  `${run.finalResult.pollingProgression >= 0 ? "+" : ""}${run.finalResult.pollingProgression.toFixed(1)} pt`,
                ],
                [
                  "Premier tour",
                  `${run.finalResult.playerRank}${run.finalResult.playerRank === 1 ? "er" : "e"}`,
                ],
                ["Victoire", run.won ? "Oui" : "Non"],
                ["Meilleur fait", run.bestFeat],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-5 border-b border-[var(--line)] pb-3"
                >
                  <dt className="text-[var(--ink-muted)]">{label}</dt>
                  <dd className="max-w-[60%] text-right font-black">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>
        <Card className="p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <Trophy aria-hidden="true" className="size-6 text-[var(--warning)]" /> Badges de cette
            campagne
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold"
              >
                <span aria-hidden="true">{badge.icon}</span>
                {badge.title}
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 sm:p-7">
          <h2 className="text-2xl font-black">Journal des décisions</h2>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {run.decisions.map((decision) => (
              <li
                key={decision.decisionIndex}
                className="rounded-xl border border-[var(--line)] p-4"
              >
                <p className="text-[0.65rem] font-black uppercase tracking-wider text-[var(--blue-600)]">
                  Décision {decision.decisionIndex} · {formatCampaignDate(decision.date)}
                </p>
                <h3 className="mt-2 font-black">{decision.eventTitle}</h3>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">{decision.choiceLabel}</p>
                <p className="mt-2 text-sm font-bold">{decision.outcomeTitle}</p>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--ink-muted)]">
                Graine
              </p>
              <code className="mt-2 block break-all text-sm">{run.seed}</code>
            </div>
            <ArchiveShareButton run={run} />
          </div>
        </Card>
      </main>
    </div>
  );
}

function ArchivePollTrend({ polls, partyId }: { polls: PollSnapshot[]; partyId: string }) {
  const values = polls.map((poll) => poll.results[partyId] ?? 0);
  if (!values.length)
    return <p className="mt-5 text-sm text-[var(--ink-muted)]">Aucun bulletin archivé.</p>;
  const width = 620;
  const height = 170;
  const min = Math.max(0, Math.min(...values) - 2);
  const max = Math.max(...values) + 2;
  const points = values
    .map(
      (value, index) =>
        `${values.length === 1 ? width / 2 : (index / (values.length - 1)) * width},${height - ((value - min) / Math.max(1, max - min)) * (height - 24) - 12}`,
    )
    .join(" ");
  return (
    <figure className="mt-5">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`Courbe de ${values[0]?.toFixed(1)} à ${values.at(-1)?.toFixed(1)} pour cent`}
      >
        <polyline
          points={points}
          fill="none"
          stroke="#1d56a0"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <figcaption className="flex justify-between text-xs text-[var(--ink-muted)]">
        <span>{values[0]?.toFixed(1)} %</span>
        <span>{values.at(-1)?.toFixed(1)} %</span>
      </figcaption>
    </figure>
  );
}

function ArchiveShareButton({ run }: { run: CompletedRunSummary }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>();
  const share = async () => {
    if (!ref.current) return;
    setStatus("Génération…");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(ref.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#071426",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `vers-lelysee-${run.id}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] }))
        await navigator.share({ title: run.resultTitle, files: [file] });
      else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }
      setStatus("Carte prête.");
    } catch {
      setStatus("Partage impossible.");
    }
  };
  return (
    <>
      <div>
        <Button onClick={share}>
          <Share2 aria-hidden="true" className="size-4" /> Partager la carrière
        </Button>
        {status ? (
          <p role="status" className="mt-2 text-xs text-[var(--ink-muted)]">
            {status}
          </p>
        ) : null}
      </div>
      <div aria-hidden="true" className="fixed -left-[10000px] top-0">
        <div
          ref={ref}
          style={{
            width: 600,
            height: 315,
            padding: 36,
            color: "white",
            background: `radial-gradient(circle at 80% 10%, ${run.partyVisual.primaryColor}aa, transparent 45%), #071426`,
            fontFamily: "Arial, sans-serif",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 900,
              color: "#e8c982",
              letterSpacing: 2,
            }}
          >
            <span>VERS L’ÉLYSÉE</span>
            <span style={{ fontSize: 11 }}>SIMULATION FICTIVE</span>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#c9d3e2" }}>
              {run.candidateName} · {run.partyName}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 38,
                lineHeight: 1,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              {run.resultTitle}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, color: "#aebbd0" }}>
              Graine : {run.seed.slice(0, 32)}
              <br />
              {formatPercent(run.finalVoteShare)} · {run.badges.length} badges
            </div>
            <div style={{ fontSize: 68, lineHeight: 1, fontWeight: 900, color: "#e8c982" }}>
              {run.score}
              <span style={{ fontSize: 20 }}>/100</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
