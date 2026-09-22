# ATLAS Broker Workspace

## Product scope

The Broker Workspace is for **approved brokers** who receive ATLAS-originated consultation requests.

It is **not**:

- a full personal CRM
- a replacement for the broker’s company portfolio tools
- ATLAS Intelligence (company market analytics)

It **is**:

- manage ATLAS-assigned requests and clients
- communicate on the practice
- propose appointments
- create structured offers
- register contracts and view ATLAS commissions

## Routes

Canonical:

- `/broker` — public marketing
- `/broker/dashboard`
- `/broker/requests` (+ `/broker/requests/[id]`)
- `/broker/clients`
- `/broker/appointments`
- `/broker/offers`
- `/broker/contracts`
- `/broker/commissions`
- `/broker/analytics`
- `/broker/profile`

Legacy compatibility:

- `/partner/*` operational routes redirect to `/broker/*`
- `/broker/leads` → `/broker/requests`

Application / status remain under `/partner/apply` and `/partner/status` for continuity.

## Role model

- Role: `broker` (unchanged)
- Broker access is **not** Intelligence access
- Entitlements are separate (`intelligence_memberships`)

## Privacy

- Brokers see only assigned consultations
- Shared policies/documents require explicit consumer sharing
- ATLAS commission share remains hidden from brokers
- Broker A cannot read Broker B data (RLS)

## Accept / decline

On assignment, broker can:

- **Prendi in carico** (`broker_respond_to_assignment` → accepted)
- **Non disponibile** (optional internal reason; request unassigned for reassignment)

## Messaging

`consultation_messages` is scoped to a single consultation.

Visible to: consumer owner, assigned broker, admin.

System events are stored with `message_kind = system`.

## Remaining gaps (documented)

- Consumer-side message/appointment counter-proposal UI (P1)
- Full offer comparison consumer page (P1)
- PDF quote extraction prefill (P1)
- Response-time analytics series (P2)
- Push/email notification center (P2)
