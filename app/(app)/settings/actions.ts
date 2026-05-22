"use server";

import "server-only";

import { refresh, revalidatePath } from "next/cache";
import type {
  CurrentProfileUpdate,
  ProfileDateFormat,
  ProfileLanguage,
} from "@/lib/types";
import { ProfileUpdateError, updateCurrentProfile } from "@/lib/profiles";

const profileLanguages = ["it", "de", "fr", "en"] as const;
const profileDateFormats = ["DD/MM/YYYY", "YYYY-MM-DD"] as const;

export type ProfileSettingsActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: {
    fullName?: string;
    language?: string;
    currency?: string;
    dateFormat?: string;
  };
};

function getTextField(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function hasCheckboxValue(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function getProfileLanguage(formData: FormData): ProfileLanguage | null {
  const language = getTextField(formData, "language");

  return profileLanguages.includes(language as ProfileLanguage)
    ? (language as ProfileLanguage)
    : null;
}

function validateProfileSettings(formData: FormData) {
  const fullName = getTextField(formData, "full_name");
  const language = getProfileLanguage(formData);
  const currency = getTextField(formData, "currency");
  const dateFormat = getTextField(formData, "date_format");
  const fieldErrors: ProfileSettingsActionState["fieldErrors"] = {};

  if (!fullName) {
    fieldErrors.fullName = "Inserisci il nome completo.";
  }

  if (!language) {
    fieldErrors.language = "Scegli una lingua valida.";
  }

  if (currency !== "CHF") {
    fieldErrors.currency = "Atlas supporta CHF in questa fase.";
  }

  if (!profileDateFormats.includes(dateFormat as ProfileDateFormat)) {
    fieldErrors.dateFormat = "Scegli un formato data valido.";
  }

  if (!language || Object.keys(fieldErrors).length > 0) {
    return {
      input: null,
      fieldErrors,
    };
  }

  return {
    input: {
      fullName,
      phone: getTextField(formData, "phone") || null,
      language,
      currency: "CHF" as const,
      dateFormat: dateFormat as CurrentProfileUpdate["dateFormat"],
      notificationEmail: hasCheckboxValue(formData, "notification_email"),
      notificationPush: hasCheckboxValue(formData, "notification_push"),
      notificationSms: hasCheckboxValue(formData, "notification_sms"),
    },
    fieldErrors: undefined,
  };
}

export async function updateProfileSettingsAction(
  _previousState: ProfileSettingsActionState,
  formData: FormData
): Promise<ProfileSettingsActionState> {
  const { input, fieldErrors } = validateProfileSettings(formData);

  if (!input) {
    return {
      status: "error",
      message: "Controlla i campi evidenziati.",
      fieldErrors,
    };
  }

  try {
    await updateCurrentProfile(input);
    revalidatePath("/settings");
    refresh();

    return {
      status: "success",
      message: "Impostazioni salvate.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof ProfileUpdateError
          ? error.message
          : "Salvataggio non riuscito. Riprova tra poco.",
    };
  }
}
