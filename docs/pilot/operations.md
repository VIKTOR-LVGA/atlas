# Pilot operations

## Daily checks (Admin)

1. `/control-center/health` — web/DB/Intelligence snapshot status
2. Open broker applications / Intelligence applications
3. Failed extractions documents (support inbox / user reports)
4. Snapshot last run succeeded (or rebuild)

## New Consumer

1. Register → confirm email (if enabled)
2. Upload policy PDF
3. Review extraction → correct → confirm
4. Optional: request broker review + share resources
5. Message / appointment / offer / decision

## New Broker

1. Partner application → Admin approve
2. Broker login `/broker`
3. Accept assignment → message → appointment → offer verify/send → contract

## Intelligence partner

1. `/intelligence/apply`
2. Admin approve + modules
3. Portal shows aggregates or insufficient sample (expected while N small)

## Support channel (simple)

Use configured support email (`NEXT_PUBLIC_ATLAS_SUPPORT_EMAIL`).

Accept reports for: technical issue, wrong extraction, broker problem, privacy concern.

## Feature freeze

After Pilot Readiness release: only P0 bugs, security, data integrity, critical UX.
