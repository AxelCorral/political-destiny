import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StatGauge } from "../stat-gauge";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase I (§19) — la polarité d'une
 * jauge doit être visible dans le dégradé ET dans un texte, jamais la
 * couleur seule ; les jauges existantes (polarité favorable implicite)
 * ne doivent pas changer visuellement.
 */
describe("StatGauge — polarité sémantique", () => {
  afterEach(() => cleanup());

  it("polarité favorable par défaut : pas de repère textuel, dégradé bleu/or", () => {
    const { container } = render(<StatGauge label="Popularité" value={62} />);
    expect(screen.queryByText(/à limiter|indicatif/)).not.toBeInTheDocument();
    const bar = container.querySelector(
      ".rounded-full.h-full, [class*='h-full'][class*='rounded-full']",
    );
    expect(bar?.className).toContain("var(--blue-600)");
    expect(bar?.className).toContain("var(--gold-400)");
  });

  it("polarité défavorable : dégradé distinct et repère texte « à limiter »", () => {
    const { container } = render(<StatGauge label="Rejet" value={40} polarity="unfavorable" />);
    expect(screen.getByText("(à limiter)")).toBeInTheDocument();
    const bar = container.querySelector("[class*='h-full'][class*='rounded-full']");
    expect(bar?.className).toContain("var(--red-700)");
  });

  it("polarité neutre : dégradé sobre et repère texte « indicatif »", () => {
    render(<StatGauge label="Test" value={40} polarity="neutral" />);
    expect(screen.getByText("(indicatif)")).toBeInTheDocument();
  });
});
