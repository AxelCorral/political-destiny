import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--ink-muted)]">{hint}</p> : null}
    </div>
  );
}

/** CSS-only horizontal bar — no new charting dependency, consistent with the hand-rolled SVG already used in src/features/results/final-screen.tsx. */
export function SimpleBar({ ratio, label }: { ratio: number; label?: string }) {
  const percent = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-32 overflow-hidden rounded-full bg-[var(--surface-raised)]">
        <div
          className="h-full rounded-full bg-[var(--blue-600)]"
          style={{ width: `${percent}%` }}
        />
      </div>
      {label ? <span className="text-xs text-[var(--ink-muted)]">{label}</span> : null}
    </div>
  );
}

export function SectionCaution({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 rounded-lg bg-[var(--surface-raised)] p-3 text-xs leading-relaxed text-[var(--ink-muted)]">
      {children}
    </p>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-[var(--line)] p-6 text-sm text-[var(--ink-muted)]">
      {children}
    </p>
  );
}
