import Link from "next/link";
import { cn } from "@/lib/utils";

export function LinkAction({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-[12px] font-medium text-blue-600 transition hover:text-blue-700",
        className
      )}
    >
      {children}
    </Link>
  );
}
