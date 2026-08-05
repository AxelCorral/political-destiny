import { REGION_LABELS } from "@/game/data/electorate";
import type { PartyState, RegionalResult } from "@/game/types";

const POSITIONS = {
  north: "col-start-2 row-start-1",
  west: "col-start-1 row-start-2",
  ile_de_france: "col-start-2 row-start-2",
  east: "col-start-3 row-start-2",
  central: "col-start-2 row-start-3",
  south_west: "col-start-1 row-start-4",
  south_east: "col-start-3 row-start-4",
  overseas: "col-start-1 row-start-5",
} as const;

export function RegionalMap({
  results,
  parties,
}: {
  results: RegionalResult[];
  parties: Record<string, PartyState>;
}) {
  return (
    <figure>
      <div
        className="mx-auto grid max-w-sm grid-cols-3 grid-rows-[repeat(5,3.2rem)] gap-1.5"
        aria-label="Carte régionale schématique des forces électorales"
      >
        {results.map((region) => {
          const party = parties[region.winnerPartyId];
          const position = POSITIONS[region.regionId];
          return (
            <div
              key={region.regionId}
              className={`${position} grid place-items-center rounded-xl border border-black/10 p-1 text-center text-[0.62rem] font-black leading-tight text-white shadow-sm`}
              style={{ backgroundColor: party?.visual.primaryColor ?? "#647187" }}
              title={`${REGION_LABELS[region.regionId]} : ${party?.displayName ?? "Indéterminé"}`}
            >
              <span>{REGION_LABELS[region.regionId]}</span>
              <span className="mt-0.5 text-[0.58rem] opacity-80">{party?.shortName}</span>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 text-center text-xs text-[var(--ink-muted)]">
        Représentation schématique — le résultat officiel est national.
      </figcaption>
    </figure>
  );
}
