import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
export const dynamic = "force-dynamic";
export default async function ActivityPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = user ? await supabase.from("insura_operational_events")
    .select("event_type,duration_ms,created_at").eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).limit(1000) : {data:null,error:null};
  const events = data ?? [];
  const count = (type:string) => events.filter((event) => event.event_type === type).length;
  const durations = events.filter((event) => event.event_type === "analysis_ok").map((event) => event.duration_ms);
  const avg = durations.length ? Math.round(durations.reduce((a,b)=>a+b,0)/durations.length/1000) : null;
  return <PageShell><PageHeader title="Attività tecnica" description="Eventi del tuo account negli ultimi 30 giorni. Nessun contenuto dei documenti viene registrato in questi eventi." />
    {error ? <p className="text-sm text-muted">Statistiche temporaneamente non disponibili.</p> :
    <div className="grid grid-cols-2 gap-3">
      {[["PDF caricati",count("upload_ok")],["Upload falliti",count("upload_failed")],["Analisi riuscite",count("analysis_ok")],["Analisi fallite",count("analysis_failed")],["Tempo medio analisi",avg === null ? "—" : avg+" s"]].map(([label,value])=>
      <div key={String(label)} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}
    </div>}
    <p className="mt-4 text-xs text-muted">I costi effettivi API non sono mostrati: servono i dati di fatturazione del fornitore. Questa pagina non è un pannello di spesa.</p>
  </PageShell>;
}
