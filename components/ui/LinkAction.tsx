import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function LinkAction({
  href,
  children,
  className,
  showArrow = true,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  showArrow?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "atlas-link-action text-[12px] font-medium text-accent hover:text-accent-hover",
        className
      )}
    >
      {children}
      {showArrow ? (
        <ChevronRight className="atlas-link-chevron h-3.5 w-3.5" aria-hidden />
      ) : null}
    </Link>
  );
}
