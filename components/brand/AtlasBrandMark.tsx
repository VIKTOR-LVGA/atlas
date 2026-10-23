import { cn } from "@/lib/utils";
type Pose = "happy" | "wave" | "document" | "shield";
export function AtlasBrandMark({className,pose="happy"}:{className?:string;pose?:Pose}){
const wave=pose==="wave",doc=pose==="document",shield=pose==="shield";
return <svg className={cn("shrink-0",className)} viewBox="0 0 300 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={doc?"Mascotte INSURA con documento":shield?"Mascotte INSURA con scudo":"Mascotte INSURA tridimensionale"}>
<defs>
<radialGradient id="insura3dShell" cx=".26" cy=".14" r=".95"><stop stopColor="#fff"/><stop offset=".43" stopColor="#f7faff"/><stop offset=".78" stopColor="#c4d9fc"/><stop offset="1" stopColor="#719bdf"/></radialGradient>
<linearGradient id="insura3dFace" x1=".15" x2=".87" y1=".1" y2="1"><stop stopColor="#182b52"/><stop offset=".42" stopColor="#061022"/><stop offset="1" stopColor="#010611"/></linearGradient>
<linearGradient id="insura3dMetal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".48" stopColor="#dceaff"/><stop offset="1" stopColor="#6797e7"/></linearGradient>
<filter id="insura3dShadow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="insura3dGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>
<ellipse cx="149" cy="291" rx="94" ry="12" fill="#2b65b9" opacity=".15" filter="url(#insura3dShadow)"/>
<g>
<path d="M104 246 98 274q-2 11 10 13h20q10-2 9-13l-2-28" fill="url(#insura3dMetal)" stroke="#9bb9ec" strokeWidth="5"/>
<path d="m171 247 2 27q1 12 12 13h20q12-4 8-16l-9-25" fill="url(#insura3dMetal)" stroke="#9bb9ec" strokeWidth="5"/>
<ellipse cx="151" cy="225" rx="69" ry="59" fill="url(#insura3dShell)" stroke="#9eb9e9" strokeWidth="5"/>
<path d="M104 192q48-20 96 4" fill="none" stroke="#fff" strokeWidth="8" opacity=".78"/>
<rect x="139" y="203" width="10" height="13" rx="5" fill="#1476ff"/><rect x="153" y="203" width="10" height="13" rx="5" fill="#1476ff"/>
<path d="M139 236q12 13 26 0" stroke="#1268ff" strokeWidth="6" fill="none" strokeLinecap="round"/>
<path d="M76 192q-24-3-34 24" stroke="#0b1a38" strokeWidth="19" strokeLinecap="round"/><ellipse cx="40" cy="220" rx="19" ry="23" fill="url(#insura3dMetal)" stroke="#83a9ea" strokeWidth="5"/>
{wave?<g><path d="M215 198q32-26 41-61" stroke="#091c41" strokeWidth="20" strokeLinecap="round"/><path d="M256 136q10-12 19-5l5 10q2 10-9 16l-10 6q-18 3-19-13" fill="url(#insura3dMetal)" stroke="#88a9df" strokeWidth="5"/><path d="M263 132l8-18" stroke="#fff" strokeWidth="9" strokeLinecap="round"/></g>:<g><path d="M220 194q23 12 32 36" stroke="#0a1c3d" strokeWidth="20" strokeLinecap="round"/><ellipse cx="252" cy="232" rx="18" ry="22" fill="url(#insura3dMetal)" stroke="#8aace6" strokeWidth="5"/></g>}
</g>
<g transform="rotate(-8 151 111)">
<ellipse cx="150" cy="110" rx="122" ry="99" fill="#96b8ee" opacity=".24" filter="url(#insura3dGlow)"/>
<rect x="40" y="17" width="221" height="193" rx="91" fill="url(#insura3dShell)" stroke="#aac4ef" strokeWidth="7"/>
<path d="M65 60q75-63 167-12" stroke="#fff" strokeWidth="12" fill="none" opacity=".9" strokeLinecap="round"/>
<rect x="58" y="62" width="184" height="119" rx="59" fill="url(#insura3dFace)" stroke="#4d80d4" strokeWidth="8"/>
<path d="M82 81q44-25 90-15" stroke="#7fb4ff" strokeWidth="6" opacity=".22" fill="none" strokeLinecap="round"/>
<path d="M88 127q21-31 42 0M167 127q21-31 42 0" fill="none" stroke="#1885ff" strokeWidth="18" strokeLinecap="round" filter="url(#insura3dGlow)" opacity=".7"/>
<path d="M88 127q21-31 42 0M167 127q21-31 42 0" fill="none" stroke="#2d9dff" strokeWidth="12" strokeLinecap="round"/>
<rect x="118" y="23" width="15" height="29" rx="7" fill="#0868ff"/><rect x="146" y="23" width="15" height="29" rx="7" fill="#0868ff"/>
<ellipse cx="36" cy="134" rx="21" ry="29" fill="url(#insura3dMetal)" stroke="#81a7e7" strokeWidth="6"/>
<ellipse cx="264" cy="134" rx="21" ry="29" fill="url(#insura3dMetal)" stroke="#81a7e7" strokeWidth="6"/>
<circle cx="150" cy="193" r="6" fill="#146dfc"/>
</g>
{doc&&<g transform="translate(190 185) rotate(12)"><rect width="80" height="102" rx="12" fill="#fff" stroke="#1775ff" strokeWidth="6"/><path d="M16 29h45M16 45h39M16 61h45" stroke="#9bbcf5" strokeWidth="6" strokeLinecap="round"/><circle cx="40" cy="82" r="8" fill="#1775ff"/></g>}
{shield&&<g transform="translate(190 190)"><path d="M36 0 72 17v31q0 34-36 50Q0 82 0 48V17Z" fill="#116aff" stroke="#dceaff" strokeWidth="7"/><path d="m17 45 13 13 26-29" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none"/></g>}
{wave&&<path d="M265 95l15-15M276 111l18-5" stroke="#1775ff" strokeWidth="7" strokeLinecap="round"/>}
</svg>;
}