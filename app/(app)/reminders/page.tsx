import Link from "next/link";
import { getCurrentUserPolicies } from "@/lib/policies";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const policies = await getCurrentUserPolicies();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dates = policies.flatMap((policy) => {
    if (policy.requiresReview) return [];
    return [
      { label: "Rinnovo", date: policy.renewalDate },
      { label: "Fine contratto", date: policy.endDate },
    ].filter((item): item is {label: string; date: string} => Boolean(item.date))
      .map((item) => ({ ...item, id: policy.id, provider: policy.provider }));
  }).filter((item) => item.date >= today).sort((a,b) => a.date.localeCompare(b.date));
  return <PageShell>
    <PageHeader title="Scadenze" description="Date future delle polizze confermate. Nessuna notifica automatica è ancora attiva." />
    <div className="space-y-3">
      {dates.length === 0 && <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted">Nessuna data futura confermata. Controlla le tue polizze per aggiungere o confermare le date.</p>}
      {dates.map((item) => <Link key={item.id + item.label + item.date} href={`/policies/${item.id}`} className="block rounded-xl border border-border bg-card p-4 hover:border-accent">
        <p className="text-xs font-semibold text-accent">{item.label} · {item.date}</p>
        <p className="mt-1 font-semibold">{item.provider}</p>
        <p className="mt-1 text-xs text-muted">Verifica sempre i termini di disdetta sul contratto originale.</p>
      </Link>)}
    </div>
  </PageShell>;
}
