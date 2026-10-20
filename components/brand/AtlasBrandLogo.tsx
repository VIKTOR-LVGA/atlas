import Link from "next/link";
import { cn } from "@/lib/utils";
type Props={variant?:"landing"|"lockup"|"stacked"|"mark";className?:string;href?:string;compact?:boolean};
export function AtlasBrandLogo({variant="stacked",className,href,compact=false}:Props){
 const mark=variant==="mark";
 const logo=<svg viewBox={mark?"0 0 64 64":"0 0 330 100"} role="img" aria-label="Insura" xmlns="http://www.w3.org/2000/svg" className={cn(mark?"h-8 w-8":variant==="landing"?"h-12 w-[158px] sm:w-[185px]":"h-10 w-[145px]",className)}>
 {mark?<g fill="#1769ff"><rect x="26" y="5" width="12" height="21" rx="6"/><rect x="10" y="27" width="12" height="24" rx="6" transform="rotate(60 16 39)"/><rect x="42" y="27" width="12" height="24" rx="6" transform="rotate(-60 48 39)"/></g>:<>
 <g fill="#101820" fontFamily="Arial, Helvetica, sans-serif" fontWeight="600" fontSize="78" letterSpacing="-4"><text x="4" y="80">insura</text></g>
 <rect x="111" y="14" width="9" height="17" rx="4.5" fill="#1769ff"/><rect x="128" y="14" width="9" height="17" rx="4.5" fill="#1769ff"/>
 </>}
 </svg>;
 return href?<Link href={href} className="inline-flex min-w-0 items-center">{logo}</Link>:logo;
}