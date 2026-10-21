import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AtlasBrandMark } from "@/components/brand/AtlasBrandMark";

type Props = {
  variant?: "landing" | "lockup" | "stacked" | "mark";
  className?: string;
  href?: string;
  compact?: boolean;
};

/** Approved INSURA vector wordmark, shared across public and authenticated pages. */
export function AtlasBrandLogo({ variant = "stacked", className, href, compact = false }: Props) {
  const isMark = variant === "mark";
  const content = isMark ? (
    <AtlasBrandMark className={cn("h-8 w-8", className)} />
  ) : (
    <Image
      src="/brand/insura-logo.svg"
      alt="INSURA"
      width={1522}
      height={330}
      unoptimized
      priority={variant === "landing"}
      className={cn(
        "block h-auto shrink-0 object-contain object-left",
        variant === "landing"
          ? "w-[142px] sm:w-[165px]"
          : compact
            ? "w-[108px]"
            : "w-[135px]",
        className
      )}
    />
  );
  return href ? <Link href={href} className="inline-flex min-w-0 items-center">{content}</Link> : content;
}
