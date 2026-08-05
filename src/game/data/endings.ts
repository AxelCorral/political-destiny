import type { EndingDefinition } from "@/game/types";

export const endings: EndingDefinition[] = [
  {
    id: "president",
    title: "Président de la République",
    narrative:
      "Votre coalition franchit la dernière marche. La campagne se tait, les responsabilités commencent et chacune de vos promesses rejoint désormais l’épreuve du pouvoir.",
  },
  {
    id: "runoff_defeat",
    title: "Stratège sans couronne",
    narrative:
      "Vous avez atteint le duel final, mais les reports et l’abstention dessinent une autre majorité. Votre mouvement sort pourtant transformé de cette année.",
  },
  {
    id: "narrow_elimination",
    title: "Éliminé de peu",
    narrative:
      "Quelques points seulement vous séparent du second tour. Cette défaite courte nourrit déjà une question : recommencer, rassembler autrement ou passer la main ?",
  },
  {
    id: "honorable_campaign",
    title: "Campagne honorable",
    narrative:
      "Le résultat ne renverse pas la table, mais votre voix a compté. Le parti conserve des appuis, une ligne et plusieurs chemins pour la suite.",
  },
  {
    id: "collapse",
    title: "Campagne naufragée",
    narrative:
      "Les urnes sanctionnent une campagne qui n’a jamais retrouvé son équilibre. Commence désormais une reconstruction longue, lucide et sans garantie.",
  },
  {
    id: "kingmaker",
    title: "Faiseur de roi",
    narrative:
      "Vous n’êtes pas finaliste, mais votre score et votre parole peuvent faire basculer le duel. Votre défaite devient un pouvoir de négociation fragile.",
  },
  {
    id: "strengthened_party",
    title: "Parti renforcé",
    narrative:
      "L’Élysée reste loin, mais votre mouvement progresse, recrute et s’implante. Cette campagne perdue ressemble au premier chapitre d’une victoire possible.",
  },
  {
    id: "divided_party",
    title: "Parti divisé",
    narrative:
      "La campagne a révélé plus de fractures qu’elle n’en a refermées. Les cadres fictifs se préparent déjà à disputer l’héritage et la direction.",
  },
  {
    id: "withdrawn",
    title: "Candidature retirée",
    narrative:
      "Vous quittez la course avant le verdict des urnes. Le geste évite peut-être le pire, mais laisse militants et alliés devant une histoire inachevée.",
  },
  {
    id: "retirement",
    title: "Retraite politique",
    narrative:
      "Vous choisissez de ne pas transformer la défaite en sursis permanent. Votre dernière campagne se referme sur un bilan discuté, mais assumé.",
  },
  {
    id: "secret_national_union",
    title: "L’union nationale improbable",
    narrative:
      "Uchronie fictive : une crise institutionnelle conduit des adversaires à former une coalition temporaire. Vous devenez l’un des garants d’un équilibre exceptionnel et précaire.",
    secret: true,
  },
  {
    id: "secret_monarchy",
    title: "La couronne en carton",
    narrative:
      "Uchronie satirique : une plaisanterie constitutionnelle échappe à ses auteurs et domine le débat. Le pays conserve ses institutions, mais la campagne restera légendaire.",
    secret: true,
  },
  {
    id: "secret_fragmentation",
    title: "L’archipel des partis",
    narrative:
      "Uchronie fictive : scissions et dissidences se multiplient jusqu’à rendre toute majorité introuvable. Votre candidature survit dans un paysage entièrement recomposé.",
    secret: true,
  },
  {
    id: "secret_authoritarian",
    title: "La ligne rouge",
    narrative:
      "Uchronie critique : l’accumulation de décisions d’exception fragilise les contre-pouvoirs. Le bilan souligne cette dérive sans la présenter comme une réussite.",
    secret: true,
  },
  {
    id: "secret_civil_unrest",
    title: "La campagne mise en retrait",
    narrative:
      "Fin exceptionnelle : après plusieurs alertes et un dernier meeting interrompu, votre équipe suspend vos apparitions. La campagne continue sans vous et transforme l’épuisement ignoré en avertissement politique.",
    secret: true,
  },
];
