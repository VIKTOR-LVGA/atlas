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
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Oggi ATLAS mostra solo il profilo con cui hai effettuato l&apos;accesso.
          Partner, figli e altri membri arriveranno nella prossima fase.
        </p>
        <div className="mt-4 rounded-xl bg-card-muted px-4 py-3">
          <p className="text-[14px] font-medium text-foreground">{ownerName}</p>
          <p className="text-[12px] text-muted">Tu · profilo attuale</p>
        </div>
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
