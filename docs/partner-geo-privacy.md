# Geographic privacy (partner analytics)

Partner-facing canton aggregates never include addresses, coordinates, or household pins.

## Threshold

`PARTNER_GEO_PRIVACY_THRESHOLD = 3` (see `lib/swiss-cantons.ts`).

If a canton (including `UNKNOWN`) has fewer than 3 distinct clients for that partner:

- lead / client / contract counts may still be shown (operational);
- monetary metrics (`brokerRevenue`, `grossCommission`, `atlasRevenue`) are zeroed and marked `privacyMasked`.

`atlasRevenue` is always zero in the partner RPC response, independently of the threshold. ATLAS economics remain admin-only.

Admin Control Center aggregates are not masked by this threshold (admin least-privilege still applies elsewhere: no automatic PDF open).

## Choice rationale

Small canton cells can re-identify individuals when combined with known partner territory. Masking economics under 3 clients reduces that risk without hiding the existence of sparse activity.
