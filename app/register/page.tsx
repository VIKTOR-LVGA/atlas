"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthMessage } from "@/components/auth/AuthMessage";
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
      const { data, error: authError } = await getSupabaseBrowserClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (authError) {
        setError(authError.message);
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
      subtitle="Inizia ad analizzare le tue assicurazioni con Atlas."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthMessage variant="error" message={error} />
        <AuthMessage variant="success" message={success} />

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
            "flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-[14px] font-medium text-white shadow-sm transition",
            "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creazione account...
            </span>
          ) : (
            "Crea account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-slate-600">
        Hai già un account?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Accedi
        </Link>
      </p>
    </AuthLayout>
  );
}
