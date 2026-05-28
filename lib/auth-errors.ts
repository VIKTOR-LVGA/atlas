export function mapSupabaseAuthError(
  message: string,
  context: "login" | "register" = "register"
): string {
  const normalized = message.toLowerCase();

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

  if (normalized.includes("email")) {
    return "Indirizzo email non valido.";
  }

  if (normalized.includes("rate limit")) {
    return "Troppi tentativi. Riprova tra qualche minuto.";
  }

  if (normalized.includes("signup is disabled")) {
    return "La registrazione non è attiva in questo ambiente.";
  }

  return context === "login"
    ? "Accesso non riuscito. Verifica email e password."
    : "Registrazione non riuscita. Verifica i dati e riprova.";
}
