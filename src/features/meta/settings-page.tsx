"use client";

import {
  BarChart3,
  Database,
  Download,
  FileJson,
  HardDrive,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getAnalyticsMode, setAnalyticsConsent } from "@/analytics";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import {
  deleteAllLocalData,
  exportLocalData,
  getLocalSettings,
  importLocalData,
  saveLocalSettings,
  type LocalSettings,
} from "@/lib/storage/game-database";

export function SettingsPageClient() {
  const [settings, setSettings] = useState<LocalSettings>();
  const [status, setStatus] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [storageUsage, setStorageUsage] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getLocalSettings().then(setSettings);
    if (navigator.storage?.estimate) {
      void navigator.storage.estimate().then(({ usage }) => {
        if (usage !== undefined)
          setStorageUsage(
            `${(usage / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} Ko utilisés par ce site`,
          );
      });
    }
  }, []);

  const updateSettings = async (next: LocalSettings) => {
    setSettings(next);
    document.documentElement.dataset.reduceMotion = String(next.reducedMotion);
    await saveLocalSettings(next);
    setStatus("Préférences enregistrées sur cet appareil.");
  };

  const exportData = async () => {
    const data = await exportLocalData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vers-lelysee-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
    setStatus("Export JSON téléchargé.");
  };

  const importData = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      await importLocalData(JSON.parse(text) as unknown);
      const next = await getLocalSettings();
      setSettings(next);
      setStatus("Données importées. Les archives compatibles ont été fusionnées.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Import impossible.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const updateConsent = async (state: "granted" | "denied") => {
    await setAnalyticsConsent(state);
    setSettings(await getLocalSettings());
    setStatus(
      state === "granted"
        ? "Statistiques anonymes activées. Vous pouvez les désactiver à tout moment ci-dessous."
        : "Statistiques anonymes désactivées. Rien n’est envoyé et la file d’attente locale a été vidée.",
    );
  };

  const erase = async () => {
    await deleteAllLocalData();
    setSettings({
      reducedMotion: false,
      soundEnabled: false,
      fictionNoticeSeen: false,
      analyticsConsent: "unset",
    });
    document.documentElement.dataset.reduceMotion = "false";
    setConfirmDelete(false);
    setStatus("Toutes les données locales du jeu ont été supprimées.");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-9 sm:px-6 sm:py-14 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--blue-600)]">
        Contrôle local
      </p>
      <h1 className="mt-3 font-display text-5xl font-black uppercase leading-none">Paramètres</h1>
      <p className="mt-4 max-w-2xl text-[var(--ink-muted)]">
        Réglez l’affichage et gérez vos sauvegardes. Rien n’est envoyé à un serveur.
      </p>

      <div className="mt-9 space-y-5">
        <Card className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[var(--blue-600)]">
              <RotateCcw aria-hidden="true" className="size-6" />
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-black">Mouvements réduits</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                Désactive les transitions décoratives, y compris lorsque le système ne signale pas
                cette préférence.
              </p>
              {settings ? (
                <label className="mt-5 flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4">
                  <span className="text-sm font-bold">Réduire les animations</span>
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(event) =>
                      void updateSettings({ ...settings, reducedMotion: event.target.checked })
                    }
                    className="size-5 accent-[var(--blue-600)]"
                  />
                </label>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-[var(--success)]">
              <Database aria-hidden="true" className="size-6" />
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-black">Sauvegardes et portabilité</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                L’export contient votre partie active, vos archives, badges et préférences. L’import
                vérifie le format avant toute écriture.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button onClick={exportData}>
                  <Download aria-hidden="true" className="size-4" /> Exporter en JSON
                </Button>
                <Button variant="secondary" onClick={() => fileInput.current?.click()}>
                  <Upload aria-hidden="true" className="size-4" /> Importer un JSON
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => void importData(event.target.files?.[0])}
                  className="sr-only"
                />
              </div>
              {storageUsage ? (
                <p className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                  <HardDrive aria-hidden="true" className="size-4" /> {storageUsage}
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        {getAnalyticsMode() !== "off" ? (
          <Card className="p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-[var(--blue-600)]">
                <BarChart3 aria-hidden="true" className="size-6" />
              </span>
              <div className="flex-1">
                <h2 className="text-xl font-black">Statistiques anonymes</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                  Désactivées par défaut. Si vous les activez, le jeu envoie des événements anonymes
                  (décisions prises, étapes de campagne, résultats) à un serveur privé pour
                  améliorer l’équilibrage du jeu — jamais votre nom, votre e-mail ni le texte des
                  événements. Voir{" "}
                  <a href="/confidentialite" className="underline">
                    la page Confidentialité
                  </a>{" "}
                  pour le détail. Ce choix n’a aucun effet sur votre accès au jeu.
                </p>
                {settings ? (
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant={settings.analyticsConsent === "granted" ? "primary" : "secondary"}
                      onClick={() => void updateConsent("granted")}
                    >
                      Activer les statistiques anonymes
                    </Button>
                    <Button
                      variant={settings.analyticsConsent === "denied" ? "primary" : "secondary"}
                      onClick={() => void updateConsent("denied")}
                    >
                      Garder désactivées
                    </Button>
                  </div>
                ) : null}
                <p className="mt-3 text-xs text-[var(--ink-muted)]">
                  État actuel :{" "}
                  {settings?.analyticsConsent === "granted"
                    ? "activées"
                    : settings?.analyticsConsent === "denied"
                      ? "désactivées"
                      : "pas encore choisi (rien n’est envoyé)"}
                  .
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="border-red-200 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-[var(--red-700)]">
              <Trash2 aria-hidden="true" className="size-6" />
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-black">Effacer les données locales</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                Supprime la partie active, les archives, les badges et les préférences de ce
                navigateur. Exportez d’abord si vous souhaitez conserver une copie.
              </p>
              <Button variant="danger" className="mt-5" onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden="true" className="size-4" /> Tout supprimer
              </Button>
            </div>
          </div>
        </Card>

        <Card className="bg-[var(--navy-950)] p-5 text-white sm:p-7">
          <ShieldCheck aria-hidden="true" className="size-7 text-[var(--gold-300)]" />
          <h2 className="mt-4 text-xl font-black">Simulation politique fictive</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">
            Les événements, dialogues, probabilités, classements et résultats de ce jeu sont
            fictifs. Ils ne constituent ni une prédiction électorale, ni une information officielle,
            ni un soutien à un parti ou à une personnalité. Les paramètres de gameplay ne sont pas
            des mesures objectives de valeur politique.
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <FileJson aria-hidden="true" className="size-4" /> Schéma de sauvegarde v1 · Application
            v0.1.0
          </p>
        </Card>
      </div>

      {status ? (
        <p
          role="status"
          className="mt-5 rounded-xl bg-blue-50 p-4 text-sm font-bold text-[var(--blue-700)]"
        >
          {status}
        </p>
      ) : null}

      <Dialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Tout supprimer ?"
        description="Cette action est définitive sur cet appareil."
      >
        <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
          Votre partie active, toutes les carrières archivées et tous les succès seront effacés. Un
          export JSON est le seul moyen de les restaurer ensuite.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={erase}>
            <Trash2 aria-hidden="true" className="size-4" /> Confirmer la suppression
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
