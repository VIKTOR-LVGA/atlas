"use client";

import { useState, useTransition } from "react";
import { dismissOpportunityAction, markOpportunitySeenAction } from "@/app/(app)/opportunities/actions";

export function OpportunityActions({ id, seen }: { id: string; seen: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [isSeen, setIsSeen] = useState(seen);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {!isSeen ? <button disabled={pending} type="button" onClick={() => startTransition(async () => {
        const result = await markOpportunitySeenAction(id);
        setMessage(result.message);
        if (result.ok) setIsSeen(true);
      })} className="text-[12px] font-medium text-accent">Segna come vista</button> : null}
      <button disabled={pending} type="button" onClick={() => startTransition(async () => {
        const result = await dismissOpportunityAction(id);
        setMessage(result.message);
      })} className="text-[12px] text-muted">Archivia</button>
      {message ? <span role="status" className="text-[11px] text-muted">{message}</span> : null}
    </div>
  );
}
