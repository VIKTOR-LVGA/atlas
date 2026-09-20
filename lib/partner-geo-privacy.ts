import { PARTNER_GEO_PRIVACY_THRESHOLD } from "@/lib/swiss-cantons";

export type CantonAggregate = {
  canton: string;
  leads: number;
  clients: number;
  contracts: number;
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
    if (row.clients >= PARTNER_GEO_PRIVACY_THRESHOLD || row.canton === "UNKNOWN") {
      return row;
    }
    return {
      ...row,
      privacyMasked: true,
      brokerRevenue: 0,
      grossCommission: 0,
      atlasRevenue: 0,
    };
  });
}
