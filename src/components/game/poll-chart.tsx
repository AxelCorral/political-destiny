import { PartyMark } from "@/components/game/party-mark";
import type { PartyState, PollSnapshot } from "@/game/types";

export function PollChart({
  poll,
  parties,
}: {
  poll: PollSnapshot;
  parties: Record<string, PartyState>;
}) {
  const ranking = Object.entries(poll.results)
    .filter(([partyId]) => parties[partyId]?.active)
    .sort((left, right) => right[1] - left[1]);
  const maximum = Math.max(25, ranking[0]?.[1] ?? 25);

  return (
    <div className="space-y-3" aria-label={`Sondage fictif ${poll.instituteLabel}`}>
      {ranking.map(([partyId, score], index) => {
        const party = parties[partyId];
        if (!party) return null;
        return (
          <div key={partyId} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3">
            <PartyMark visual={party.visual} name={party.displayName} size="small" />
            <div className="min-w-0">
              <div className="mb-1 flex justify-between gap-2 text-xs">
                <span className="truncate font-bold">{party.shortName}</span>
                <span className="sr-only">Rang {index + 1}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                <div
                  className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
                  style={{
                    width: `${(score / maximum) * 100}%`,
                    backgroundColor: party.visual.primaryColor,
                  }}
                />
              </div>
            </div>
            <strong className="w-14 text-right text-sm tabular-nums">{score.toFixed(1)} %</strong>
          </div>
        );
      })}
    </div>
  );
}
