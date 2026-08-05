"use client";

import { Download, Share2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { GameState } from "@/game/types";
import { formatPercent } from "@/lib/game-presentation";
import { cn } from "@/lib/utils";

type ShareFormat = "portrait" | "landscape";

export function ShareResult({ state }: { state: GameState }) {
  const [format, setFormat] = useState<ShareFormat>("portrait");
  const [status, setStatus] = useState<string>();
  const artworkRef = useRef<HTMLDivElement>(null);
  const result = state.finalResult;
  const party = state.parties[state.playerPartyId];
  if (!result || !party) return null;

  const makeFile = async () => {
    if (!artworkRef.current) throw new Error("Carte de partage indisponible.");
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(artworkRef.current, {
      backgroundColor: "#071426",
      cacheBust: true,
      pixelRatio: 2,
    });
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], `vers-lelysee-${state.runId}-${format}.png`, { type: "image/png" });
  };

  const download = async () => {
    try {
      setStatus("Génération de l’image…");
      const file = await makeFile();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
      setStatus("Image téléchargée.");
    } catch {
      setStatus("La génération de l’image a échoué sur ce navigateur.");
    }
  };

  const share = async () => {
    try {
      setStatus("Préparation du partage…");
      const file = await makeFile();
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Ma campagne — ${result.title}`,
          text: `J’ai obtenu ${result.score}/100 dans Vers l’Élysée, une simulation politique fictive.`,
          files: [file],
        });
        setStatus("Carte partagée.");
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
        setStatus("Partage non disponible : l’image a été téléchargée.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("Partage annulé.");
      } else {
        setStatus("Impossible de partager cette image.");
      }
    }
  };

  return (
    <section aria-labelledby="share-title">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--blue-600)]">
            Carte de résultat
          </p>
          <h2 id="share-title" className="mt-1 text-2xl font-black">
            Partagez votre campagne
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Image générée sur votre appareil, sans logo ni photographie officiels.
          </p>
        </div>
        <div
          className="flex rounded-xl border border-[var(--line)] bg-white p-1"
          aria-label="Format de l’image"
        >
          {(["portrait", "landscape"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={format === value}
              onClick={() => setFormat(value)}
              className={cn(
                "min-h-10 rounded-lg px-3 text-xs font-black",
                format === value ? "bg-[var(--navy-950)] text-white" : "text-[var(--ink-muted)]",
              )}
            >
              {value === "portrait" ? "Portrait" : "Paysage"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-[var(--navy-950)] p-5 text-white shadow-xl sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-[var(--gold-300)]">
              Vers l’Élysée
            </p>
            <h3 className="mt-2 font-display text-2xl font-black uppercase">{result.title}</h3>
          </div>
          <strong className="font-display text-4xl font-black text-[var(--gold-300)]">
            {result.score}
            <span className="text-lg">/100</span>
          </strong>
        </div>
        <p className="mt-5 text-sm text-slate-300">
          {state.player.displayName} · {party.displayName}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-white/10 p-3">
            <span className="block text-slate-400">Résultat</span>
            <strong className="mt-1 block">{formatPercent(result.finalVoteShare)}</strong>
          </div>
          <div className="rounded-lg bg-white/10 p-3">
            <span className="block text-slate-400">Progression</span>
            <strong className="mt-1 block">
              {result.pollingProgression >= 0 ? "+" : ""}
              {result.pollingProgression.toFixed(1)} pt
            </strong>
          </div>
          <div className="rounded-lg bg-white/10 p-3">
            <span className="block text-slate-400">Badges</span>
            <strong className="mt-1 block">{result.unlockedAchievementIds.length}</strong>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button onClick={share}>
          <Share2 aria-hidden="true" className="size-4" /> Partager
        </Button>
        <Button variant="secondary" onClick={download}>
          <Download aria-hidden="true" className="size-4" /> Télécharger le PNG
        </Button>
      </div>
      {status ? (
        <p role="status" className="mt-3 text-sm text-[var(--ink-muted)]">
          {status}
        </p>
      ) : null}

      <div aria-hidden="true" className="fixed -left-[10000px] top-0">
        <ShareArtwork ref={artworkRef} state={state} format={format} />
      </div>
    </section>
  );
}

function ShareArtwork({
  ref,
  state,
  format,
}: {
  ref: React.Ref<HTMLDivElement>;
  state: GameState;
  format: ShareFormat;
}) {
  const result = state.finalResult!;
  const party = state.parties[state.playerPartyId]!;
  const highlight = result.bestDecisionIndex
    ? state.decisionHistory.find((decision) => decision.decisionIndex === result.bestDecisionIndex)
    : state.decisionHistory.at(-1);
  const width = format === "portrait" ? 540 : 600;
  const height = format === "portrait" ? 675 : 315;
  return (
    <div
      ref={ref}
      style={{
        width,
        height,
        color: "#ffffff",
        background: `radial-gradient(circle at 85% 10%, ${party.visual.primaryColor}88, transparent 45%), linear-gradient(145deg, #071426, #0b1e39)`,
        padding: format === "portrait" ? 48 : 34,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            color: "#e8c982",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: 2.2,
            textTransform: "uppercase",
          }}
        >
          Vers l’Élysée
        </span>
        <span
          style={{
            border: "1px solid rgba(255,255,255,.25)",
            borderRadius: 999,
            padding: "7px 12px",
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          Simulation fictive
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: format === "portrait" ? "column" : "row",
          gap: 24,
          alignItems: format === "portrait" ? "stretch" : "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              border: `3px solid ${party.visual.secondaryColor}`,
              background: party.visual.primaryColor,
              display: "grid",
              placeItems: "center",
              fontSize: 21,
              fontWeight: 900,
            }}
          >
            {party.visual.monogram}
          </div>
          <div style={{ marginTop: 24, color: "#c9d3e2", fontSize: 15 }}>
            {state.player.displayName} · {party.displayName}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: format === "portrait" ? 43 : 34,
              lineHeight: 0.95,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            {result.title}
          </div>
          {format === "portrait" ? (
            <div style={{ marginTop: 18, color: "#c9d3e2", fontSize: 14, lineHeight: 1.45 }}>
              Moment fort : {highlight?.outcomeTitle ?? result.title}
            </div>
          ) : null}
        </div>
        <div style={{ width: format === "portrait" ? "100%" : 215 }}>
          <div
            style={{
              color: "#e8c982",
              fontSize: format === "portrait" ? 88 : 72,
              lineHeight: 1,
              fontWeight: 900,
            }}
          >
            {result.score}
            <span style={{ fontSize: 24 }}>/100</span>
          </div>
          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: format === "portrait" ? "repeat(3,1fr)" : "1fr",
              gap: 8,
            }}
          >
            {[
              ["Suffrages", formatPercent(result.finalVoteShare)],
              [
                "Progression",
                `${result.pollingProgression >= 0 ? "+" : ""}${result.pollingProgression.toFixed(1)} pt`,
              ],
              ["Badges", String(result.unlockedAchievementIds.length)],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  border: "1px solid rgba(255,255,255,.14)",
                  background: "rgba(255,255,255,.07)",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ color: "#aebbd0", fontSize: 10 }}>{label}</div>
                <div style={{ marginTop: 4, fontSize: 16, fontWeight: 900 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        style={{ display: "flex", justifyContent: "space-between", color: "#93a3bb", fontSize: 10 }}
      >
        <span>Graine : {state.seed.slice(0, 32)}</span>
        <span>Résultat non prédictif</span>
      </div>
    </div>
  );
}
