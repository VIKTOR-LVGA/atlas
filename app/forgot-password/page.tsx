"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { validateEmail } from "@/lib/auth-validation";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }

    setFieldError(undefined);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(
        "Ti abbiamo inviato un'email con il link per reimpostare la password. Controlla anche la cartella spam."
      );
    } catch {
      setError("Impossibile inviare l'email di recupero. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Password dimenticata"
      subtitle="Inserisci la tua email e ti invieremo un link per reimpostare la password."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthMessage variant="error" message={error} />
        <AuthMessage variant="success" message={success} />

        <AuthFormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={fieldError}
          placeholder="nome@email.ch"
          autoComplete="email"
          disabled={loading || !!success}
        />

        <button
          type="submit"
          disabled={loading || !!success}
          className={cn(
            "atlas-btn-primary w-full py-2.5 text-[14px]",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Invio in corso...
            </span>
          ) : (
            "Invia link di recupero"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          ← Torna al login
        </Link>
      </p>
    </AuthLayout>
  );
}
