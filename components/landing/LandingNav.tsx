import Link from "next/link";
import { IconLogo } from "@/components/icons";

const links = [
  { href: "#product", label: "Prodotto" },
  { href: "#how-it-works", label: "Come funziona" },
  { href: "#security", label: "Sicurezza" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060a12]/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <IconLogo className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-tight text-white">Atlas</span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600 sm:inline">
            AI Insurance
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-500 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-slate-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-sm font-medium text-slate-400 transition hover:text-white sm:px-4"
          >
            Accedi
          </Link>
          <Link href="/register" className="landing-btn-primary !px-4 !py-2 text-sm">
            Inizia gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
