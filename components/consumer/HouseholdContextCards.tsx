export function HouseholdContextCards({
  ownerName,
}: {
  ownerName: string;
}) {
  return (
    <div className="grid gap-3">
      <section className="atlas-consumer-card px-5 py-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Il tuo nucleo familiare
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          I membri della famiglia potranno essere collegati alle polizze nella prossima fase.
        </p>
        <ul className="mt-4 divide-y divide-border-subtle">
          <li className="flex items-center justify-between py-3">
            <span>
              <span className="block text-[14px] font-medium text-foreground">{ownerName}</span>
              <span className="text-[12px] text-muted">Tu</span>
            </span>
            <span className="text-[11px] font-medium text-muted">Profilo attuale</span>
          </li>
          <li className="py-3">
            <p className="text-[14px] font-medium text-foreground">Partner</p>
            <p className="mt-0.5 text-[12px] text-muted">
              Non ancora disponibile. Nessun membro è stato creato.
            </p>
          </li>
          <li className="py-3">
            <p className="text-[14px] font-medium text-foreground">Figlio</p>
            <p className="mt-0.5 text-[12px] text-muted">
              Non ancora disponibile. Nessun membro è stato creato.
            </p>
          </li>
        </ul>
      </section>

      <section className="atlas-consumer-card px-5 py-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Casa</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Indirizzo, NPA e abitazione non sono ancora nel profilo. Potrai aggiungerli quando
          il modello dati sarà pronto.
        </p>
      </section>

      <section className="atlas-consumer-card px-5 py-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Veicoli</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          I veicoli non sono ancora un&apos;entità separata. Se hai una polizza auto, i dettagli
          restano sulla scheda polizza.
        </p>
      </section>
    </div>
  );
}
