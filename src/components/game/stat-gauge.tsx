import { cn } from "@/lib/utils";

export function StatGauge({
  label,
  value,
  format = "score",
  compact = false,
}: {
  label: string;
  value: number;
  format?: "score" | "percent" | "money";
  compact?: boolean;
}) {
  const bounded = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const display =
    format === "percent"
      ? `${value.toFixed(1)} %`
      : format === "money"
        ? `${Math.round(value)}/100`
        : Math.round(value);
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
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--blue-600),var(--gold-400))] transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${bounded}%` }}
        />
      </div>
    </div>
  );
}
