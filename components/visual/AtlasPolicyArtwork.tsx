import type { VisualPolicyCategoryId } from "@/lib/policy-visual-categories";

/** Decorative SVG scenes (not representations of insured vehicles or homes). */
export function AtlasPolicyArtwork({ category }: { category: VisualPolicyCategoryId }) {
  if (category === "car") {
    return <div aria-hidden="true" className="atlas-v2-policy-art bg-[#e5efff]">
      <svg viewBox="0 0 140 100" fill="none">
        <path d="M0 74 L40 54 L78 65 L120 42 L140 55 V100 H0" fill="#c5d9fa"/>
        <path d="M0 86 Q60 76 140 84 V100 H0" fill="#afc7ed"/>
        <path d="M0 88 H140" stroke="#f9fcff" strokeWidth="2"/>
        <ellipse cx="72" cy="79" rx="51" ry="9" fill="#86a6d9" opacity=".3"/>
        <path d="M25 65 L39 51 Q43 47 52 47 H94 Q103 47 109 56 L118 63 Q124 65 125 71 V77 Q124 82 116 82 H25 Q17 80 18 73 Q19 68 25 65Z" fill="#557ce3"/>
        <path d="M45 53 Q49 51 55 51 H92 Q98 51 102 56 L110 64 H37Z" fill="#eff6ff"/>
        <path d="M71 52 L70 64" stroke="#a7bde8" strokeWidth="2"/>
        <path d="M27 66 H36 M111 66 H120" stroke="#d4e4ff" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="43" cy="81" r="9" fill="#24385d"/><circle cx="103" cy="81" r="9" fill="#24385d"/>
        <circle cx="43" cy="81" r="4" fill="#d8e6ff"/><circle cx="103" cy="81" r="4" fill="#d8e6ff"/>
      </svg>
    </div>;
  }
  if (category === "household") {
    return <div aria-hidden="true" className="atlas-v2-policy-art bg-[#e5efff]">
      <svg viewBox="0 0 140 100" fill="none">
        <circle cx="116" cy="19" r="11" fill="#fff7d4"/>
        <path d="M0 76 Q45 51 86 71 Q110 60 140 66 V100 H0" fill="#b8d9c3"/>
        <path d="M25 48 L65 22 L115 45 V87 H25Z" fill="#eaf1fd"/>
        <path d="M14 51 L66 14 L126 51 L117 57 L66 30 L24 57Z" fill="#3156a4"/>
        <path d="M52 49 H78 V87 H52Z" fill="#a6c2ee"/>
        <path d="M92 51 H108 V68 H92Z" fill="#a5c8f4"/>
        <path d="M57 86 V54 H73 V86" fill="#8aabdb"/>
        <path d="M87 87 H125" stroke="#84b792" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="15" cy="68" r="13" fill="#90bd9a"/><rect x="13" y="68" width="4" height="20" rx="2" fill="#789d84"/>
      </svg>
    </div>;
  }
  if (category === "health" || category === "life" || category === "pension") {
    return <div aria-hidden="true" className="atlas-v2-policy-art bg-[#ffeaf0]">
      <svg viewBox="0 0 140 100" fill="none">
        <circle cx="70" cy="49" r="39" fill="#ffdbe7"/><circle cx="70" cy="49" r="30" fill="#fff0f5"/>
        <path d="M70 78 C28 52 36 26 52 26 C61 26 67 31 70 37 C73 31 80 26 89 26 C105 26 113 52 70 78Z" fill="#f27796"/>
        <path d="M50 48 H61 L66 38 L74 59 L79 48 H92" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="24" cy="27" r="4" fill="#fff"/><circle cx="115" cy="74" r="6" fill="#ffb9cb"/>
      </svg>
    </div>;
  }
  return <div aria-hidden="true" className="atlas-v2-policy-art bg-[#e9e9ff]">
    <svg viewBox="0 0 140 100" fill="none">
      <circle cx="105" cy="20" r="13" fill="#fbfaff"/>
      <path d="M0 79 L35 36 L53 57 L74 17 L126 78 L140 63 V100 H0Z" fill="#96aff2"/>
      <path d="M52 57 L74 17 L91 42 L79 34 L73 43 L66 37Z" fill="white" opacity=".88"/>
      <path d="M0 89 L42 61 L68 87 L115 50 L140 73 V100 H0Z" fill="#577fdb"/>
      <path d="M12 94 L23 72 L29 87 L38 75 L50 96" fill="#c1d3ff" opacity=".8"/>
    </svg>
  </div>;
}
