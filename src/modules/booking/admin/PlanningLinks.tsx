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
            className="rounded-sm border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            {copied ? "Copié ✓" : "Copier"}
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
        </div>
        <div className="mt-5">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#d1504a]"
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
