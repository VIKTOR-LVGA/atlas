import Link from "next/link";
import { BarChart3, BriefcaseBusiness, LogOut, ShieldCheck, Users } from "lucide-react";
import { logout } from "@/app/(app)/actions";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";

type NavItem = { href: string; label: string; icon: "pipeline" | "clients" | "revenue" | "admin" };

const icons = {
  pipeline: BriefcaseBusiness,
  clients: Users,
  revenue: BarChart3,
  admin: ShieldCheck,
};

export function OperationsShell({
  children,
  title,
  subtitle,
  nav,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  nav: NavItem[];
}) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="border-b border-sidebar-border bg-sidebar px-5 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
        <AtlasBrandLogo compact href={nav[0]?.href ?? "/"} />
        <div className="mt-5 rounded-xl border border-border bg-card px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">{title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{subtitle}</p>
        </div>
        <nav className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1" aria-label={`${title} navigation`}>
          {nav.map((item) => {
            const Icon = icons[item.icon];
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent-soft hover:text-accent">
                <Icon className="h-4 w-4" />{item.label}
              </Link>
            );
          })}
        </nav>
        <form action={logout} className="mt-4 lg:absolute lg:bottom-6 lg:left-4 lg:right-4">
          <button className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px] text-muted hover:bg-card">
            <LogOut className="h-4 w-4" />Esci
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
