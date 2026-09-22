import {
  OperationsMetric,
  OperationsPanel,
  formatChf,
  formatDate,
} from "@/components/operations/OperationsUi";
import {
  PartnerBadge,
  PartnerPageIntro,
} from "@/components/partner/PartnerEmptyState";
import { PartnerHeroArtwork } from "@/components/partner/PartnerVisuals";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import { requireOperationsRole } from "@/lib/operations-access";
import { cantonLabel } from "@/lib/swiss-cantons";

export const metadata = { title: "Profilo | Partner" };

export default async function PartnerProfilePage() {
  const { broker, supabase } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");

  const [{ data: brokerRow }, workspace] = await Promise.all([
    supabase
      .from("brokers")
      .select("created_at, phone, active")
      .eq("id", broker.id)
      .maybeSingle(),
    getBrokerWorkspace().catch(() => null),
  ]);

  return (
    <>
      <PartnerPageIntro
        area="profile"
        eyebrow="Account partner"
        title={broker.displayName}
        description="I campi di stato e ruolo non sono modificabili dal partner. Contatta ATLAS per variazioni strutturali."
        actions={<PartnerHeroArtwork area="profile" className="!block h-20 w-24" />}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <PartnerBadge tone={broker.active ? "success" : "danger"}>
          {broker.active ? "Attivo" : "Sospeso"}
        </PartnerBadge>
        {broker.partnerType ? (
          <PartnerBadge tone="neutral">{broker.partnerType}</PartnerBadge>
        ) : null}
        {broker.primaryCanton ? (
          <PartnerBadge tone="accent">
            {cantonLabel(broker.primaryCanton)}
          </PartnerBadge>
        ) : null}
      </div>

      {workspace ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OperationsMetric
            label="Lead assegnati"
            value={String(workspace.leads.length)}
          />
          <OperationsMetric
            label="Contratti"
            value={String(workspace.contracts.length)}
          />
          <OperationsMetric
            label="Ricavo netto"
            value={formatChf(workspace.revenue.netBrokerRevenue)}
          />
          <OperationsMetric
            label="Attese"
            value={formatChf(workspace.revenue.expectedShare)}
          />
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Identità">
          <dl className="grid gap-3.5 text-[12px]">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted">Nome</dt>
              <dd className="mt-0.5 font-medium">{broker.displayName}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted">Società</dt>
              <dd className="mt-0.5">{broker.organizationName ?? broker.legalName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted">Email</dt>
              <dd className="mt-0.5">{broker.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted">Telefono</dt>
              <dd className="mt-0.5">
                {brokerRow?.phone ? String(brokerRow.phone) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted">Sito</dt>
              <dd className="mt-0.5">{broker.website ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted">
                ID professionale
              </dt>
              <dd className="mt-0.5">{broker.professionalId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted">
                Attivazione
              </dt>
              <dd className="mt-0.5">
                {brokerRow?.created_at ? formatDate(String(brokerRow.created_at)) : "—"}
              </dd>
            </div>
          </dl>
        </OperationsPanel>

        <div className="space-y-5">
          <OperationsPanel title="Territorio e lingue">
            <dl className="grid gap-3.5 text-[12px]">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted">
                  Cantone principale
                </dt>
                <dd className="mt-0.5">{cantonLabel(broker.primaryCanton)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted">
                  Cantoni serviti
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {(broker.servedCantons?.length ?? 0) > 0 ? (
                    broker.servedCantons!.map((c) => (
                      <PartnerBadge key={c} tone="neutral">
                        {cantonLabel(c)}
                      </PartnerBadge>
                    ))
                  ) : (
                    <span>—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted">Lingue</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {(broker.languages?.length ?? 0) > 0 ? (
                    broker.languages!.map((lang) => (
                      <PartnerBadge key={lang} tone="accent">
                        {lang}
                      </PartnerBadge>
                    ))
                  ) : (
                    <span>—</span>
                  )}
                </dd>
              </div>
            </dl>
          </OperationsPanel>

          <OperationsPanel title="Trust & note">
            <dl className="grid gap-3.5 text-[12px]">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted">
                  Stato operativo
                </dt>
                <dd className="mt-0.5">
                  {broker.active
                    ? "Profilo attivo — accesso completo al portale partner."
                    : "Profilo sospeso — contatta ATLAS."}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted">
                  Note professionali
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-muted">
                  {broker.experienceNotes ?? "Nessuna nota registrata."}
                </dd>
              </div>
            </dl>
          </OperationsPanel>
        </div>
      </div>
    </>
  );
}
