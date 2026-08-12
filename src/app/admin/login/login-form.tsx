"use client";

import { useActionState } from "react";

import { loginAction, type AdminLoginState } from "../admin-actions";

const initialState: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mx-auto mt-16 max-w-sm space-y-4 px-4">
      <h1 className="text-2xl font-black">Administration — Analytics</h1>
      <p className="text-sm text-[var(--ink-muted)]">
        Espace privé, non lié à votre partie. Réservé au pilotage du jeu.
      </p>
      <label className="block text-sm font-bold" htmlFor="password">
        Mot de passe admin
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm"
      />
      {state.error ? (
        <p role="alert" className="text-sm font-bold text-[var(--red-700)]">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--blue-600)] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
