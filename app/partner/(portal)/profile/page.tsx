import {
  OperationsHeader,
  OperationsPanel,
} from "@/components/operations/OperationsUi";
import { requireOperationsRole } from "@/lib/operations-access";
import { cantonLabel } from "@/lib/swiss-cantons";

export const metadata = { title: "Profilo | Partner" };

export default async function PartnerProfilePage() {
  const { broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");

  return (
    <>
      <OperationsHeader
        eyebrow="Account partner"
        title={broker.displayName}
        description="I campi di stato e ruolo non sono modificabili dal partner. Contatta ATLAS per variazioni strutturali."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Identità">
          <dl className="grid gap-3 text-[12px]">
            <div>
              <dt className="text-muted">Nome</dt>
              <dd className="font-medium">{broker.displayName}</dd>
            </div>
            <div>
              <dt className="text-muted">Società</dt>
              <dd>{broker.organizationName ?? broker.legalName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd>{broker.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Sito</dt>
              <dd>{broker.website ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Tipo partner</dt>
              <dd>{broker.partnerType ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">ID professionale</dt>
              <dd>{broker.professionalId ?? "—"}</dd>
            </div>
          </dl>
        </OperationsPanel>
        <OperationsPanel title="Territorio e lingue">
          <dl className="grid gap-3 text-[12px]">
            <div>
              <dt className="text-muted">Cantone principale</dt>
              <dd>{cantonLabel(broker.primaryCanton)}</dd>
            </div>
            <div>
              <dt className="text-muted">Cantoni serviti</dt>
              <dd>
                {(broker.servedCantons?.length ?? 0) > 0
                  ? broker.servedCantons!.map((c) => cantonLabel(c)).join(", ")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Lingue</dt>
              <dd>
                {(broker.languages?.length ?? 0) > 0
                  ? broker.languages!.join(", ")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Stato account</dt>
              <dd className="font-medium">{broker.active ? "Attivo" : "Sospeso"}</dd>
            </div>
            <div>
              <dt className="text-muted">Note professionali</dt>
              <dd className="whitespace-pre-wrap">{broker.experienceNotes ?? "—"}</dd>
            </div>
          </dl>
        </OperationsPanel>
      </div>
    </>
  );
}
