"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { mapSupabaseAuthError } from "@/lib/auth-errors";
import {
  INTELLIGENCE_COMPANY_TYPES,
  INTELLIGENCE_MODULE_LABELS,
  INTELLIGENCE_MODULES,
  type IntelligenceModule,
} from "@/lib/intelligence/constants";
import {
  validateIntelligenceApplication,
  type IntelligenceApplicationErrors,
  type IntelligenceApplicationField,
} from "@/lib/intelligence/apply-validation";
import { SWISS_CANTON_CODES, CANTON_LABELS } from "@/lib/swiss-cantons";
import { cn } from "@/lib/utils";

type Prefill = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3 py-2.5 text-[13px] text-[var(--landing-text)] outline-none focus:border-[var(--landing-accent-bright)]";

function fieldClass(error?: string) {
  return cn(
    inputClass,
    error &&
      "border-[var(--danger-text)] focus:border-[var(--danger-text)] focus:ring-2 focus:ring-[var(--danger-border)]"
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[12px] text-[var(--danger-text)]">
      {message}
    </p>
  );
}

export function IntelligenceApplyForm({
  isAuthenticated,
  prefill,
}: {
  isAuthenticated: boolean;
  prefill?: Prefill;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(prefill?.firstName ?? "");
  const [lastName, setLastName] = useState(prefill?.lastName ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [legalEntity, setLegalEntity] = useState("");
  const [companyType, setCompanyType] = useState("insurer");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("CH");
  const [canton, setCanton] = useState("");
  const [modules, setModules] = useState<IntelligenceModule[]>([
    "market_overview",
    "switching",
    "premium_benchmark",
  ]);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] =
    useState<IntelligenceApplicationErrors>({});
  const [error, setError] = useState("");
  const [existingAccount, setExistingAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const loginHref = useMemo(() => {
    const next = encodeURIComponent("/intelligence/apply");
    return `/login?intent=intelligence&next=${next}`;
  }, []);

  function toggleModule(mod: IntelligenceModule) {
    setModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
    clearFieldError("modules");
  }

  function clearFieldError(field: IntelligenceApplicationField) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setExistingAccount(false);

    const validationErrors = validateIntelligenceApplication({
      firstName,
      lastName,
      email,
      companyName,
      website,
      reason,
      modules,
      consent,
      isAuthenticated,
      password,
      confirmPassword,
    });
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    try {
      let userId: string | null = null;

      if (isAuthenticated) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        userId = user?.id ?? null;
        if (!userId) {
          setExistingAccount(true);
          setError("Sessione scaduta. Accedi per completare la richiesta.");
          return;
        }
      } else {
        const { data: signedUp, error: signErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/intelligence/apply/status`,
            data: {
              full_name: `${firstName.trim()} ${lastName.trim()}`,
              registration_intent: "intelligence",
            },
          },
        });

        if (signErr) {
          const msg = signErr.message.toLowerCase();
          if (
            msg.includes("already") ||
            msg.includes("registered") ||
            msg.includes("exists")
          ) {
            setExistingAccount(true);
            setError(
              "Hai già un account ATLAS. Accedi per completare la richiesta Intelligence."
            );
            return;
          }
          setError(mapSupabaseAuthError(signErr.message));
          return;
        }

        userId = signedUp.user?.id ?? null;
        if (!userId) {
          setError(
            "Account creato. Conferma l'email se richiesto, poi accedi per completare la candidatura."
          );
          return;
        }
      }

      // Deduplicate: block second open application for same user
      const { data: openApps } = await supabase
        .from("intelligence_applications")
        .select("id, status")
        .eq("user_id", userId)
        .in("status", ["submitted", "under_review"])
        .limit(1);

      if (openApps && openApps.length > 0) {
        router.push("/intelligence/apply/status");
        router.refresh();
        return;
      }

      const { error: insertErr } = await supabase.from("intelligence_applications").insert({
        user_id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        work_email: email.trim().toLowerCase(),
        company_name: companyName.trim(),
        legal_entity: legalEntity.trim() || null,
        job_title: jobTitle.trim() || null,
        company_type: companyType,
        website: website.trim() || null,
        country: country || "CH",
        operating_canton: canton || null,
        market_scope: canton ? [canton] : ["CH"],
        access_reason: reason.trim(),
        desired_modules: modules,
        status: "submitted",
        consent_given_at: new Date().toISOString(),
      });

      if (insertErr) {
        if (insertErr.message.toLowerCase().includes("duplicate")) {
          router.push("/intelligence/apply/status");
          return;
        }
        setError(insertErr.message);
        return;
      }

      router.push("/intelligence/apply/status");
      router.refresh();
    } catch {
      setError("Impossibile inviare la candidatura. Riprova tra poco.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8" noValidate>
      {Object.keys(fieldErrors).length > 0 ? (
        <div
          ref={errorSummaryRef}
          role="alert"
          tabIndex={-1}
          className="atlas-alert-danger rounded-xl px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[var(--danger-border)]"
        >
          <p className="font-semibold">Controlla i campi evidenziati.</p>
          <p className="mt-1 text-[12px]">
            Sono presenti {Object.keys(fieldErrors).length} errori nella candidatura.
          </p>
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="atlas-alert-danger rounded-xl px-4 py-3 text-[13px]">
          <p>{error}</p>
          {existingAccount ? (
            <Link href={loginHref} className="mt-2 inline-block font-medium text-[var(--landing-accent-bright)]">
              Accedi per continuare
            </Link>
          ) : null}
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--landing-accent-bright)]">
          Dati personali
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-[12px] text-[var(--landing-muted)]">
            Nome
            <input
              className={fieldClass(fieldErrors.firstName)}
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearFieldError("firstName");
              }}
              aria-invalid={Boolean(fieldErrors.firstName)}
              aria-describedby={fieldErrors.firstName ? "first-name-error" : undefined}
              required
              disabled={loading}
            />
            <FieldError id="first-name-error" message={fieldErrors.firstName} />
          </label>
          <label className="block text-[12px] text-[var(--landing-muted)]">
            Cognome
            <input
              className={fieldClass(fieldErrors.lastName)}
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearFieldError("lastName");
              }}
              aria-invalid={Boolean(fieldErrors.lastName)}
              aria-describedby={fieldErrors.lastName ? "last-name-error" : undefined}
              required
              disabled={loading}
            />
            <FieldError id="last-name-error" message={fieldErrors.lastName} />
          </label>
        </div>
        <label className="block text-[12px] text-[var(--landing-muted)]">
          Email professionale
          <input
            type="email"
            className={fieldClass(fieldErrors.email)}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            required
            disabled={loading || (isAuthenticated && Boolean(prefill?.email))}
          />
          <FieldError id="email-error" message={fieldErrors.email} />
        </label>
        <label className="block text-[12px] text-[var(--landing-muted)]">
          Ruolo / funzione
          <input
            className={inputClass}
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Es. Head of Pricing"
            disabled={loading}
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--landing-accent-bright)]">
          Azienda
        </h2>
        <label className="block text-[12px] text-[var(--landing-muted)]">
          Nome azienda
          <input
            className={fieldClass(fieldErrors.companyName)}
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              clearFieldError("companyName");
            }}
            aria-invalid={Boolean(fieldErrors.companyName)}
            aria-describedby={fieldErrors.companyName ? "company-name-error" : undefined}
            required
            disabled={loading}
          />
          <FieldError id="company-name-error" message={fieldErrors.companyName} />
        </label>
        <label className="block text-[12px] text-[var(--landing-muted)]">
          Ragione sociale, se diversa
          <input
            className={inputClass}
            value={legalEntity}
            onChange={(e) => setLegalEntity(e.target.value)}
            disabled={loading}
          />
        </label>
        <label className="block text-[12px] text-[var(--landing-muted)]">
          Tipo organizzazione
          <select
            className={inputClass}
            value={companyType}
            onChange={(e) => setCompanyType(e.target.value)}
            disabled={loading}
          >
            {INTELLIGENCE_COMPANY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12px] text-[var(--landing-muted)]">
          Sito web
          <input
            className={fieldClass(fieldErrors.website)}
            value={website}
            onChange={(e) => {
              setWebsite(e.target.value);
              clearFieldError("website");
            }}
            aria-invalid={Boolean(fieldErrors.website)}
            aria-describedby={fieldErrors.website ? "website-error" : undefined}
            placeholder="https://"
            disabled={loading}
          />
          <FieldError id="website-error" message={fieldErrors.website} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-[12px] text-[var(--landing-muted)]">
            Paese
            <select
              className={inputClass}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={loading}
            >
              <option value="CH">Svizzera</option>
              <option value="LI">Liechtenstein</option>
              <option value="OTHER">Altro</option>
            </select>
          </label>
          <label className="block text-[12px] text-[var(--landing-muted)]">
            Cantone / area operativa
            <select
              className={inputClass}
              value={canton}
              onChange={(e) => setCanton(e.target.value)}
              disabled={loading}
            >
              <option value="">Seleziona</option>
              {SWISS_CANTON_CODES.map((code) => (
                <option key={code} value={code}>
                  {CANTON_LABELS[code]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--landing-accent-bright)]">
          Interesse
        </h2>
        <p className="text-[12px] text-[var(--landing-muted)]">
          Quali aree di ATLAS Intelligence ti interessano?
        </p>
        <div
          className="grid gap-2 sm:grid-cols-2"
          role="group"
          aria-describedby={fieldErrors.modules ? "modules-error" : undefined}
        >
          {INTELLIGENCE_MODULES.map((mod) => (
            <label
              key={mod}
              className="flex items-start gap-2 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3 py-2.5 text-[12px] text-[var(--landing-text)]"
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={modules.includes(mod)}
                onChange={() => toggleModule(mod)}
                aria-invalid={Boolean(fieldErrors.modules)}
                aria-describedby={fieldErrors.modules ? "modules-error" : undefined}
                disabled={loading}
              />
              {INTELLIGENCE_MODULE_LABELS[mod]}
            </label>
          ))}
        </div>
        <FieldError id="modules-error" message={fieldErrors.modules} />
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--landing-accent-bright)]">
          Motivazione
        </h2>
        <label className="block text-[12px] text-[var(--landing-muted)]">
          Come vorresti utilizzare ATLAS Intelligence?
          <textarea
            className={cn(fieldClass(fieldErrors.reason), "min-h-[110px]")}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              clearFieldError("reason");
            }}
            aria-invalid={Boolean(fieldErrors.reason)}
            aria-describedby={fieldErrors.reason ? "reason-error" : undefined}
            required
            disabled={loading}
          />
          <FieldError id="reason-error" message={fieldErrors.reason} />
        </label>
      </section>

      {!isAuthenticated ? (
        <section className="space-y-4 rounded-2xl border border-dashed border-[var(--landing-border)] p-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--landing-accent-bright)]">
            Crea account ATLAS
          </h2>
          <p className="text-[12px] text-[var(--landing-muted)]">
            L&apos;account non attiva Intelligence automaticamente. Serve approvazione ATLAS.
          </p>
          <label className="block text-[12px] text-[var(--landing-muted)]">
            Password
            <input
              type="password"
              className={fieldClass(fieldErrors.password)}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              autoComplete="new-password"
              disabled={loading}
            />
            <FieldError id="password-error" message={fieldErrors.password} />
          </label>
          <label className="block text-[12px] text-[var(--landing-muted)]">
            Conferma password
            <input
              type="password"
              className={fieldClass(fieldErrors.confirmPassword)}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError("confirmPassword");
              }}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={
                fieldErrors.confirmPassword ? "confirm-password-error" : undefined
              }
              autoComplete="new-password"
              disabled={loading}
            />
            <FieldError
              id="confirm-password-error"
              message={fieldErrors.confirmPassword}
            />
          </label>
          <p className="text-[11px] text-[var(--landing-muted)]">
            Hai già un account?{" "}
            <Link href={loginHref} className="font-medium text-[var(--landing-accent-bright)]">
              Accedi
            </Link>
          </p>
        </section>
      ) : null}

      <div>
        <label className="flex items-start gap-2 text-[12px] text-[var(--landing-muted)]">
          <input
            type="checkbox"
            className="mt-1"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              clearFieldError("consent");
            }}
            aria-invalid={Boolean(fieldErrors.consent)}
            aria-describedby={fieldErrors.consent ? "consent-error" : undefined}
            disabled={loading}
          />
          Acconsento al trattamento dei dati per la valutazione della candidatura
          Intelligence. Nessun accesso automatico ai dati consumer.
        </label>
        <FieldError id="consent-error" message={fieldErrors.consent} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="landing-btn-gradient disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Invio in corso…" : "Invia candidatura"}
      </button>
    </form>
  );
}
