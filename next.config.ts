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

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
  async redirects() {
    return partnerToBrokerRedirects;
  },
};

export default nextConfig;
