import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconCheck } from "@/components/icons";

interface CTABoxProps {
  title: string;
  description?: string;
  checklist?: string[];
  buttonLabel?: string;
  buttonHref?: string;
  variant?: "consulting" | "analysis" | "banner";
  className?: string;
}

export function CTABox({
  title,
  description,
  checklist,
  buttonLabel,
  buttonHref = "/consulting",
  variant = "consulting",
  className,
}: CTABoxProps) {
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-border bg-accent-soft px-5 py-3.5",
          className
        )}
      >
        <p className="text-[12px] text-muted-foreground">{title}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent-soft via-card to-card shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{description}</p>
          )}
          {checklist && (
            <ul className="mt-3 space-y-1.5">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <IconCheck className="h-2.5 w-2.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}
          {buttonLabel && (
            <Link
              href={buttonHref}
              className="atlas-btn-primary mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-[13px] sm:w-auto"
            >
              {buttonLabel}
            </Link>
          )}
        </div>
        {variant === "consulting" && (
          <div className="hidden shrink-0 sm:block">
            <div className="flex h-24 w-24 items-end justify-center rounded-2xl bg-accent-soft">
              <svg viewBox="0 0 80 96" className="h-20 w-20" aria-hidden>
                <ellipse cx="40" cy="88" rx="28" ry="6" fill="#dbeafe" />
                <rect x="22" y="28" width="36" height="44" rx="6" fill="#3b82f6" opacity="0.15" />
                <circle cx="40" cy="22" r="12" fill="#fcd34d" />
                <rect x="28" y="38" width="24" height="32" rx="4" fill="#2563eb" opacity="0.3" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
