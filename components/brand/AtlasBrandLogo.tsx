import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AtlasBrandMark } from "@/components/brand/AtlasBrandMark";

type AtlasBrandLogoProps = {
  /** Landing nav — vector mark + text (no raster background) */
  variant?: "landing" | "lockup" | "stacked" | "mark";
  className?: string;
  href?: string;
  /** Sidebar / app shell — slightly tighter type */
  compact?: boolean;
};

export function AtlasBrandLogo({
  variant = "stacked",
  className,
  href,
  compact = false,
}: AtlasBrandLogoProps) {
  const content =
    variant === "landing" ? (
      <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
        <AtlasBrandMark className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
        <div className="min-w-0 leading-none">
          <p className="text-[14px] font-semibold tracking-tight text-[var(--landing-text)] sm:text-[15px]">
            ATLAS
          </p>
          <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--landing-muted)] sm:text-[10px]">
            AI Insurance
          </p>
        </div>
      </div>
    ) : variant === "lockup" ? (
      <Image
        src="/brand/atlas-logo-lockup.png"
        alt="Atlas AI Insurance"
        width={200}
        height={48}
        className={cn(
          "h-8 w-auto max-w-[min(100%,11rem)] object-contain object-left sm:h-9 sm:max-w-[12.5rem]",
          className
        )}
        priority
      />
    ) : variant === "mark" ? (
      <AtlasBrandMark className={cn("h-8 w-8", className)} />
    ) : (
      <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
        <AtlasBrandMark
          className={cn(compact ? "h-7 w-7" : "h-8 w-8")}
        />
        <div className="min-w-0 leading-none">
          <p
            className={cn(
              "font-semibold tracking-tight text-foreground",
              compact ? "text-[13px]" : "text-[14px]"
            )}
          >
            ATLAS
          </p>
          <p
            className={cn(
              "mt-0.5 font-medium uppercase tracking-[0.16em] text-muted",
              compact ? "text-[8px]" : "text-[9px]"
            )}
          >
            AI Insurance
          </p>
        </div>
      </div>
    );

  if (href) {
    return (
      <Link href={href} className="inline-flex min-w-0 items-center">
        {content}
      </Link>
    );
  }

  return content;
}
