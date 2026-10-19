import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from "@/lib/auth-validation";

export type IntelligenceApplicationDraft = {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  website: string;
  reason: string;
  modules: string[];
  consent: boolean;
  isAuthenticated: boolean;
  password: string;
  confirmPassword: string;
};

export type IntelligenceApplicationField =
  | "firstName"
  | "lastName"
  | "email"
  | "companyName"
  | "website"
  | "reason"
  | "modules"
  | "password"
  | "confirmPassword"
  | "consent";

export type IntelligenceApplicationErrors = Partial<
  Record<IntelligenceApplicationField, string>
>;

function validateWebsite(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Inserisci un indirizzo web che inizi con http:// o https://.";
    }
    return null;
  } catch {
    return "Inserisci un indirizzo web valido.";
  }
}

export function validateIntelligenceApplication(
  draft: IntelligenceApplicationDraft
): IntelligenceApplicationErrors {
  const errors: IntelligenceApplicationErrors = {};

  if (!draft.firstName.trim()) errors.firstName = "Inserisci il nome.";
  if (!draft.lastName.trim()) errors.lastName = "Inserisci il cognome.";

  const emailError = validateEmail(draft.email);
  if (emailError) errors.email = emailError;

  if (!draft.companyName.trim()) {
    errors.companyName = "Inserisci il nome dell'azienda.";
  }

  const websiteError = validateWebsite(draft.website);
  if (websiteError) errors.website = websiteError;

  if (draft.reason.trim().length < 20) {
    errors.reason =
      "Descrivi in almeno 20 caratteri come vorresti utilizzare ATLAS Intelligence.";
  }

  if (draft.modules.length === 0) {
    errors.modules = "Seleziona almeno un'area di interesse.";
  }

  if (!draft.consent) {
    errors.consent = "Il consenso al trattamento dei dati è obbligatorio.";
  }

  if (!draft.isAuthenticated) {
    const passwordError = validatePassword(draft.password);
    const confirmPasswordError = validateConfirmPassword(
      draft.password,
      draft.confirmPassword
    );
    if (passwordError) errors.password = passwordError;
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  }

  return errors;
}
