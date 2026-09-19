export function mapSupabaseAuthError(
  message: string,
  context: "login" | "register" | "recovery" = "register"
): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch failed") ||
    normalized.includes("networkerror") ||
    normalized.includes("load failed") ||
    normalized.includes("network request failed")
  ) {
    return "Impossibile connettersi al servizio di autenticazione. Riprova tra poco.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Email o password non corretti.";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered")
  ) {
    return "Esiste già un account con questa email.";
  }

  if (normalized.includes("password")) {
    return "La password non soddisfa i requisiti di sicurezza.";
  }

  if (normalized.includes("rate limit")) {
    return "Troppi tentativi. Riprova tra qualche minuto.";
  }

  if (context === "recovery" && normalized.includes("not authorized")) {
    return "Il servizio email di recupero non è configurato per questo indirizzo.";
  }

  if (normalized.includes("email")) {
    return "Indirizzo email non valido.";
  }

  if (normalized.includes("signup is disabled")) {
    return "La registrazione non è attiva in questo ambiente.";
  }

  if (context === "login") {
    return "Accesso non riuscito. Verifica email e password.";
  }

  if (context === "recovery") {
    return "Impossibile inviare l'email di recupero. Riprova più tardi.";
  }

  return "Registrazione non riuscita. Verifica i dati e riprova.";
}
