import Link from "next/link";
import { IconLogo, IconShield } from "@/components/icons";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <IconLogo className="h-8 w-8" />
            <div>
              <span className="text-[15px] font-semibold text-slate-900">Atlas</span>
              <p className="text-[11px] text-slate-500">Analisi indipendente</p>
            </div>
          </Link>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="hidden flex-col justify-center lg:flex">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <IconShield className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
                Capisci davvero le tue assicurazioni.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                Piattaforma svizzera di intelligence assicurativa. Analizza polizze,
                individua criticità e ottimizza il tuo portafoglio in modo indipendente.
              </p>
              <ul className="mt-6 space-y-2 text-[13px] text-slate-700">
                {[
                  "Hosting e dati in Svizzera",
                  "Nessuna vendita di polizze",
                  "Analisi trasparente e indipendente",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="w-full">
            <div className="mb-6 lg:hidden">
              <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 hidden lg:block">
                <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
                  {title}
                </h1>
                <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
