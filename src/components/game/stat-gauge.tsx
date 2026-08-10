import { cn } from "@/lib/utils";

export type StatGaugePolarity = "favorable" | "unfavorable" | "neutral";

const POLARITY_GRADIENT: Record<StatGaugePolarity, string> = {
  favorable: "bg-[linear-gradient(90deg,var(--blue-600),var(--gold-400))]",
  unfavorable: "bg-[linear-gradient(90deg,var(--blue-400),var(--red-700))]",
  neutral: "bg-[linear-gradient(90deg,var(--slate-500),var(--slate-700))]",
};

const POLARITY_TAG: Record<StatGaugePolarity, { text: string; className: string } | undefined> = {
  favorable: undefined,
  unfavorable: { text: "à limiter", className: "text-[var(--red-700)]" },
  neutral: { text: "indicatif", className: "text-[var(--ink-muted)]" },
};

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase I (§19) — polarité sémantique
 * des jauges. `polarity` change le dégradé ET ajoute un court repère
 * textuel (jamais la couleur seule) pour les stats où une valeur haute est
 * défavorable (ex. Rejet) ou sans direction claire — les stats favorables
 * gardent le dégradé bleu/or existant par défaut, sans changement visuel.
 */
export function StatGauge({
  label,
  value,
  format = "score",
  compact = false,
  polarity = "favorable",
}: {
  label: string;
  value: number;
  format?: "score" | "percent" | "money";
  compact?: boolean;
  polarity?: StatGaugePolarity;
}) {
  const bounded = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const display =
    format === "percent"
      ? `${value.toFixed(1)} %`
      : format === "money"
        ? `${Math.round(value)}/100`
        : Math.round(value);
  const tag = POLARITY_TAG[polarity];
  return (
    <div className={cn("min-w-0", compact ? "space-y-1" : "space-y-2")}>
      <div className="flex items-end justify-between gap-2">
        <span
          className={cn(
            "truncate font-bold text-[var(--ink-muted)]",
            compact ? "text-[0.68rem]" : "text-xs",
          )}
        >
          {label}
          {tag ? (
            <span className={cn("ml-1.5 font-black lowercase", tag.className)}>({tag.text})</span>
          ) : null}
        </span>
        <strong className={cn("tabular-nums text-[var(--ink)]", compact ? "text-xs" : "text-sm")}>
          {display}
        </strong>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-[var(--surface-raised)]",
          compact ? "h-1.5" : "h-2",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
            POLARITY_GRADIENT[polarity],
          )}
          style={{ width: `${bounded}%` }}
        />
      </div>
    </div>
  );
}
