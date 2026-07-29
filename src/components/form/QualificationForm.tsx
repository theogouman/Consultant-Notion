"use client";

import { useState } from "react";
import { BOOKING_URL } from "@/lib/content";

/**
 * Formulaire de qualification (§9).
 * Champs dans l'ordre : Nom complet, Mail, Activité, situation (select),
 * motivation (texte long).
 *
 * Comportement : formulaire neutre (aucune disqualification active). À la
 * soumission valide → redirection vers NEXT_PUBLIC_BOOKING_URL.
 * Aucune donnée sensible en query string (les champs ne sont pas transmis
 * via l'URL). Validation + états focus/erreur (bordure focus corail).
 */

type Errors = Partial<Record<"name" | "email" | "activity" | "motivation", string>>;

const fieldBase =
  "w-full rounded-sm border bg-raised px-4 py-3 text-[1rem] text-ink placeholder:text-muted/60 outline-none transition-colors duration-[200ms] focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20";

export default function QualificationForm() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    activity: "",
    situation: "",
    motivation: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field as keyof Errors]) {
      setErrors((e) => ({ ...e, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const next: Errors = {};
    if (!values.name.trim()) next.name = "Indiquez votre nom.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = "Adresse e-mail invalide.";
    if (!values.activity.trim()) next.activity = "Indiquez votre activité.";
    if (!values.motivation.trim())
      next.motivation = "Dites-nous en quelques mots ce qui vous motive.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Redirection vers la prise de rendez-vous. Les réponses ne transitent
    // pas par l'URL (pas de données sensibles en query string).
    // TODO: brancher l'envoi des réponses à un CRM / webhook côté serveur
    // si une capture est souhaitée (Route Handler + variable d'env dédiée).
    window.location.href = BOOKING_URL;
  }

  const errorId = (f: string) => `${f}-error`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 text-left">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
          Nom complet
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Théo Gouman"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? errorId("name") : undefined}
          className={`${fieldBase} ${errors.name ? "border-accent" : "border-line"}`}
        />
        {errors.name && (
          <p id={errorId("name")} className="mt-1.5 text-sm text-accent">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="theo@gouman.fr"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? errorId("email") : undefined}
          className={`${fieldBase} ${errors.email ? "border-accent" : "border-line"}`}
        />
        {errors.email && (
          <p id={errorId("email")} className="mt-1.5 text-sm text-accent">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="activity" className="mb-1.5 block text-sm font-medium text-ink">
          Activité
        </label>
        <input
          id="activity"
          name="activity"
          type="text"
          placeholder="Agence de communication, cabinet comptable, société immobilière…"
          value={values.activity}
          onChange={(e) => update("activity", e.target.value)}
          aria-invalid={!!errors.activity}
          aria-describedby={errors.activity ? errorId("activity") : undefined}
          className={`${fieldBase} ${errors.activity ? "border-accent" : "border-line"}`}
        />
        {errors.activity && (
          <p id={errorId("activity")} className="mt-1.5 text-sm text-accent">
            {errors.activity}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="situation" className="mb-1.5 block text-sm font-medium text-ink">
          Qu’est-ce qui définit le mieux votre situation ?
        </label>
        <select
          id="situation"
          name="situation"
          value={values.situation}
          onChange={(e) => update("situation", e.target.value)}
          className={`${fieldBase} appearance-none border-line`}
        >
          <option value="">Sélectionnez…</option>
          <option value="notion-mal">On utilise déjà Notion, mais mal</option>
          <option value="pas-outil">On n’a pas d’outil d’organisation</option>
        </select>
      </div>

      <div>
        <label htmlFor="motivation" className="mb-1.5 block text-sm font-medium text-ink">
          Qu’est-ce qui vous motive à réserver cet appel ?
        </label>
        <textarea
          id="motivation"
          name="motivation"
          rows={4}
          placeholder="Décrivez en quelques mots votre situation et ce que vous aimeriez améliorer."
          value={values.motivation}
          onChange={(e) => update("motivation", e.target.value)}
          aria-invalid={!!errors.motivation}
          aria-describedby={errors.motivation ? errorId("motivation") : undefined}
          className={`${fieldBase} resize-y ${errors.motivation ? "border-accent" : "border-line"}`}
        />
        {errors.motivation && (
          <p id={errorId("motivation")} className="mt-1.5 text-sm text-accent">
            {errors.motivation}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-base font-medium text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#d1504a] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Redirection…" : "Réserver mon appel"}
        {!submitting && <span aria-hidden>→</span>}
      </button>
      <p className="text-center text-sm text-muted">
        20 minutes, gratuit, sans engagement.
      </p>
    </form>
  );
}
