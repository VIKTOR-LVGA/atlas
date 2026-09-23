const fallback = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function labelOf(map: Record<string, string>, value: string | null | undefined) {
  if (!value) return "—";
  return map[value] ?? fallback(value);
}

export const consultationStatusLabels: Record<string, string> = {
  submitted: "Richiesta ricevuta",
  assigned: "In gestione",
  contacted: "Contattato",
  consultation_scheduled: "Appuntamento fissato",
  in_review: "In revisione",
  quoted: "Offerta inviata",
  won: "Completata",
  lost: "Chiusa",
  completed: "Completata",
  cancelled: "Annullata",
};

export const consultationTypeLabels: Record<string, string> = {
  portfolio_review: "Revisione portafoglio",
  new_cover: "Nuova copertura",
  renewal: "Rinnovo",
  claim_support: "Supporto sinistro",
  other: "Altro",
};

export const offerStatusLabels: Record<string, string> = {
  draft: "Bozza",
  proposed: "Proposta",
  accepted: "Accettata",
  rejected: "Rifiutata",
  expired: "Scaduta",
  withdrawn: "Ritirata",
};

export const contractStatusLabels: Record<string, string> = {
  draft: "Bozza",
  pending: "In attesa",
  active: "Attivo",
  cancelled: "Annullato",
  expired: "Scaduto",
};

export const commissionStatusLabels: Record<string, string> = {
  expected: "Attesa",
  earned: "Maturata",
  invoiced: "Fatturata",
  paid: "Pagata",
  cancelled: "Annullata",
};

export const commissionTypeLabels: Record<string, string> = {
  acquisition: "Acquisizione",
  renewal: "Rinnovo",
  recurring: "Ricorrente",
  bonus: "Bonus",
  other: "Altro",
};

export const appointmentStatusLabels: Record<string, string> = {
  scheduled: "Pianificato",
  proposed: "Proposto",
  counter_proposed: "Controproposta",
  confirmed: "Confermato",
  completed: "Svolto",
  cancelled: "Annullato",
  no_show: "Non presentato",
};

export const appointmentChannelLabels: Record<string, string> = {
  video: "Video",
  phone: "Telefono",
  in_person: "In presenza",
  other: "Altro",
};

export const eventTypeLabels: Record<string, string> = {
  created: "Richiesta creata",
  request_submitted: "Richiesta inviata",
  "Request Submitted": "Richiesta inviata",
  consent_recorded: "Consenso registrato",
  resources_shared: "Risorse condivise",
  resource_revoked: "Accesso revocato",
  status_changed: "Stato aggiornato",
  broker_assigned: "Broker assegnato",
  broker_reassigned: "Broker riassegnato",
  broker_unassigned: "Broker rimosso",
  appointment_scheduled: "Appuntamento pianificato",
  appointment_confirmed: "Appuntamento confermato",
  appointment_completed: "Appuntamento svolto",
  appointment_cancelled: "Appuntamento annullato",
  offer_draft: "Offerta in bozza",
  offer_proposed: "Offerta proposta",
  offer_accepted: "Offerta accettata",
  offer_rejected: "Offerta rifiutata",
  contract_draft: "Contratto in bozza",
  contract_pending: "Contratto in attesa",
  contract_active: "Contratto attivo",
  commission_created: "Commissione registrata",
  commission_paid: "Commissione pagata",
  commission_clawback: "Clawback registrato",
  commission_adjusted: "Rettifica commissione",
  commission_status_changed: "Stato commissione aggiornato",
};

export const actorTypeLabels: Record<string, string> = {
  consumer: "Cliente",
  broker: "Broker",
  admin: "Admin",
  system: "Sistema",
};

export const contactMethodLabels: Record<string, string> = {
  email: "Email",
  phone: "Telefono",
};

export function consultationStatusLabel(value: string | null | undefined) {
  return labelOf(consultationStatusLabels, value);
}

export function consultationTypeLabel(value: string | null | undefined) {
  return labelOf(consultationTypeLabels, value);
}

export function offerStatusLabel(value: string | null | undefined) {
  return labelOf(offerStatusLabels, value);
}

export function contractStatusLabel(value: string | null | undefined) {
  return labelOf(contractStatusLabels, value);
}

export function commissionStatusLabel(value: string | null | undefined) {
  return labelOf(commissionStatusLabels, value);
}

export function commissionTypeLabel(value: string | null | undefined) {
  return labelOf(commissionTypeLabels, value);
}

export function appointmentStatusLabel(value: string | null | undefined) {
  return labelOf(appointmentStatusLabels, value);
}

export function appointmentChannelLabel(value: string | null | undefined) {
  return labelOf(appointmentChannelLabels, value);
}

export function eventTypeLabel(value: string | null | undefined) {
  return labelOf(eventTypeLabels, value);
}

export function actorTypeLabel(value: string | null | undefined) {
  return labelOf(actorTypeLabels, value);
}

export function contactMethodLabel(value: string | null | undefined) {
  return value ? labelOf(contactMethodLabels, value) : "Da concordare";
}

export const premiumFrequencyLabels: Record<string, string> = {
  annual: "Annuale",
  monthly: "Mensile",
  quarterly: "Trimestrale",
  semiannual: "Semestrale",
};

export function premiumFrequencyLabel(value: string | null | undefined) {
  return labelOf(premiumFrequencyLabels, value);
}

export function documentTypeLabel(value: string | null | undefined) {
  if (!value || value === "unknown") return "Da classificare";
  return fallback(value);
}
