"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { validateEmail, validatePassword } from "@/lib/auth-validation";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setFieldErrors({ email: emailError ?? undefined, password: passwordError ?? undefined });
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.signInWithPassword(
        {
          email: email.trim(),
          password,
        }
      );

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Email o password non corretti."
            : authError.message
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Impossibile connettersi al servizio di autenticazione.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Accedi"
      subtitle="Bentornato su Atlas. Inserisci le tue credenziali."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthMessage variant="error" message={error} />

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

        <div>
          <AuthFormField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
          />
          <div className="mt-1.5 text-right">
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium text-accent hover:text-accent-hover"
            >
              Password dimenticata?
            </Link>
          </div>
        </div>

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
              Accesso in corso...
            </span>
          ) : (
            "Accedi"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Non hai un account?{" "}
        <Link
          href="/register"
          className="font-medium text-accent hover:text-accent-hover"
        >
          Registrati
        </Link>
      </p>
    </AuthLayout>
  );
}
