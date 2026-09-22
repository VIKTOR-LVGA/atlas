"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { mapSupabaseAuthError } from "@/lib/auth-errors";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  validateEmail,
  validatePassword,
  validateFullName,
  validateConfirmPassword,
} from "@/lib/auth-validation";
import { cn } from "@/lib/utils";

/** Account type on public registration. Intelligence partners use a separate CTA. */
type RegistrationType = "consumer" | "broker";

export default function RegisterPage() {
  const router = useRouter();
  const [registrationType, setRegistrationType] =
    useState<RegistrationType>("consumer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fullNameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);

    if (fullNameError || emailError || passwordError || confirmError) {
      setFieldErrors({
        fullName: fullNameError ?? undefined,
        email: emailError ?? undefined,
        password: passwordError ?? undefined,
        confirmPassword: confirmError ?? undefined,
      });
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      // Keep legacy metadata value "partner" for older clients that still read it,
      // and also set "broker" so new login routing can prefer the broker intent.
      const isBroker = registrationType === "broker";
      const redirectPath = isBroker ? "/partner/apply" : "/dashboard";
      const { data, error: authError } = await getSupabaseBrowserClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
          data: {
            full_name: fullName.trim(),
            registration_intent: isBroker ? "broker" : "consumer",
          },
        },
      });

      if (authError) {
        setError(mapSupabaseAuthError(authError.message));
        return;
      }

      if (data.session) {
        router.push(redirectPath);
        router.refresh();
        return;
      }

      setSuccess(
        isBroker
          ? "Account creato. Conferma l'email per completare la candidatura broker."
          : "Account creato. Controlla la tua email per confermare l'account, poi accedi."
      );
    } catch {
      setError("Impossibile connettersi al servizio di autenticazione.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Crea account"
      subtitle="Scegli come vuoi utilizzare ATLAS."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthMessage variant="error" message={error} />
        <AuthMessage variant="success" message={success} />

        <fieldset>
          <legend className="text-[12px] font-semibold text-foreground">
            Tipo di account
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label
              className={cn(
                "cursor-pointer rounded-xl border p-3 transition",
                registrationType === "consumer"
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-card-muted/40 hover:border-accent/50"
              )}
            >
              <input
                type="radio"
                name="registration_type"
                value="consumer"
                checked={registrationType === "consumer"}
                onChange={() => setRegistrationType("consumer")}
                className="sr-only"
              />
              <span className="block text-[13px] font-semibold text-foreground">
                Privato
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-muted">
                Gestisci le tue assicurazioni con ATLAS.
              </span>
            </label>
            <label
              className={cn(
                "cursor-pointer rounded-xl border p-3 transition",
                registrationType === "broker"
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-card-muted/40 hover:border-accent/50"
              )}
            >
              <input
                type="radio"
                name="registration_type"
                value="broker"
                checked={registrationType === "broker"}
                onChange={() => setRegistrationType("broker")}
                className="sr-only"
              />
              <span className="block text-[13px] font-semibold text-foreground">
                Broker assicurativo
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-muted">
                Ricevi e gestisci le richieste di revisione assegnate da ATLAS.
              </span>
            </label>
          </div>
          {registrationType === "broker" ? (
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Dopo la creazione dell&apos;account potrai completare la candidatura
              professionale. Il Broker Workspace sarà disponibile dopo
              l&apos;approvazione di ATLAS.
            </p>
          ) : null}
        </fieldset>

        <AuthFormField
          id="fullName"
          label="Nome completo"
          value={fullName}
          onChange={setFullName}
          error={fieldErrors.fullName}
          placeholder="Marco Bianchi"
          autoComplete="name"
          disabled={loading}
        />

        <AuthFormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
          placeholder="nome@email.ch"
          autoComplete="email"
          disabled={loading}
        />

        <AuthFormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          placeholder="Minimo 8 caratteri"
          autoComplete="new-password"
          disabled={loading}
        />

        <AuthFormField
          id="confirmPassword"
          label="Conferma password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={fieldErrors.confirmPassword}
          placeholder="Ripeti la password"
          autoComplete="new-password"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "atlas-btn-primary w-full py-2.5 text-[14px]",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creazione account...
            </span>
          ) : registrationType === "broker" ? (
            "Crea account e continua"
          ) : (
            "Crea account"
          )}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-border bg-card-muted/30 px-4 py-3 text-center">
        <p className="text-[12px] text-muted">
          Rappresenti una compagnia assicurativa o un partner B2B?
        </p>
        <Link
          href="/intelligence"
          className="mt-1.5 inline-block text-[13px] font-medium text-accent hover:text-accent-hover"
        >
          Richiedi accesso ad ATLAS Intelligence
        </Link>
      </div>

      <p className="mt-5 text-center text-[12px] leading-relaxed text-muted">
        Creando un account accetti i{" "}
        <Link href="/terms" className="font-medium text-accent hover:text-accent-hover">
          termini di utilizzo
        </Link>{" "}
        e l&apos;
        <Link href="/privacy" className="font-medium text-accent hover:text-accent-hover">
          informativa privacy
        </Link>
        . Nessun dato viene condiviso con un consulente senza una tua richiesta.
      </p>

      <p className="mt-6 text-center text-[13px] text-muted">
        Hai già un account?{" "}
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Accedi
        </Link>
      </p>
    </AuthLayout>
  );
}
