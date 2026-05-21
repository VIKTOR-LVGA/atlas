export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          Piattaforma indipendente di analisi assicurativa
        </p>

        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
          Capisci davvero le tue assicurazioni.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Carica le tue polizze, organizza i documenti e scopri possibili
          doppioni, criticità e opportunità di ottimizzazione.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href="/dashboard"
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white"
          >
            Vai alla dashboard
          </a>

          <a
            href="#"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-900"
          >
            Guarda come funziona
          </a>
        </div>
      </section>
    </main>
  );
}