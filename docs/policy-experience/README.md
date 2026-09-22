# Policy Experience 3.0

## Information architecture

Tabs (`?view=`):

1. **Panoramica** — contract, cost, timeline, vehicle, premium composition, important conditions
2. **Coperture** — grouped compact cards, included / excluded / uncertain
3. **Opportunità** — policy-scoped intelligence (no fake CHF)
4. **Documento** — PDF source + actions
5. **Verifica dati** — extraction completeness, confidence, review tools

Consumer default = Overview. Technical confidence % only on Review.

## Deduplication

- Single plate via `getMotorVehicleDisplay` + car detail keys prefer `license_plate` (fallback `plate_number`)
- Vehicle shown once in Vehicle Card
- Premium once in hero + optional breakdown
- Coverages only on Coverages tab (not stacked with overview)

## Category adapters

Shared shell: Hero + Tabs. Motor uses vehicle visual; other categories use category iconography.
