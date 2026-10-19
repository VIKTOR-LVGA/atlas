"use client";

import Link from "next/link";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const links = [
  { href: "/#how-it-works", label: "Come funziona" },
  { href: "/#security", label: "Sicurezza" },
  { href: "/#faq", label: "FAQ" },
];

export function LandingNav() {
  return (
    <header className="landing-nav sticky top-0 z-50 border-b backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-[76px] max-w-[1430px] items-center justify-between gap-3 px-5 sm:px-8 lg:h-[82px] lg:px-11">
        <Link href="/" className="flex min-w-0 items-center">
          <AtlasBrandLogo variant="landing" />
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-[var(--landing-muted)] md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-[var(--landing-text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle className="hidden !border-[var(--landing-border)] !bg-[var(--landing-surface)] !text-[var(--landing-muted)] hover:!text-[var(--landing-text)] sm:inline-flex" />
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--landing-muted)] transition hover:text-[var(--landing-text)] min-[360px]:inline-flex sm:px-4"
          >
            Accedi
          </Link>
          <Link href="/register" className="landing-btn-primary whitespace-nowrap !px-4 !py-2.5 text-[12px] !font-bold sm:!px-5 sm:text-[13px]">
            Inizia gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
