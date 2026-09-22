/** Deterministic partner workspace helpers — no AI, no invented metrics. */

export const PARTNER_PIPELINE_STAGES = [
  { id: "assigned", label: "Nuovo", statuses: ["assigned", "submitted"] },
  { id: "contacted", label: "Contattato", statuses: ["contacted"] },
  {
    id: "appointment",
    label: "Appuntamento",
    statuses: ["consultation_scheduled"],
  },
  { id: "in_review", label: "In analisi", statuses: ["in_review"] },
  { id: "quoted", label: "Offerta", statuses: ["quoted"] },
  { id: "won", label: "Vinto", statuses: ["won", "completed"] },
  { id: "lost", label: "Perso", statuses: ["lost", "cancelled"] },
] as const;

export type PartnerPriority = {
  id: string;
  clientName: string;
  reason: string;
  dueLabel: string | null;
  href: string;
  tone: "urgent" | "soon" | "info";
};

export type PartnerActivityItem = {
  id: string;
  title: string;
  detail: string;
  at: string;
  href: string;
};

function startOfDayZurich(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

export function formatPartnerTodayLabel(date = new Date()) {
  return new Intl.DateTimeFormat("it-CH", {
    timeZone: "Europe/Zurich",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function partnerGreetingHour(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Zurich",
      hour: "numeric",
      hour12: false,
    }).format(date)
  );
  if (hour < 12) return "Buongiorno";
  if (hour < 18) return "Buon pomeriggio";
  return "Buonasera";
}

export function daysBetween(iso: string, now = new Date()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((now.getTime() - then) / (1000 * 60 * 60 * 24));
}

export function deriveNextAction(status: string): string {
  switch (status) {
    case "assigned":
    case "submitted":
      return "Contattare il cliente";
    case "contacted":
      return "Fissare un appuntamento";
    case "consultation_scheduled":
      return "Preparare l'appuntamento";
    case "in_review":
      return "Preparare un'offerta";
    case "quoted":
      return "Follow-up sull'offerta";
    case "won":
    case "completed":
      return "Nessuna azione urgente";
    case "lost":
    case "cancelled":
      return "Chiusa";
    default:
      return "Verificare lo stato";
  }
}

type LeadLike = {
  id: string;
  clientName: string;
  status: string;
  updatedAt: string;
};

type AppointmentLike = {
  id: string;
  consultation_request_id: string;
  scheduled_at: string;
  status: string;
  clientName?: string;
};

type OfferLike = {
  id: string;
  consultation_request_id: string;
  status: string;
  created_at: string;
  proposed_at?: string | null;
  insurer: string;
  clientName?: string;
};

export function buildTodayPriorities(input: {
  leads: LeadLike[];
  appointments: AppointmentLike[];
  offers: OfferLike[];
  now?: Date;
}): PartnerPriority[] {
  const now = input.now ?? new Date();
  const today = startOfDayZurich(now);
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrow = startOfDayZurich(tomorrowDate);
  const items: PartnerPriority[] = [];

  for (const lead of input.leads) {
    if (lead.status === "assigned" || lead.status === "submitted") {
      items.push({
        id: `contact-${lead.id}`,
        clientName: lead.clientName,
        reason: "Nuova richiesta da contattare",
        dueLabel: "Oggi",
        href: `/partner/leads/${lead.id}`,
        tone: "urgent",
      });
    }
    if (lead.status === "quoted" && daysBetween(lead.updatedAt, now) >= 5) {
      items.push({
        id: `followup-${lead.id}`,
        clientName: lead.clientName,
        reason: `Offerta inviata ${daysBetween(lead.updatedAt, now)} giorni fa`,
        dueLabel: "Follow-up",
        href: `/partner/leads/${lead.id}`,
        tone: "soon",
      });
    }
  }

  for (const appt of input.appointments) {
    if (["cancelled", "completed", "no_show"].includes(appt.status)) continue;
    const day = startOfDayZurich(new Date(appt.scheduled_at));
    if (day === today) {
      items.push({
        id: `appt-today-${appt.id}`,
        clientName: appt.clientName ?? "Cliente",
        reason: "Appuntamento di oggi",
        dueLabel: new Intl.DateTimeFormat("it-CH", {
          timeZone: "Europe/Zurich",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(appt.scheduled_at)),
        href: `/partner/leads/${appt.consultation_request_id}`,
        tone: "urgent",
      });
    } else if (day === tomorrow) {
      items.push({
        id: `appt-tomorrow-${appt.id}`,
        clientName: appt.clientName ?? "Cliente",
        reason: "Appuntamento domani",
        dueLabel: "Domani",
        href: `/partner/leads/${appt.consultation_request_id}`,
        tone: "soon",
      });
    }
  }

  for (const offer of input.offers) {
    if (offer.status === "proposed") {
      const stamp = offer.proposed_at ?? offer.created_at;
      if (daysBetween(stamp, now) >= 7) {
        items.push({
          id: `offer-${offer.id}`,
          clientName: offer.clientName ?? offer.insurer,
          reason: "Offerta senza risposta da oltre 7 giorni",
          dueLabel: "Follow-up",
          href: `/partner/leads/${offer.consultation_request_id}`,
          tone: "soon",
        });
      }
    }
  }

  const rank = { urgent: 0, soon: 1, info: 2 };
  return items
    .sort((a, b) => rank[a.tone] - rank[b.tone])
    .slice(0, 12);
}

export function pipelineStageCounts(leads: LeadLike[]) {
  const total = leads.length || 1;
  return PARTNER_PIPELINE_STAGES.map((stage) => {
    const count = leads.filter((lead) =>
      (stage.statuses as readonly string[]).includes(lead.status)
    ).length;
    return {
      ...stage,
      count,
      pct: Math.round((count / total) * 1000) / 10,
    };
  });
}
