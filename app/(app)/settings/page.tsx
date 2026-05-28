"use client";

import { useCallback, useRef, useState } from "react";
import { Palette, Shield } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { useCurrentProfile } from "@/components/profile/ProfileProvider";
import {
  NotificationSettingsForm,
  ProfileSettingsPanels,
} from "@/components/settings/ProfileSettingsForms";
import { SettingsCapabilitiesStrip } from "@/components/settings/SettingsCapabilitiesStrip";
import { SettingsLockedModulesGrid } from "@/components/settings/SettingsLockedModulesGrid";
import { SettingsAccountManagement } from "@/components/settings/SettingsAccountManagement";
import { SettingsDataControl } from "@/components/settings/SettingsDataControl";
import { SettingsDataExport } from "@/components/settings/SettingsDataExport";
import { SettingsTrustCenter } from "@/components/settings/SettingsTrustCenter";
import { RevealStagger } from "@/components/motion/RevealStagger";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { settingsLockedModules } from "@/lib/settings-display";
import {
  atlasAsideColumn,
  atlasCard,
  atlasMainAside,
  atlasMainColumn,
  atlasSpace,
} from "@/lib/atlas-ui";
import { cn } from "@/lib/utils";

const sections = [
  { id: "profilo", label: "Profilo" },
  { id: "notifiche", label: "Notifiche" },
  { id: "preferenze", label: "Aspetto" },
  { id: "avanzate", label: "Avanzate" },
  { id: "account", label: "Gestione account" },
] as const;

type SettingsSectionId = (typeof sections)[number]["id"];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("profilo");
  const profile = useCurrentProfile();
  const exportSectionRef = useRef<HTMLDivElement>(null);

  const scrollToExport = useCallback(() => {
    setActiveSection("avanzate");
    requestAnimationFrame(() => {
      exportSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <PageShell>
      <RevealStagger>
        <PageHeader
          title="Account e impostazioni"
          description="Gestisci profilo, preferenze e dati del tuo portafoglio assicurativo."
        />

        <div className={`${atlasCard.support} px-4 py-3 text-[12px] leading-relaxed text-muted`}>
          Esportazione e controllo dati sono attivi in Avanzate. Billing, sessioni e
          integrazioni restano in preparazione. I dati mostrati provengono solo dal tuo account.
        </div>

        <SettingsCapabilitiesStrip />

        <SettingsTrustCenter profile={profile} />

        <div className={cn(atlasMainAside, "min-w-0 max-w-full")}>
          <nav
            className={cn(
              atlasAsideColumn,
              "flex flex-row gap-1 overflow-x-auto border-b border-border pb-0 lg:flex-col lg:overflow-visible lg:border-b-0 lg:pb-0"
            )}
            aria-label="Sezioni impostazioni"
          >
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition lg:w-full",
                  activeSection === section.id
                    ? "bg-accent-soft text-accent"
                    : "text-muted-foreground hover:bg-card-muted hover:text-foreground"
                )}
              >
                {section.label}
              </button>
            ))}
          </nav>

          <div className={cn(atlasMainColumn, atlasSpace.block)}>
            {activeSection === "profilo" && (
              <ProfileSettingsPanels profile={profile} />
            )}

            {activeSection === "notifiche" && (
              <NotificationSettingsForm profile={profile} />
            )}

            {activeSection === "preferenze" && (
              <SectionCard title="Aspetto" description="Preferenza locale su questo dispositivo">
                <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-card-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                      <Palette className="h-4 w-4 text-accent" />
                      Tema Giorno / Notte
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      La scelta non passa dal profilo cloud: resta salvata nel browser per
                      coerenza visiva immediata.
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </SectionCard>
            )}

            {activeSection === "avanzate" && (
              <div className={cn(atlasSpace.block)}>
                <SettingsDataControl
                  onGoToAccount={() => setActiveSection("account")}
                  onGoToExport={scrollToExport}
                />
                <div ref={exportSectionRef} id="settings-data-export">
                  <SettingsDataExport />
                </div>
                <SettingsLockedModulesGrid modules={settingsLockedModules} />
              </div>
            )}

            {activeSection === "account" && (
              <SettingsAccountManagement profile={profile} />
            )}
          </div>
        </div>

        <div
          className={`${atlasCard.secondary} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
        >
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Per esportare i dati apri{" "}
              <button
                type="button"
                onClick={() => setActiveSection("avanzate")}
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                Avanzate
              </button>
              . Per eliminare portfolio o richiedere chiusura profilo apri{" "}
              <button
                type="button"
                onClick={() => setActiveSection("account")}
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                Gestione account
              </button>
              .
            </p>
          </div>
        </div>
      </RevealStagger>
    </PageShell>
  );
}
