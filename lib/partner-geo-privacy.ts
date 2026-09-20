import { PARTNER_GEO_PRIVACY_THRESHOLD } from "@/lib/swiss-cantons";

export type CantonAggregate = {
  canton: string;
  leads: number;
  clients: number;
  contracts: number;
  users?: number;
  policies?: number;
  consultations?: number;
  brokerRevenue: number;
  grossCommission: number;
  atlasRevenue: number;
  privacyMasked?: boolean;
};

/**
 * Partner-facing canton economics are masked when client count is below the privacy threshold.
 * See docs/partner-geo-privacy.md.
 */
export function applyPartnerGeoPrivacy(rows: CantonAggregate[]): CantonAggregate[] {
  return rows.map((row) => {
    const partnerSafe = { ...row, atlasRevenue: 0 };
    if (row.clients >= PARTNER_GEO_PRIVACY_THRESHOLD) {
      return partnerSafe;
    }
    return {
      ...partnerSafe,
      privacyMasked: true,
      brokerRevenue: 0,
      grossCommission: 0,
    };
  });
}
