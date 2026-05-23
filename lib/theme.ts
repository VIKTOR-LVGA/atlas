export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "atlas-theme";
export const SSR_THEME: ThemeMode = "light";

const THEME_EVENT = "atlas-theme-change";

export function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return SSR_THEME;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return null;
}

export function resolveTheme(): ThemeMode {
  return getStoredTheme() ?? getSystemTheme();
}

export function getThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") return SSR_THEME;
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

export function getThemeServerSnapshot(): ThemeMode {
  return SSR_THEME;
}

export function subscribeTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = () => {
    if (!getStoredTheme()) {
      const next = media.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
    }
    onStoreChange();
  };

  const onThemeEvent = () => onStoreChange();

  window.addEventListener(THEME_EVENT, onThemeEvent);
  window.addEventListener("storage", onStoreChange);
  media.addEventListener("change", onMediaChange);

  return () => {
    window.removeEventListener(THEME_EVENT, onThemeEvent);
    window.removeEventListener("storage", onStoreChange);
    media.removeEventListener("change", onMediaChange);
  };
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export const themeLabels: Record<ThemeMode, string> = {
  light: "Giorno",
  dark: "Notte",
};
