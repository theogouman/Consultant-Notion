"use client";

import { useState } from "react";
import { createLinkAction, deleteLinkAction } from "@/app/admin/actions";
import type { BookingLink } from "../types";

function LinkRow({ link, baseUrl }: { link: BookingLink; baseUrl: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${baseUrl}/r/${link.code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* copie indisponible : l'URL reste sélectionnable à la main */
    }
  }

  return (
    <div className="rounded-sm border border-line bg-card px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">
              {link.first_name} {link.last_name}
            </span>
            {link.used_at ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[0.7rem] font-medium text-green-700">
                Utilisé
              </span>
            ) : (
              <span className="rounded-full bg-raised px-2 py-0.5 text-[0.7rem] text-muted">
                En attente
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                link.kind === "permanent"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-accent/15 text-accent"
              }`}
            >
              {link.kind === "permanent" ? "Permanent" : "Ponctuel"}
            </span>
          </div>
          <p className="text-sm text-muted">{link.email}</p>
          <p className="mt-1 break-all font-mono text-sm text-ink">{url}</p>
          {(link.acq_source || link.linkedin_url) && (
            <p className="mt-0.5 text-xs text-muted">
              {[
                link.acq_source ? `source : ${link.acq_source}` : null,
                link.linkedin_url ? `LinkedIn : ${link.linkedin_url}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
        <div className="flex flex-none items-center gap-2">
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copié" : "Copier le lien"}
            className="relative inline-grid h-7 w-[84px] place-items-center overflow-hidden rounded-sm border border-line bg-card text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            {/* Morph copie ↔ check : fondu + flou + léger glissement. */}
            <span
              className={`col-start-1 row-start-1 flex items-center gap-1.5 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                copied ? "-translate-y-1 opacity-0 blur-[2px]" : "translate-y-0 opacity-100 blur-0"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="8" y="8" width="13" height="13" rx="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Copier
            </span>
            <span
              className={`col-start-1 row-start-1 flex items-center gap-1.5 text-accent transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                copied ? "translate-y-0 opacity-100 blur-0" : "translate-y-1 opacity-0 blur-[2px]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              Copié
            </span>
          </button>
          <form action={deleteLinkAction}>
            <input type="hidden" name="link_id" value={link.id} />
            <button
              type="submit"
              className="rounded-sm border border-line bg-card px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
            >
              Supprimer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PlanningLinks({
  links,
  baseUrl,
}: {
  links: BookingLink[];
  baseUrl: string;
}) {
  const inputCls =
    "w-full rounded-sm border border-line bg-raised px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:bg-card";
  const labelCls = "mb-1 block text-xs font-medium text-muted";

  return (
    <section>
      <h2 className="nc-title mb-2 text-xl">Liens de planification</h2>
      <p className="mb-6 text-sm text-muted">
        Crée un lien personnalisé pour un prospect : son nom et son e-mail sont
        pré-remplis, les questions de qualification sont masquées. Il n'a qu'à
        choisir un créneau.
      </p>

      <form
        action={createLinkAction}
        className="mb-8 rounded-md bg-card p-6 nc-shadow-2"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="first_name">Prénom</label>
            <input id="first_name" name="first_name" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="last_name">Nom</label>
            <input id="last_name" name="last_name" required className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="acq_source">Source d'acquisition</label>
            <input
              id="acq_source"
              name="acq_source"
              placeholder="ex. LinkedIn — prospection"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="linkedin_url">URL LinkedIn</label>
            <input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              placeholder="https://www.linkedin.com/in/…"
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <span className={labelCls}>Type de lien</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex-1">
                <input type="radio" name="kind" value="one_time" defaultChecked className="peer sr-only" />
                <span className="block cursor-pointer rounded-sm border border-line bg-raised px-3 py-2.5 text-sm text-ink transition-colors hover:border-accent/50 peer-checked:border-accent peer-checked:bg-accent/5 peer-checked:text-accent">
                  <span className="font-medium">Ponctuel</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Un seul appel. En revenant, le prospect peut modifier son créneau.
                  </span>
                </span>
              </label>
              <label className="flex-1">
                <input type="radio" name="kind" value="permanent" className="peer sr-only" />
                <span className="block cursor-pointer rounded-sm border border-line bg-raised px-3 py-2.5 text-sm text-ink transition-colors hover:border-accent/50 peer-checked:border-accent peer-checked:bg-accent/5 peer-checked:text-accent">
                  <span className="font-medium">Permanent</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Réutilisable : chaque visite permet de planifier un appel.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl nc-btn-3d px-5 py-2.5 text-sm font-medium text-white transition-colors"
          >
            Créer le lien
          </button>
        </div>
      </form>

      {links.length === 0 ? (
        <p className="text-sm text-muted">Aucun lien pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {links.map((l) => (
            <LinkRow key={l.id} link={l} baseUrl={baseUrl} />
          ))}
        </div>
      )}
    </section>
  );
}
