import Link from "next/link";
import { IconLogo } from "@/components/icons";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#050810]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <IconLogo className="h-7 w-7" />
              <span className="font-semibold text-white">Atlas</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              L&apos;AI che capisce le polizze assicurative svizzere. Indipendente,
              trasparente, orientata alla chiarezza.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-600">
              <span aria-hidden>🇨🇭</span>
              Ospitato in Svizzera · nLPD
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Prodotto
              </p>
              <ul className="mt-4 space-y-2.5 text-slate-600">
                <li>
                  <Link href="/register" className="transition hover:text-slate-300">
                    Inizia gratis
                  </Link>
                </li>
                <li>
                  <a href="#product" className="transition hover:text-slate-300">
                    Funzionalità
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="transition hover:text-slate-300">
                    Come funziona
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Account
              </p>
              <ul className="mt-4 space-y-2.5 text-slate-600">
                <li>
                  <Link href="/login" className="transition hover:text-slate-300">
                    Accedi
                  </Link>
                </li>
                <li>
                  <a href="#security" className="transition hover:text-slate-300">
                    Sicurezza
                  </a>
                </li>
                <li>
                  <a href="#faq" className="transition hover:text-slate-300">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Legale
              </p>
              <ul className="mt-4 space-y-2.5 text-slate-600">
                <li>Privacy</li>
                <li>Termini</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Atlas · Svizzera
          </p>
          <p className="text-xs text-slate-700">
            Dati trattati in conformità con la nLPD
          </p>
        </div>
      </div>
    </footer>
  );
}
