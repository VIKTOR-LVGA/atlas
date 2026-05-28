import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DashboardNextAction as NextActionModel } from "@/lib/dashboard-view";

type DashboardNextActionProps = {
  action: NextActionModel;
};

export function DashboardNextAction({ action }: DashboardNextActionProps) {
  return (
    <section className="atlas-action-strip flex flex-col gap-3 rounded-xl border border-accent/20 bg-accent-soft/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="atlas-section-eyebrow text-accent">Prossimo passo</p>
        <p className="mt-1 text-[15px] font-semibold text-foreground">{action.label}</p>
        <p className="mt-0.5 text-[12px] text-muted">{action.description}</p>
      </div>
      <Link
        href={action.href}
        className="atlas-btn-primary inline-flex shrink-0 items-center justify-center gap-1.5 px-4 py-2.5 text-[12px]"
      >
        Vai
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
