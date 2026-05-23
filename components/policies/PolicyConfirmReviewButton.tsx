"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import {
  confirmPolicyReviewAction,
  type ConfirmPolicyReviewActionState,
} from "@/app/(app)/policies/actions";

const initialState: ConfirmPolicyReviewActionState = {
  status: "idle",
  message: "",
};

export function PolicyConfirmReviewButton({ policyId }: { policyId: string }) {
  const [state, formAction, pending] = useActionState(
    confirmPolicyReviewAction.bind(null, policyId),
    initialState
  );

  return (
    <form action={formAction} className="inline-flex flex-col items-stretch gap-1">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
      >
        <Check className="h-4 w-4" />
        {pending ? "Conferma..." : "Conferma polizza"}
      </button>
      {state.status === "error" ? (
        <p aria-live="polite" className="text-[11px] text-red-600">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
