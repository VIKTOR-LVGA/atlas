import { cn } from "@/lib/utils";
type Pose = "happy" | "wave" | "document" | "shield";
export function AtlasBrandMark({className,pose="happy"}:{className?:string;pose?:Pose}){
return <svg className={cn("shrink-0",className)} viewBox="0 0 200 215" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={pose==="document"?"Mascotte INSURA con documento":pose==="shield"?"Mascotte INSURA con scudo":"Mascotte INSURA"}>
<defs><linearGradient id="insuraBotShell" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#ffffff"/><stop offset=".6" stopColor="#e7f0ff"/><stop offset="1" stopColor="#a6c5fa"/></linearGradient></defs>
{pose==="wave"&&<g transform="rotate(-28 160 117)"><path d="M149 117l21-42" stroke="#8daff0" strokeWidth="20" strokeLinecap="round"/><ellipse cx="173" cy="70" rx="15" ry="19" fill="#f2f7ff" stroke="#86a8e6" strokeWidth="5"/></g>}
<ellipse cx="100" cy="162" rx="57" ry="45" fill="url(#insuraBotShell)" stroke="#b6cafa" strokeWidth="5"/>
<ellipse cx="100" cy="85" rx="78" ry="75" fill="url(#insuraBotShell)" stroke="#a5bdec" strokeWidth="6"/>
<rect x="38" y="43" width="124" height="85" rx="40" fill="#0b1831" stroke="#688cdd" strokeWidth="6"/>
<path d="M61 87q13-19 26 0M113 87q13-19 26 0" fill="none" stroke="#208bff" strokeWidth="9" strokeLinecap="round"/>
<rect x="73" y="14" width="11" height="20" rx="5" fill="#1676ff"/><rect x="98" y="14" width="11" height="20" rx="5" fill="#1676ff"/>
<ellipse cx="25" cy="98" rx="14" ry="20" fill="#e8f1ff" stroke="#8aa9e4" strokeWidth="5"/><ellipse cx="175" cy="98" rx="14" ry="20" fill="#e8f1ff" stroke="#8aa9e4" strokeWidth="5"/>
<circle cx="100" cy="153" r="6" fill="#1268ff"/><path d="M86 166q14 16 28 0" fill="none" stroke="#1268ff" strokeWidth="5" strokeLinecap="round"/>
{pose==="document"&&<g transform="translate(120 119) rotate(12)"><rect width="54" height="70" rx="8" fill="#fff" stroke="#1268ff" strokeWidth="5"/><path d="M12 21h30M12 33h24M12 45h29" stroke="#9ab7f4" strokeWidth="4" strokeLinecap="round"/></g>}
{pose==="shield"&&<g transform="translate(122 125)"><path d="M25 0 50 11v21q0 23-25 35Q0 55 0 32V11Z" fill="#1268ff" stroke="#d9e7ff" strokeWidth="5"/><path d="m12 31 9 9 18-20" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></g>}
{pose==="happy"&&<g><path d="M159 17l8-14M175 31l15-12" stroke="#1676ff" strokeWidth="6" strokeLinecap="round"/></g>}
{pose==="wave"&&<path d="M14 153q-8 12 5 20" fill="none" stroke="#8daff0" strokeWidth="12" strokeLinecap="round"/>}
</svg>;
}