"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

/** Connexion admin (mot de passe unique). */
export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined,
  );

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-md bg-card p-8 nc-shadow-2"
      >
        <h1 className="nc-title mb-1 text-2xl">Admin</h1>
        <p className="mb-6 text-sm text-muted">Accès réservé.</p>

        <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          className="mb-4 w-full rounded-sm border border-line bg-raised px-4 py-3 text-ink outline-none transition-colors focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20"
        />

        {state?.error && <p className="mb-4 text-sm text-accent">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] transition-all hover:bg-[#d1504a] disabled:opacity-70"
        >
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
