import Link from "next/link";
import { IconLogo } from "@/components/icons";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <IconLogo className="h-7 w-7" />
              <span className="font-semibold text-slate-900">Atlas</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Piattaforma svizzera di intelligence assicurativa. Indipendente,
              trasparente, orientata al cliente.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 text-sm">
            <div>
              <p className="font-medium text-slate-900">Prodotto</p>
              <ul className="mt-3 space-y-2 text-slate-500">
                <li><Link href="/dashboard" className="hover:text-slate-700">Dashboard</Link></li>
                <li><Link href="/analysis" className="hover:text-slate-700">Analisi</Link></li>
                <li><Link href="/market" className="hover:text-slate-700">Mercato</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-slate-900">Supporto</p>
              <ul className="mt-3 space-y-2 text-slate-500">
                <li><Link href="/consulting" className="hover:text-slate-700">Consulenza</Link></li>
                <li><a href="#faq" className="hover:text-slate-700">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-slate-900">Legale</p>
              <ul className="mt-3 space-y-2 text-slate-500">
                <li><span>Privacy</span></li>
                <li><span>Termini</span></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 border-t border-slate-100 pt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Atlas · Svizzera · I dati sono trattati in conformità con la nLPD
        </p>
      </div>
    </footer>
  );
}
