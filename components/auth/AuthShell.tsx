import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, LockKeyhole, Sparkles } from "lucide-react";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface AuthShellProps {children: React.ReactNode; title: string; subtitle: string;}
export function AuthShell({children,title,subtitle}:AuthShellProps){
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Torna alla home INSURA"><AtlasBrandLogo variant="stacked" compact/></Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground sm:inline-flex"><ArrowLeft className="h-4 w-4"/> Home</Link>
            <ThemeToggle/>
          </div>
        </div>
      </header>
      <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-[1180px] items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-20 lg:py-16">
        <section className="hidden lg:block" aria-label="I vantaggi di INSURA">
          <p className="atlas-premium-eyebrow">Le assicurazioni, finalmente chiare</p>
          <h2 className="mt-5 max-w-lg text-[clamp(2.75rem,4.8vw,4.3rem)] font-bold leading-[1.06] tracking-[-.06em]">
            Più chiarezza.<span className="block text-accent">Meno complicazioni.</span>
          </h2>
          <p className="mt-6 max-w-md text-[17px] leading-8 text-muted-foreground">
            Tutti i tuoi documenti, premi e scadenze in un unico posto. Con un assistente che ti aiuta a capirli.
          </p>
          <div className="mt-10 grid max-w-md gap-4">
            {[{Icon:FileText,label:"Documenti in ordine",detail:"Carica e ritrova le tue polizze."},
              {Icon:Sparkles,label:"Risposte comprensibili",detail:"Chiedi ad INSURA quello che non capisci."},
              {Icon:LockKeyhole,label:"Il controllo resta tuo",detail:"Sei tu a confermare i dati estratti."}
            ].map(({Icon,label,detail})=>(
              <div key={label} className="flex items-center gap-4">
                <span className="atlas-pill-icon shrink-0"><Icon className="h-5 w-5"/></span>
                <span><span className="block text-[14px] font-semibold">{label}</span><span className="block text-[12px] text-muted-foreground">{detail}</span></span>
              </div>
            ))}
          </div>
        </section>
        <section className="w-full max-w-[480px] justify-self-center rounded-[30px] border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-9 lg:p-10">
          <div className="mb-7">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-bold text-accent"><CheckCircle2 className="h-3.5 w-3.5"/> Il tuo spazio INSURA</span>
            <h1 className="text-[27px] font-bold tracking-[-.04em] sm:text-[32px]">{title}</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          <p className="mt-7 border-t border-border pt-5 text-center text-[11px] leading-relaxed text-muted">
            INSURA è in fase pilota. Controlla i dati estratti prima di utilizzarli.
          </p>
        </section>
      </main>
    </div>
  );
}
