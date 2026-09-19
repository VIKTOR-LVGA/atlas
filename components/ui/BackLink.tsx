import Link from "next/link";
import { cn } from "@/lib/utils";

export function BackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center gap-1 text-[13px] font-medium text-muted transition hover:text-foreground",
        className
      )}
    >
      <span aria-hidden className="text-[16px] leading-none">
        ‹
      </span>
      {label}
    </Link>
  );
}
