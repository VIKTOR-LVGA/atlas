export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Inserisci la tua email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Inserisci un indirizzo email valido.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Inserisci la password.";
  if (password.length < 8) return "La password deve avere almeno 8 caratteri.";
  return null;
}

export function validateFullName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Inserisci il tuo nome completo.";
  if (trimmed.length < 2) return "Il nome deve avere almeno 2 caratteri.";
  return null;
}

export function validateConfirmPassword(
  password: string,
  confirm: string
): string | null {
  if (!confirm) return "Conferma la password.";
  if (password !== confirm) return "Le password non coincidono.";
  return null;
}
