import { FileText, Shield, Sparkles, Upload } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

export function DocumentsArchiveEmpty() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="atlas-card-primary overflow-hidden">
        <div className="border-b border-border-subtle bg-gradient-to-r from-accent-soft/50 via-card to-card px-5 py-5 sm:px-6">
          <p className="atlas-section-eyebrow text-accent">Archivio intelligence</p>
          <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-foreground">
            Trasforma i PDF in dati assicurativi strutturati
          </h2>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted">
            Carica una polizza PDF: Atlas la analizza, estrae persone e coperture, e crea
            una bozza da revisionare — senza inserimento manuale da zero.
          </p>
        </div>
        <ol className="grid gap-px bg-border-subtle sm:grid-cols-3">
          {[
            {
              icon: <Upload className="h-4 w-4" />,
              title: "1. Carica PDF",
              detail: "Archivio privato nel tuo account",
            },
            {
              icon: <Sparkles className="h-4 w-4" />,
              title: "2. Analisi AI",
              detail: "Estrazione campi e coperture",
            },
            {
              icon: <FileText className="h-4 w-4" />,
              title: "3. Bozza polizza",
              detail: "Revisione e conferma guidata",
            },
          ].map((step) => (
            <li key={step.title} className="bg-card px-4 py-3.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                {step.icon}
              </span>
              <p className="mt-2 text-[12px] font-semibold text-foreground">{step.title}</p>
              <p className="mt-0.5 text-[11px] text-muted">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>

      <SectionCard tone="support" padding="sm">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              I tuoi documenti restano privati
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Nessun dato inventato: Atlas mostra solo ciò che estrae realmente dal PDF.
              Usa il pannello di caricamento a destra per iniziare.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
