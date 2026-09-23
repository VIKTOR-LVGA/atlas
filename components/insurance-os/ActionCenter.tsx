"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  dismissAttentionAction,
  resolveAttentionAction,
} from "@/app/(app)/atlas/actions";
import type { AttentionItem, AttentionPriority } from "@/lib/insurance-os/shared-types";
import { cn } from "@/lib/utils";

const priorityLabel: Record<AttentionPriority, string> = {
  important: "Importante",
  attention: "Da sistemare",
  info: "Informativo",
};

const priorityStyle: Record<AttentionPriority, string> = {
  important: "atlas-alert-warning",
  attention: "atlas-alert-info",
  info: "atlas-surface-muted text-muted",
};

const priorityWeight: Record<AttentionPriority, number> = {
  important: 0,
  attention: 1,
  info: 2,
};

function AttentionCard({
  item,
  onRemoved,
}: {
  item: AttentionItem;
  onRemoved: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: (id: string) => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn(item.id);
      if (result.ok) {
        onRemoved(item.id);
      } else {
        setError(result.error ?? "Operazione non riuscita.");
      }
    });
  };

  return (
    <li
      className={cn(
        "atlas-consumer-card atlas-consumer-press px-4 py-4 transition-opacity",
        pending && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[14px] font-semibold tracking-tight text-foreground">
          {item.title}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]",
            priorityStyle[item.priority]
          )}
        >
          {priorityLabel[item.priority]}
        </span>
      </div>

      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={item.ctaHref} className="text-[13px] font-medium text-accent">
          {item.ctaLabel}
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(resolveAttentionAction)}
          className="text-[12px] font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        >
          Fatto
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(dismissAttentionAction)}
          className="text-[12px] text-muted transition hover:text-foreground disabled:opacity-50"
        >
          Non mi interessa
        </button>
        {error ? (
          <span role="status" className="text-[11px] text-[var(--danger-text)]">
            {error}
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function ActionCenter({
  items,
  limit,
  emptyMessage = "Nessun elemento richiede attenzione in questo momento.",
}: {
  items: AttentionItem[];
  limit?: number;
  emptyMessage?: string;
}) {
  const [removed, setRemoved] = useState<string[]>([]);

  const visible = items
    .filter((item) => !removed.includes(item.id))
    .sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority])
    .slice(0, limit ?? items.length);

  if (visible.length === 0) {
    return (
      <p className="atlas-consumer-card px-4 py-5 text-[13px] leading-relaxed text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {visible.map((item) => (
        <AttentionCard
          key={item.id}
          item={item}
          onRemoved={(id) => setRemoved((prev) => [...prev, id])}
        />
      ))}
    </ul>
  );
}
