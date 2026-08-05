import { cn } from "@/lib/utils";
import type { PartyVisual } from "@/game/types";

export function PartyMark({
  visual,
  name,
  party,
  size = "medium",
  className,
}: {
  visual?: PartyVisual;
  name?: string;
  party?: { visual: PartyVisual; displayName: string };
  size?: "small" | "medium" | "large" | "hero";
  className?: string;
}) {
  const resolvedVisual = party?.visual ?? visual;
  const resolvedName = party?.displayName ?? name ?? "ce mouvement";
  if (!resolvedVisual) return null;

  return (
    <span
      role="img"
      aria-label={`Emblème abstrait de ${resolvedName}`}
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-2xl border-2 font-black text-white shadow-sm",
        size === "small" && "size-10 text-sm",
        size === "medium" && "size-14 text-lg",
        size === "large" && "size-20 text-2xl",
        size === "hero" && "size-28 text-3xl",
        className,
      )}
      style={{
        background: `linear-gradient(145deg, ${resolvedVisual.primaryColor}, color-mix(in srgb, ${resolvedVisual.primaryColor} 65%, #071426))`,
        borderColor: resolvedVisual.secondaryColor,
      }}
    >
      <span aria-hidden="true" className="absolute -right-2 -top-3 text-4xl opacity-20">
        {resolvedVisual.symbol}
      </span>
      <span aria-hidden="true" className="relative">
        {resolvedVisual.monogram}
      </span>
    </span>
  );
}
