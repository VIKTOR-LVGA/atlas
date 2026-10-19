# ATLAS legal and privacy review checklist

Status: **open — human/legal approval required**  
Date prepared: 2026-10-19  
Jurisdiction focus: Switzerland; GDPR applicability to be determined

This document is an implementation review aid, not legal advice and not a
statement that ATLAS complies with the Swiss Federal Act on Data Protection
(FADP/DSG), the GDPR, FINMA requirements or insurance-intermediation rules.
Existing public legal pages must remain labelled as drafts until the approvals
below are recorded.

## 1. Controller, scope and roles

- [ ] Record the legal name, registered address and contact details of the data
      controller.
- [ ] Name the privacy contact or data-protection adviser and publish a working
      request channel.
- [ ] Determine whether ATLAS acts as controller, processor, joint controller or
      intermediary for each consumer, Intelligence and partner workflow.
- [ ] Determine whether GDPR applies through offering or monitoring activities
      involving people in the EEA.
- [ ] Have Swiss counsel assess insurance-intermediation, FINMA and sector rules.

Owner: ______  Counsel approval/date: ______

## 2. Real data map and purposes

- [ ] Verify the live data inventory against `docs/privacy/data-map.md`, database
      migrations, Storage buckets, logs, analytics and support processes.
- [ ] Catalogue identity/contact data, insurance documents and extracted policy
      terms, premiums/payment evidence, claims, health-related content,
      household information, usage telemetry and Intelligence application data.
- [ ] State a specific purpose and lawful basis for every category and workflow.
- [ ] Identify sensitive/high-risk data and complete a DPIA/risk assessment where
      required.
- [ ] Confirm that AI analysis is assistive, exposes uncertainty and does not make
      unreviewed decisions with legal or similarly significant effects.

Owner: ______  Product approval/date: ______  Counsel approval/date: ______

## 3. Vendors, processors and transfers

The implementation currently includes at least:

- Supabase: authentication, database and object storage;
- Vercel: hosting, delivery and runtime logs;
- OpenAI: server-side document/insurance analysis where configured.

For each vendor:

- [ ] verify the exact service, contracting entity, subprocessors and processing
      regions used by the deployed environment;
- [ ] execute and archive the applicable DPA;
- [ ] document international transfers and the chosen transfer mechanism,
      including any Swiss/EU standard clauses and transfer-risk assessment;
- [ ] verify whether customer content is retained or used for model training and
      configure the approved setting;
- [ ] define incident notification, deletion and return-of-data obligations;
- [ ] update the public processor/subprocessor disclosure only from signed facts.

Security owner: ______  Procurement approval/date: ______  Counsel approval/date: ______

## 4. Retention, deletion and backups

- [ ] Approve a retention period or event for every data category, including raw
      uploads, extracted text, model outputs, applications, auth records, audit
      events, runtime logs, support material and backups.
- [ ] Implement deletion across primary data, Storage, derived data and vendor
      systems, with documented backup expiry.
- [ ] Define legal-hold exceptions and access controls.
- [ ] Test account deletion and export using non-production fixtures and retain
      auditable evidence.

Owner: ______  Security approval/date: ______  Counsel approval/date: ______

## 5. Individual rights and transparency

- [ ] Provide an authenticated or verified process for access, correction,
      deletion, restriction/objection and data portability where applicable.
- [ ] Define identity verification, response deadlines, escalation and a request
      register.
- [ ] Explain AI involvement, material limitations, human review and how users
      can challenge a result.
- [ ] Explain complaint/escalation channels and competent supervisory authorities
      only after counsel confirms the correct wording.
- [ ] Review age eligibility and the handling of minors' data.

Privacy owner: ______  Support approval/date: ______  Counsel approval/date: ______

## 6. Consent, cookies and communications

- [ ] Distinguish contractual necessity, legitimate interests and consent; do not
      use one blanket consent for unrelated purposes.
- [ ] Record consent wording, version, timestamp and withdrawal where consent is
      the selected basis.
- [ ] Inventory cookies, local storage, telemetry and marketing technologies;
      implement a preference mechanism if the approved assessment requires it.
- [ ] Verify the legal basis and opt-out process for product and marketing email.

Owner: ______  Marketing approval/date: ______  Counsel approval/date: ______

## 7. Security and incidents

- [ ] Approve access-control, encryption, secrets, logging, vulnerability and
      supplier-management standards.
- [ ] Exercise the incident runbook, breach assessment and regulator/user
      notification decision process.
- [ ] Define ownership and review cadence for Row Level Security tests and audit
      logs.

Security approval/date: ______  Counsel approval/date: ______

## Publication gate

Do not remove the draft/review notices from `/privacy` or `/terms`, or claim
regulatory compliance, until all applicable sections have named owners, recorded
evidence and signed human/legal approval. Final published text must be reviewed
against the deployed product and vendor configuration, not this checklist alone.
