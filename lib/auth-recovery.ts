import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const INVALID_LINK_MESSAGE =
  "Link di recupero non valido o scaduto. Richiedi un nuovo reset password.";

function getUrlParams(): { hash: URLSearchParams; search: URLSearchParams } {
  if (typeof window === "undefined") {
    return { hash: new URLSearchParams(), search: new URLSearchParams() };
  }
  return {
    hash: new URLSearchParams(window.location.hash.slice(1)),
    search: new URLSearchParams(window.location.search),
  };
}

function getRecoveryType(hash: URLSearchParams, search: URLSearchParams): string | null {
  return hash.get("type") ?? search.get("type");
}

/** Remove auth tokens from the URL after a successful exchange. */
export function cleanRecoveryUrl(): void {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, document.title, window.location.pathname);
}

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("expired") || lower.includes("invalid") || lower.includes("otp")) {
    return INVALID_LINK_MESSAGE;
  }
  return message;
}

/**
 * Establishes a recovery session from Supabase email link.
 * Supports PKCE (?code=), implicit hash (#access_token), and token_hash flows.
 */
export async function establishRecoverySession(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = getSupabaseBrowserClient();
  const { hash, search } = getUrlParams();

  const authError = search.get("error");
  const authErrorDescription = search.get("error_description");
  if (authError) {
    return {
      success: false,
      error: authErrorDescription
        ? decodeURIComponent(authErrorDescription.replace(/\+/g, " "))
        : INVALID_LINK_MESSAGE,
    };
  }

  const code = search.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { success: false, error: mapAuthError(error.message) };
    }
    cleanRecoveryUrl();
    return { success: true };
  }

  const type = getRecoveryType(hash, search);
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");

  if (accessToken && refreshToken && type === "recovery") {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      return { success: false, error: mapAuthError(error.message) };
    }
    cleanRecoveryUrl();
    return { success: true };
  }

  const tokenHash = search.get("token_hash");
  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (error) {
      return { success: false, error: mapAuthError(error.message) };
    }
    cleanRecoveryUrl();
    return { success: true };
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { success: false, error: mapAuthError(sessionError.message) };
  }

  if (session) {
    return { success: true };
  }

  const hasRecoveryParams =
    !!code ||
    !!tokenHash ||
    (type === "recovery" && !!accessToken) ||
    type === "recovery";

  if (!hasRecoveryParams) {
    return { success: false, error: INVALID_LINK_MESSAGE };
  }

  return { success: false, error: INVALID_LINK_MESSAGE };
}

/**
 * Waits for PASSWORD_RECOVERY (or session from URL parsing) before giving up.
 */
export function waitForRecoverySession(timeoutMs = 4000): Promise<{
  success: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    const supabase = getSupabaseBrowserClient();
    let settled = false;
    let unsubscribeAuth: () => void = () => {};

    const finish = (result: { success: boolean; error?: string }) => {
      if (settled) return;
      settled = true;
      unsubscribeAuth();
      clearTimeout(timer);
      resolve(result);
    };

    const { hash, search } = getUrlParams();
    const hasUrlTokens =
      !!search.get("code") ||
      !!search.get("token_hash") ||
      !!hash.get("access_token");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION")
      ) {
        cleanRecoveryUrl();
        finish({ success: true });
      }
    });
    unsubscribeAuth = () => subscription.unsubscribe();

    const timer = setTimeout(async () => {
      const result = await establishRecoverySession();
      if (result.success) {
        finish({ success: true });
        return;
      }
      finish({
        success: false,
        error: result.error ?? INVALID_LINK_MESSAGE,
      });
    }, timeoutMs);

    void establishRecoverySession().then((result) => {
      if (result.success) {
        finish({ success: true });
      } else if (!hasUrlTokens) {
        finish({ success: false, error: result.error ?? INVALID_LINK_MESSAGE });
      }
    });
  });
}
