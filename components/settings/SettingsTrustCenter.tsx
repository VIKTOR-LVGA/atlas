import { FileText, KeyRound, Mail, Shield } from "lucide-react";
import { getProfileDisplayName } from "@/lib/profile-display";
import type { CurrentProfile } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionCard } from "@/components/ui/SectionCard";

type SettingsTrustCenterProps = {
  profile: CurrentProfile | null;
};

export function SettingsTrustCenter({ profile }: SettingsTrustCenterProps) {
  const email = profile?.email?.trim() || "Non disponibile";
  const accountLabel = profile?.hasProfileRow ? "Profilo attivo" : "Profilo in creazione";
  const accountVariant = profile?.hasProfileRow ? "ok" : "processing";

  return (
    <SectionCard
      title="Centro fiducia account"
      description="Informazioni sul tuo accesso e sul profilo Atlas"
      tone="primary"
      padding="sm"
      bodyClassName="space-y-3"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border-subtle bg-card-muted/40 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            <Mail className="h-3.5 w-3.5" />
            Email account
          </p>
          <p className="mt-1 truncate text-[13px] font-semibold text-foreground">{email}</p>
          <p className="mt-0.5 text-[10px] text-muted">Gestita dal login · non modificabile qui</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-card-muted/40 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            <Shield className="h-3.5 w-3.5" />
            Stato account
          </p>
          <div className="mt-1">
            <StatusBadge variant={accountVariant} label={accountLabel} />
          </div>
          <p className="mt-1 text-[10px] text-muted">
            {getProfileDisplayName(profile)}
            {profile?.updatedAt
              ? ` · aggiornato ${formatDateTime(profile.updatedAt)}`
              : ""}
          </p>
        </div>
      </div>

      <ul className="space-y-2 text-[12px]">
        <li className="flex items-start gap-2.5 rounded-lg border border-border-subtle bg-card-muted/30 px-3 py-2.5">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>
            <span className="font-semibold text-foreground">Dati assicurativi sensibili</span>
            <span className="mt-0.5 block leading-relaxed text-muted">
              Polizze e PDF restano collegati al tuo account. Atlas non mostra contenuti di altri
              utenti.
            </span>
          </span>
        </li>
        <li className="flex items-start gap-2.5 rounded-lg border border-border-subtle bg-card-muted/30 px-3 py-2.5">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>
            <span className="font-semibold text-foreground">Elaborazione lato server</span>
            <span className="mt-0.5 block leading-relaxed text-muted">
              L&apos;estrazione AI e le chiavi di servizio non sono esposte nel browser. Le
              impostazioni avanzate di sicurezza (2FA, sessioni) saranno disponibili più avanti.
            </span>
          </span>
        </li>
      </ul>

      <p className="rounded-lg border border-dashed border-border px-3 py-2 text-[11px] leading-relaxed text-muted">
        Atlas tratta le polizze come dati sensibili. Non vengono mostrate certificazioni o
        conformità non ancora implementate in questa versione.
      </p>
    </SectionCard>
  );
}
