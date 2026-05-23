import { cn } from "@/lib/utils";

interface ActionBarProps {
  children: React.ReactNode;
  className?: string;
  stacked?: boolean;
}

export function ActionBar({ children, className, stacked = true }: ActionBarProps) {
  return (
    <div
      className={cn(
        stacked ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-2",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ActionButton({
  children,
  href,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition";

  const variants = {
    primary: "bg-accent text-accent-foreground hover:bg-accent-hover",
    secondary:
      "border border-border bg-card text-muted-foreground shadow-sm hover:bg-card-muted",
    ghost: "text-muted hover:bg-card-muted",
  };

  return (
    <a href={href} className={cn(base, variants[variant], className)}>
      {children}
    </a>
  );
}
