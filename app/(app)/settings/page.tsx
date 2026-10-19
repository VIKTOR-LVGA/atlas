"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Palette, Shield } from "lucide-react";
import { HouseholdContextCards } from "@/components/consumer/HouseholdContextCards";

import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { useCurrentProfile } from "@/components/profile/ProfileProvider";
import {
  NotificationSettingsForm,
  ProfileSettingsPanels,
} from "@/components/settings/ProfileSettingsForms";

import { SettingsLockedModulesGrid } from "@/components/settings/SettingsLockedModulesGrid";
import { SettingsAccountManagement } from "@/components/settings/SettingsAccountManagement";
import { SettingsDataControl } from "@/components/settings/SettingsDataControl";
import { SettingsDataExport } from "@/components/settings/SettingsDataExport";
import { SettingsSavedCorrections } from "@/components/settings/SettingsSavedCorrections";
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

function isSettingsSectionId(value: string | null): value is SettingsSectionId {
  return sections.some((section) => section.id === value);
}

function SettingsPageContent({
  initialSection,
}: {
  initialSection: SettingsSectionId;
}) {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(initialSection);
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
        <header className="atlas-consumer-hero rounded-[27px] p-6 sm:p-8">
          <p className="atlas-premium-eyebrow">Il tuo spazio</p>
          <h1 className="atlas-premium-title mt-2">Profilo e impostazioni</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">I tuoi dati, le notifiche e il controllo del tuo account.</p>
        </header>

        <div className={`${atlasCard.support} px-4 py-3 text-[12px] leading-relaxed text-muted`}>
          Esportazione e controllo dati sono attivi in Avanzate. Billing, sessioni e
          integrazioni restano in preparazione. I dati mostrati provengono solo dal tuo account.
        </div>

        

        <SettingsTrustCenter profile={profile} />

        <div className={cn(atlasMainAside, "min-w-0 max-w-full")}>
          <nav
            className={cn(
              atlasAsideColumn,
              "flex flex-row gap-1.5 overflow-x-auto rounded-[22px] border border-border bg-card p-2 lg:flex-col lg:overflow-visible"
            )}
            aria-label="Sezioni impostazioni"
          >
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "shrink-0 min-h-11 rounded-[13px] px-4 py-3 text-left text-[13px] font-semibold transition lg:w-full",
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
              <>
                <ProfileSettingsPanels profile={profile} />
                <HouseholdContextCards
                  ownerName={profile?.fullName?.trim() || profile?.email || "Tu"}
                />
              </>
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
                <SettingsSavedCorrections />
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

function SettingsPageWithSection() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const initialSection = isSettingsSectionId(sectionParam) ? sectionParam : "profilo";

  return <SettingsPageContent key={initialSection} initialSection={initialSection} />;
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-card-muted" />
            <div className="h-24 animate-pulse rounded-xl bg-card-muted" />
          </div>
        </PageShell>
      }
    >
      <SettingsPageWithSection />
    </Suspense>
  );
}
