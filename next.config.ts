import type { NextConfig } from "next";

const partnerToBrokerRedirects = [
  { source: "/partner/dashboard", destination: "/broker/dashboard" },
  { source: "/partner/leads", destination: "/broker/requests" },
  { source: "/partner/leads/:id", destination: "/broker/requests/:id" },
  { source: "/partner/clients", destination: "/broker/clients" },
  { source: "/partner/clients/:id", destination: "/broker/clients/:id" },
  { source: "/partner/appointments", destination: "/broker/appointments" },
  { source: "/partner/offers", destination: "/broker/offers" },
  { source: "/partner/contracts", destination: "/broker/contracts" },
  { source: "/partner/commissions", destination: "/broker/commissions" },
  { source: "/partner/analytics", destination: "/broker/analytics" },
  { source: "/partner/profile", destination: "/broker/profile" },
  // Legacy /broker/leads bookmarks
  { source: "/broker/leads", destination: "/broker/requests" },
  { source: "/broker/leads/:id", destination: "/broker/requests/:id" },
].map((rule) => ({ ...rule, permanent: false }));

const developmentConnectSources =
  process.env.NODE_ENV === "development"
    ? " http://localhost:* ws://localhost:*"
    : "";

// Start CSP in report-only mode: ATLAS uses Supabase Auth/Realtime directly in
// the browser and Next.js emits inline bootstrap scripts. Enforcing this policy
// requires reviewing real Preview reports first; the remaining security headers
// are safe to enforce immediately.
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${developmentConnectSources}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
  async redirects() {
    return partnerToBrokerRedirects;
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
