"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import {
  deletePolicyAction,
  type DeletePolicyActionState,
} from "@/app/(app)/policies/actions";

const initialState: DeletePolicyActionState = {
  status: "idle",
  message: "",
};

export function PolicyDeleteForm({ policyId }: { policyId: string }) {
  const [state, formAction, pending] = useActionState(
    deletePolicyAction.bind(null, policyId, true),
    initialState
  );

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (!window.confirm("Eliminare questa polizza manuale?")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--danger-border)] bg-card px-4 py-2.5 text-[13px] font-medium text-[var(--danger-text)] hover:bg-[var(--danger-bg)] disabled:cursor-wait disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
        {pending ? "Eliminazione..." : "Elimina polizza"}
      </button>
      {state.status === "error" && (
        <p aria-live="polite" className="text-[11px] text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
