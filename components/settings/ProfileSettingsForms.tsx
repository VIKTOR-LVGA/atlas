"use client";

import { useActionState, useState } from "react";
import {
  updateProfileSettingsAction,
  type ProfileSettingsActionState,
} from "@/app/(app)/settings/actions";
import { getProfileDisplayName, getProfileInitials } from "@/lib/profile-display";
import type { CurrentProfile, ProfileLanguage } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

const initialState: ProfileSettingsActionState = {
  status: "idle",
  message: "",
};

const languageOptions: Array<{ label: string; value: ProfileLanguage }> = [
  { label: "Italiano", value: "it" },
  { label: "Deutsch", value: "de" },
  { label: "Français", value: "fr" },
  { label: "English", value: "en" },
];

function getSettingsProfile(profile: CurrentProfile | null) {
  return {
    fullName: profile?.fullName?.trim() ?? "",
    phone: profile?.phone ?? "",
    language: profile?.language ?? "it",
    currency: profile?.currency ?? "CHF",
    dateFormat: profile?.dateFormat ?? "DD/MM/YYYY",
    notificationEmail: profile?.notificationEmail ?? true,
    notificationPush: profile?.notificationPush ?? true,
    notificationSms: profile?.notificationSms ?? false,
  };
}

function SaveMessage({ state }: { state: ProfileSettingsActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={cn(
        "text-[12px]",
        state.status === "success" ? "text-emerald-700" : "text-red-600"
      )}
    >
      {state.message}
    </p>
  );
}

function FieldError({ children }: { children?: string }) {
  return children ? <p className="mt-1 text-[11px] text-red-600">{children}</p> : null;
}

function NotificationHiddenInputs({
  profile,
}: {
  profile: ReturnType<typeof getSettingsProfile>;
}) {
  return (
    <>
      <input type="hidden" name="notification_email" value={profile.notificationEmail ? "on" : ""} />
      <input type="hidden" name="notification_push" value={profile.notificationPush ? "on" : ""} />
      <input type="hidden" name="notification_sms" value={profile.notificationSms ? "on" : ""} />
    </>
  );
}

function ProfileHiddenInputs({
  profile,
}: {
  profile: ReturnType<typeof getSettingsProfile>;
}) {
  return (
    <>
      <input type="hidden" name="full_name" value={profile.fullName} />
      <input type="hidden" name="phone" value={profile.phone} />
      <input type="hidden" name="language" value={profile.language} />
      <input type="hidden" name="currency" value={profile.currency} />
      <input type="hidden" name="date_format" value={profile.dateFormat} />
    </>
  );
}

export function ProfileSettingsPanels({ profile }: { profile: CurrentProfile | null }) {
  const values = getSettingsProfile(profile);
  const [state, formAction, pending] = useActionState(
    updateProfileSettingsAction,
    initialState
  );
  const [language, setLanguage] = useState<ProfileLanguage>(values.language);
  const memberSince = profile?.createdAt
    ? `Membro dal ${formatDate(profile.createdAt)}`
    : "Profilo creato da Supabase Auth";

  return (
    <form
      action={formAction}
      onReset={() => setLanguage(values.language)}
      className="grid gap-4 lg:grid-cols-2"
    >
      <NotificationHiddenInputs profile={values} />
      <SectionCard title="Informazioni profilo">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-semibold text-white sm:mx-0">
              {getProfileInitials(profile)}
            </div>
            <p className="mt-3 text-[14px] font-semibold text-slate-900">
              {getProfileDisplayName(profile)}
            </p>
            <StatusBadge
              variant={profile?.hasProfileRow ? "ok" : "processing"}
              label={profile?.hasProfileRow ? "Account verificato" : "Profilo in attesa"}
              className="mt-1"
            />
            <p className="mt-1 text-[11px] text-slate-500">{memberSince}</p>
          </div>

          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="settings-full-name" className="text-[11px] font-medium text-slate-600">
                Nome completo
              </label>
              <input
                id="settings-full-name"
                name="full_name"
                type="text"
                required
                defaultValue={values.fullName}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <FieldError>{state.fieldErrors?.fullName}</FieldError>
            </div>
            <div>
              <label htmlFor="settings-email" className="text-[11px] font-medium text-slate-600">
                Email
              </label>
              <input
                id="settings-email"
                type="email"
                readOnly
                defaultValue={profile?.email ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="settings-phone" className="text-[11px] font-medium text-slate-600">
                Telefono
              </label>
              <input
                id="settings-phone"
                name="phone"
                type="tel"
                defaultValue={values.phone}
                placeholder="+41 ..."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Lingua e regione">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-language" className="text-[11px] font-medium text-slate-600">
              Lingua
            </label>
            <select
              id="settings-language"
              name="language"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as ProfileLanguage)
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError>{state.fieldErrors?.language}</FieldError>
          </div>
          <div>
            <label htmlFor="settings-currency" className="text-[11px] font-medium text-slate-600">
              Valuta
            </label>
            <select
              id="settings-currency"
              name="currency"
              defaultValue={values.currency}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="CHF">CHF</option>
            </select>
            <FieldError>{state.fieldErrors?.currency}</FieldError>
          </div>
          <div>
            <label htmlFor="settings-date-format" className="text-[11px] font-medium text-slate-600">
              Formato data
            </label>
            <select
              id="settings-date-format"
              name="date_format"
              defaultValue={values.dateFormat}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
            <FieldError>{state.fieldErrors?.dateFormat}</FieldError>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <SaveMessage state={state} />
          <div className="flex justify-end gap-2">
            <button type="reset" className="rounded-lg px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-50">
              Annulla
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700 disabled:cursor-wait disabled:bg-blue-300"
            >
              {pending ? "Salvataggio..." : "Salva modifiche"}
            </button>
          </div>
        </div>
      </SectionCard>
    </form>
  );
}

export function NotificationSettingsForm({
  profile,
}: {
  profile: CurrentProfile | null;
}) {
  const values = getSettingsProfile(profile);
  const [state, formAction, pending] = useActionState(
    updateProfileSettingsAction,
    initialState
  );
  const notificationChannels = [
    {
      name: "notification_email",
      label: "Email",
      description: "Aggiornamenti e scadenze nella casella del profilo.",
      checked: values.notificationEmail,
    },
    {
      name: "notification_push",
      label: "Push",
      description: "Avvisi rapidi nell'app quando saranno disponibili.",
      checked: values.notificationPush,
    },
    {
      name: "notification_sms",
      label: "SMS",
      description: "Messaggi al numero salvato nel profilo.",
      checked: values.notificationSms,
    },
  ];

  return (
    <SectionCard title="Preferenze notifiche">
      <form action={formAction}>
        <ProfileHiddenInputs profile={values} />
        <div className="divide-y divide-slate-50">
          {notificationChannels.map((channel) => (
            <label
              key={channel.name}
              className="flex cursor-pointer items-center justify-between gap-4 py-3 first:pt-0"
            >
              <span>
                <span className="block text-[13px] font-medium text-slate-900">
                  {channel.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  {channel.description}
                </span>
              </span>
              <input
                name={channel.name}
                type="checkbox"
                defaultChecked={channel.checked}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SaveMessage state={state} />
            <FieldError>{state.fieldErrors?.fullName}</FieldError>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700 disabled:cursor-wait disabled:bg-blue-300"
          >
            {pending ? "Salvataggio..." : "Salva notifiche"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
