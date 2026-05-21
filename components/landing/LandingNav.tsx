import Link from "next/link";
import { IconLogo } from "@/components/icons";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <IconLogo className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Atlas
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <a href="#features" className="hover:text-slate-900">
            Funzionalità
          </a>
          <a href="#how-it-works" className="hover:text-slate-900">
            Come funziona
          </a>
          <a href="#faq" className="hover:text-slate-900">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Accedi alla dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
