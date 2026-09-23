"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { mapSupabaseAuthError } from "@/lib/auth-errors";
import { getSafeAuthRedirect } from "@/lib/auth-redirect";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { validateEmail, validatePassword } from "@/lib/auth-validation";
import { cn } from "@/lib/utils";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function resolveIntelligenceDestination(
    supabase: ReturnType<typeof getSupabaseBrowserClient>
  ) {
    const { data: hasAccess } = await supabase.rpc("has_atlas_intelligence");
    if (hasAccess) return "/intelligence/dashboard";

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "/intelligence/apply";

    const { data: application } = await supabase
      .from("intelligence_applications")
      .select("id, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (application) return "/intelligence/apply/status";
    return "/intelligence/apply";
  }

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
      const supabase = getSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(mapSupabaseAuthError(authError.message, "login"));
        return;
      }

      const next = searchParams.get("next");
      const metaIntent = data.user?.user_metadata?.registration_intent;

      const { data: roleValue } = await supabase.rpc("current_user_role");
      if (roleValue === "broker") {
        router.push("/broker-unavailable");
        router.refresh();
        return;
      }

      if (next) {
        router.push(getSafeAuthRedirect(next));
      } else if (intent === "intelligence" || metaIntent === "intelligence") {
        router.push(await resolveIntelligenceDestination(supabase));
      } else {
        router.push("/dashboard");
      }
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
      subtitle={
        intent === "intelligence"
          ? "Accedi al tuo account ATLAS Intelligence (solo se già approvato o in candidatura)."
          : "Bentornato su Atlas. Inserisci le tue credenziali."
      }
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
          href={intent === "intelligence" ? "/intelligence/apply" : "/register"}
          className="font-medium text-accent hover:text-accent-hover"
        >
          {intent === "intelligence" ? "Richiedi accesso Intelligence" : "Registrati"}
        </Link>
      </p>
    </AuthLayout>
  );
}
