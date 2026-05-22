"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { waitForRecoverySession } from "@/lib/auth-recovery";
import { validatePassword, validateConfirmPassword } from "@/lib/auth-validation";
import { cn } from "@/lib/utils";

type PageStatus = "loading" | "ready" | "invalid" | "submitting" | "success";

const INVALID_LINK_MESSAGE =
  "Link di recupero non valido o scaduto. Richiedi un nuovo reset password.";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initRecoverySession() {
      const result = await waitForRecoverySession();
      if (cancelled) return;

      if (result.success) {
        setPageStatus("ready");
        setError("");
      } else {
        setPageStatus("invalid");
        setError(result.error ?? INVALID_LINK_MESSAGE);
      }
    }

    initRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);

    if (passwordError || confirmError) {
      setFieldErrors({
        password: passwordError ?? undefined,
        confirmPassword: confirmError ?? undefined,
      });
      return;
    }

    setFieldErrors({});
    setPageStatus("submitting");

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setPageStatus("invalid");
        setError(INVALID_LINK_MESSAGE);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setPageStatus("ready");
        setError(updateError.message);
        return;
      }

      setPageStatus("success");
      setSuccess("Password aggiornata con successo. Reindirizzamento alla dashboard...");

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch {
      setPageStatus("ready");
      setError("Impossibile aggiornare la password. Riprova.");
    }
  }

  if (pageStatus === "loading") {
    return (
      <AuthLayout
        title="Nuova password"
        subtitle="Verifica del link di recupero in corso..."
      >
        <div className="flex flex-col items-center justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-[13px] text-slate-500">Caricamento...</p>
        </div>
      </AuthLayout>
    );
  }

  if (pageStatus === "invalid") {
    return (
      <AuthLayout
        title="Link non valido"
        subtitle="Il link di recupero password non è valido o è scaduto."
      >
        <AuthMessage variant="error" message={error || INVALID_LINK_MESSAGE} />
        <div className="mt-6 space-y-3 text-center">
          <Link
            href="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-blue-700"
          >
            Richiedi nuovo link
          </Link>
          <p className="text-[13px] text-slate-600">
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Torna al login
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (pageStatus === "success") {
    return (
      <AuthLayout
        title="Password aggiornata"
        subtitle="La tua password è stata reimpostata correttamente."
      >
        <AuthMessage variant="success" message={success} />
        <div className="mt-6 flex justify-center py-4">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        </div>
      </AuthLayout>
    );
  }

  const isSubmitting = pageStatus === "submitting";

  return (
    <AuthLayout
      title="Nuova password"
      subtitle="Scegli una nuova password per il tuo account Atlas."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthMessage variant="error" message={error} />

        <AuthFormField
          id="password"
          label="Nuova password"
          type="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          placeholder="Minimo 8 caratteri"
          autoComplete="new-password"
          disabled={isSubmitting}
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
          disabled={isSubmitting}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-[14px] font-medium text-white shadow-sm transition",
            "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Aggiornamento...
            </span>
          ) : (
            "Imposta nuova password"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-slate-600">
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          ← Torna al login
        </Link>
      </p>
    </AuthLayout>
  );
}
