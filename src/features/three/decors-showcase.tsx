"use client";

import { figurineSpecs } from "./figurines/specs";
import { DebateScene, ElyseeScene, PodiumScene } from "./scenes/scenes";

/** Vitrine des décors 3D avec des données d'exemple (aucun état de partie). */
export default function DecorsShowcase() {
  const s = figurineSpecs;
  return (
    <div className="grid gap-6">
      <div className="h-80 overflow-hidden rounded-2xl">
        <DebateScene left={s.glucksmann!} right={s.le_pen!} label="Exemple de débat télévisé" />
      </div>
      <div className="h-80 overflow-hidden rounded-2xl">
        <PodiumScene
          playerId="ps"
          label="Exemple de podium de soirée électorale"
          entries={[
            { partyId: "rn", score: 31.2, spec: s.le_pen! },
            { partyId: "ps", score: 19.4, spec: s.glucksmann! },
            { partyId: "horizons", score: 14.1, spec: s.philippe! },
            { partyId: "lfi", score: 12.8, spec: s.melenchon! },
          ]}
        />
      </div>
      <div className="h-80 overflow-hidden rounded-2xl">
        <ElyseeScene player={s.philippe!} won label="Exemple d’arrivée à l’Élysée" />
      </div>
    </div>
  );
}
