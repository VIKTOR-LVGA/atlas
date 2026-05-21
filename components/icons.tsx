type IconProps = { className?: string };

function IconBase({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconLogo({ className = "h-9 w-9" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" aria-hidden>
      <rect width="36" height="36" rx="10" fill="#1e3a5f" />
      <path
        d="M18 8l7 3.5v5.5c0 4.2-2.8 7.5-7 9-4.2-1.5-7-4.8-7-9V11.5L18 8z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 17l3 3 5-6"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconDashboard({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </IconBase>
  );
}

export function IconPolicies({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
      <path d="M9 5a2 2 0 014 0M9 12h6M9 16h4" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconAnalysis({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 19V5M10 19V9M16 19v-6M22 19V3" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconMarket({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 2" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconRecommendations({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L6 21l2.3-7-6-4.6h7.6L12 2z" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconDocuments({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" strokeLinejoin="round" />
      <path d="M14 2v6h6M10 13h4M10 17h4" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconConsulting({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M17 8a5 5 0 10-10 0 5 5 0 0010 0z" />
      <path d="M12 13v2M8 21h8M10 17h4" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M15 17H9a3 3 0 006 0z" />
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconHelp({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconChevronDown({ className }: IconProps) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function IconRefresh({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 12a8 8 0 0114-5M20 12a8 8 0 01-14 5" strokeLinecap="round" />
      <path d="M18 4v4h-4M6 20v-4H2" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconCar({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M5 17h14M6 17l-1-5h14l-1 5M7 12l1.5-4h7L17 12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconHome({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconHealth({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 3l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconLife({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 21s-6-4.5-6-10a6 6 0 1112 0c0 5.5-6 10-6 10z" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconLegal({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 3v3M8 6h8M10 9h4v12H10V9z" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconPiggy({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M19 11c0-4-3-7-7-7S5 7 5 11s3 7 7 7 7-3 7-7z" />
      <path d="M12 7v2M9 14h6" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconAlert({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconUpload({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconFilter({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconCompare({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M8 7h8M8 12h5M8 17h8" strokeLinecap="round" />
      <path d="M4 4v16M20 4v16" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconX({ className }: IconProps) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function IconMoreVertical({ className }: IconProps) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

export function IconSparkle({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconChat({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h4a8 8 0 018 8z" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconFolder({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 7h5l2 2h9v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconLock({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 118 0v3" strokeLinecap="round" />
    </IconBase>
  );
}
