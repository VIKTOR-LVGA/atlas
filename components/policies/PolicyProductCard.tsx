import { Package } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { formatCHF } from "@/lib/utils";
import type { PolicyProductDetail } from "@/lib/types";

export function PolicyProductCard({ product }: { product: PolicyProductDetail }) {
  return (
    <article className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <Package className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-foreground">{product.name}</p>
          <p className="text-[11px] text-muted">
            {product.coverage_type ?? "Prodotto"}
          </p>
          {product.premium_amount != null ? (
            <p className="mt-1 text-[11px] font-medium text-foreground">
              {formatCHF(product.premium_amount)}
            </p>
          ) : null}
        </div>
      </div>
      <ConfidenceBadge confidence={product.confidence} uncertain={product.uncertain} />
    </article>
  );
}
