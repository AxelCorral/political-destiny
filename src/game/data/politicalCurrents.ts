export interface PoliticalCurrentDefinition {
  id: string;
  displayName: string;
  shortName: string;
  associatedPartyIds: string[];
  possibleTrajectories: string[];
  editorialStatus: "context_only";
}

export const politicalCurrents: PoliticalCurrentDefinition[] = [
  {
    id: "udr",
    displayName: "Union des droites pour la République",
    shortName: "UDR",
    associatedPartyIds: ["rn", "lr", "reconquete"],
    possibleTrajectories: [
      "Rester alliée au Rassemblement national",
      "Prendre son autonomie",
      "Rejoindre une coalition de droite",
      "Soutenir un autre candidat fictif",
    ],
    editorialStatus: "context_only",
  },
];
