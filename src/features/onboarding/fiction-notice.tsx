"use client";

import { ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { getLocalSettings, saveLocalSettings } from "@/lib/storage/game-database";

export function FictionNotice() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    void getLocalSettings()
      .then((settings) => {
        if (!active) return;
        if (!settings.fictionNoticeSeen) setOpen(true);
        setChecked(true);
      })
      .catch(() => {
        if (!active) return;
        setOpen(true);
        setChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!checked) {
    return <div aria-hidden="true" className="fixed inset-0 z-40" />;
  }

  const acknowledge = async () => {
    try {
      const settings = await getLocalSettings();
      await saveLocalSettings({ ...settings, fictionNoticeSeen: true });
    } catch {
      // The notice can still be acknowledged for the current tab if storage is unavailable.
    }
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) void acknowledge();
      }}
      title="Avant d’entrer en campagne"
      description="Une règle éditoriale essentielle accompagne toute la partie."
    >
      <div className="rounded-2xl bg-[var(--navy-950)] p-5 text-white sm:p-6">
        <ShieldCheck aria-hidden="true" className="size-8 text-[var(--gold-300)]" />
        <p className="mt-4 text-base font-black">Simulation politique fictive.</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">
          Les événements, dialogues, probabilités, classements et résultats de ce jeu sont fictifs.
          Ils ne constituent ni une prédiction électorale, ni une information officielle, ni un
          soutien à un parti ou à une personnalité. Les paramètres de gameplay ne sont pas des
          mesures objectives de valeur politique.
        </p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[var(--ink-muted)]">
        Les candidatures jouables sont fictives. Vos parties restent dans le stockage local de cet
        appareil et peuvent être supprimées depuis les paramètres.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button asChild variant="ghost">
          <Link href="/methodologie">
            Lire la méthodologie <ExternalLink aria-hidden="true" className="size-4" />
          </Link>
        </Button>
        <Button onClick={acknowledge}>J’ai compris</Button>
      </div>
    </Dialog>
  );
}
