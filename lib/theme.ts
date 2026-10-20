export type ThemeMode = "light" | "dark";
export const THEME_STORAGE_KEY = "atlas-theme";
export const SSR_THEME: ThemeMode = "light";
const THEME_EVENT = "atlas-theme-change";

export function getSystemTheme(): ThemeMode { return "light"; }
export function getStoredTheme(): ThemeMode | null { return "light"; }
export function resolveTheme(): ThemeMode { return "light"; }
export function getThemeSnapshot(): ThemeMode { return "light"; }
export function getThemeServerSnapshot(): ThemeMode { return "light"; }
export function subscribeTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_EVENT, onStoreChange);
}
export function applyTheme(_theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", "light");
  try { localStorage.setItem(THEME_STORAGE_KEY, "light"); } catch {}
  window.dispatchEvent(new Event(THEME_EVENT));
}
export const themeLabels: Record<ThemeMode, string> = { light: "Giorno", dark: "Giorno" };
