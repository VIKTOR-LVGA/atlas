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

export default function RegisterPage() {
  const router = useRouter();
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
      // Public signup is consumer-only. Broker role cannot be self-selected.
      // Ignore any client-side attempts to pass role=broker / registration_intent=broker.
      const { data, error: authError } = await getSupabaseBrowserClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName.trim(),
            registration_intent: "consumer",
          },
        },
      });

      if (authError) {
        setError(mapSupabaseAuthError(authError.message));
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setSuccess(
        "Account creato. Controlla la tua email per confermare l'account, poi accedi."
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
      subtitle="Inizia a organizzare le tue assicurazioni con ATLAS."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthMessage variant="error" message={error} />
        <AuthMessage variant="success" message={success} />

        <AuthFormField
          id="fullName"
          label="Nome completo"
          type="text"
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
              Creazione in corso...
            </span>
          ) : (
            "Crea account"
          )}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-border bg-card/40 px-4 py-3 text-[12px] leading-relaxed text-muted">
        <p className="font-medium text-foreground">
          Rappresenti una compagnia assicurativa o un partner B2B?
        </p>
        <Link
          href="/intelligence/apply"
          className="mt-1 inline-block font-medium text-accent hover:text-accent-hover"
        >
          Richiedi accesso ad ATLAS Intelligence
        </Link>
      </div>

      <p className="mt-6 text-center text-[12px] leading-relaxed text-muted">
        Creando un account accetti i{" "}
        <Link href="/terms" className="text-accent hover:text-accent-hover">
          termini di utilizzo
        </Link>{" "}
        e l&apos;
        <Link href="/privacy" className="text-accent hover:text-accent-hover">
          informativa privacy
        </Link>
        . Nessun dato viene condiviso con un consulente senza una tua richiesta.
      </p>

      <p className="mt-4 text-center text-[13px] text-muted">
        Hai già un account?{" "}
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Accedi
        </Link>
      </p>
    </AuthLayout>
  );
}
