import { footer } from "@/lib/content";

/** Pied de page sobre. */
export default function Footer() {
  const year = 2026;
  return (
    <footer className="border-t border-line/60 bg-card/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row sm:px-8">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink">{footer.name}</span>
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-sm text-muted">{footer.tagline}</span>
        </div>
        <p className="text-sm text-muted">
          © {year} · {footer.domain}
        </p>
      </div>
    </footer>
  );
}
