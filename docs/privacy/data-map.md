# Privacy data map

**Status:** internal technical inventory. **REQUIRES SWISS LEGAL REVIEW** before public legal claims.

| Category | Source | Purpose | Who can access | Storage | Sharing | Deletion / revocation |
|---|---|---|---|---|---|---|
| Identity | `profiles`, Auth | Account | Owner; Admin | Supabase Auth + DB | Not to Intelligence | Account deletion workflow |
| Insurance policies | `policies` | Wallet | Owner; assigned Broker if shared | DB | Explicit share | Soft/hard per ops review |
| Documents / PDFs | Storage + `documents` | Extraction / evidence | Owner; shared Broker | Private storage | Explicit share | Object delete + metadata |
| Vehicle / property | household entities | Context | Owner; shared | DB | Explicit share | With account/policy |
| Consultations | `consultation_requests` | Broker review | Consumer + assigned Broker + Admin | DB | Via assignment | Operational retention |
| Messages | `consultation_messages` | Collaboration | Participants + Admin | DB | Within consultation | Operational retention |
| Broker sharing | shared resources | Explicit consent | Consumer + Broker | DB | Revocable | Revocation removes access |
| Offers / PDFs | `insurance_offers` + storage | Quotes | Consumer + Broker | DB + private storage | Consultation context | Immutable versions kept |
| Contracts / commissions | broker tables | Outcomes / finance | Broker (own) + Admin | DB | Not to Intelligence raw | Financial retention TBD |
| Analytics facts | `analytics_*_fact` | Internal normalize | Service/security definer only | DB | Never to partners | Aggregates may outlive raw |
| Aggregates / snapshots | `intelligence_*_snapshot` | B2B market intel | Entitled Intelligence + Admin | DB | Aggregate only, k≥threshold | Legal review for retention |
| Audit logs | platform / Intelligence audit | Security / ops | Admin | DB | Internal | Retention TBD |

Intelligence Partners never receive PII or raw operational rows.
