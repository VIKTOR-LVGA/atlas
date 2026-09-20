import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-[13px] font-semibold tracking-tight text-foreground">
            ATLAS
          </Link>
          <nav className="flex gap-4 text-[12px] text-muted">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Termini
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div
          role="note"
          className="mb-8 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-3 text-[12px] leading-relaxed text-[var(--warning-text)]"
        >
          <strong>Bozza interna.</strong> Questo testo descrive il funzionamento attuale del
          prodotto durante un pilot controllato. Non è ancora stato verificato da un legale e
          non costituisce l&apos;informativa definitiva.
        </div>
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-6 text-[11px] text-muted sm:px-6">
          © {new Date().getFullYear()} ATLAS · Svizzera
        </div>
      </footer>
    </div>
  );
}
