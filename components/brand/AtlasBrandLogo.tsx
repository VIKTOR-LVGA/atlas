import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = { variant?: "landing" | "lockup" | "stacked" | "mark"; className?: string; href?: string; compact?: boolean };

/** INSURA wordmark: blue smile eyes, independent smiling U, no mark above the I. */
export function AtlasBrandLogo({ variant = "stacked", className, href }: Props) {
 const mark = variant === "mark";
 const graphic = mark ? (
  <svg viewBox="0 0 64 64" role="img" aria-label="Insura" className={cn("h-8 w-8", className)}>
   <path d="M10 23 V35 C10 48 20 55 32 55 C44 55 54 48 54 35 V23" fill="none" stroke="#101820" strokeWidth="9" strokeLinecap="round"/>
   <rect x="17" y="5" width="9" height="14" rx="4.5" fill="#1769ff"/>
   <rect x="38" y="5" width="9" height="14" rx="4.5" fill="#1769ff"/>
  </svg>
 ) : (
  <svg viewBox="0 0 335 95" role="img" aria-label="Insura" xmlns="http://www.w3.org/2000/svg" className={cn(variant==="landing"?"h-12 w-[158px] sm:w-[185px]":"h-10 w-[145px]",className)}>
   <g fill="#101820" fontFamily="Arial, Helvetica, sans-serif" fontWeight="600" fontSize="78" letterSpacing="-4">
    <text x="4" y="79">ins</text>
    <text x="185" y="79">ra</text>
   </g>
   <path d="M123 37 V52 C123 71 135 81 151 81 C167 81 179 71 179 52 V37" stroke="#101820" strokeWidth="13" fill="none" strokeLinecap="round"/>
   <rect x="135" y="14" width="10" height="17" rx="5" fill="#1769ff"/>
   <rect x="157" y="14" width="10" height="17" rx="5" fill="#1769ff"/>
  </svg>
 );
 return href ? <Link href={href} className="inline-flex min-w-0 items-center">{graphic}</Link> : graphic;
}
