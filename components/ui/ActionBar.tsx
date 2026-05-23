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
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary:
      "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-50",
  };

  return (
    <a href={href} className={cn(base, variants[variant], className)}>
      {children}
    </a>
  );
}
