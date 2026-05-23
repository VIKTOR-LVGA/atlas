"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";
import { themeLabels } from "@/lib/theme";
import { useTheme } from "@/components/theme/ThemeProvider";

type ThemeToggleProps = {
  className?: string;
};

function ThemeTogglePlaceholder({ className }: { className?: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label="Tema visivo"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted",
        className
      )}
    >
      <Moon className="h-4 w-4 opacity-40" aria-hidden />
    </button>
  );
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { theme, setTheme } = useTheme();

  if (!isClient) {
    return <ThemeTogglePlaceholder className={className} />;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted transition",
        "hover:bg-accent-soft hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        className
      )}
      aria-label={isDark ? "Passa a Giorno" : "Passa a Notte"}
      title={isDark ? themeLabels.light : themeLabels.dark}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
