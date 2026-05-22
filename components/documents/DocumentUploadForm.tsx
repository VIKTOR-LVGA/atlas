"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { IconUpload } from "@/components/icons";
import {
  uploadDocumentAction,
  type UploadDocumentActionState,
} from "@/app/(app)/documents/actions";
import { cn } from "@/lib/utils";

const initialState: UploadDocumentActionState = {
  status: "idle",
  message: "",
};

export function DocumentUploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [state, formAction, pending] = useActionState(
    uploadDocumentAction,
    initialState
  );

  useEffect(() => {
    if (state.status === "success" && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-3">
      <input
        ref={inputRef}
        id="policy-document-file"
        name="file"
        type="file"
        accept=".pdf,application/pdf"
        required
        className="sr-only"
        onChange={(event) => {
          setSelectedFileName(event.currentTarget.files?.[0]?.name ?? "");
        }}
      />
      <div
        className={cn(
          "flex flex-col items-center rounded-2xl border-2 border-dashed bg-slate-50/50 px-4 py-10 text-center transition-colors",
          dragging ? "border-blue-400 bg-blue-50/60" : "border-slate-200"
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);

          if (inputRef.current && event.dataTransfer.files.length > 0) {
            inputRef.current.files = event.dataTransfer.files;
            setSelectedFileName(event.dataTransfer.files[0]?.name ?? "");
          }
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <IconUpload className="h-6 w-6" />
        </div>
        <p className="mt-3 text-[13px] font-semibold text-slate-900">
          Trascina il PDF qui
        </p>
        <p className="mt-1 text-[11px] text-slate-500">Solo PDF, max 10 MB</p>
        <label
          htmlFor="policy-document-file"
          className="mt-4 cursor-pointer rounded-lg bg-blue-600 px-5 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
        >
          Seleziona PDF
        </label>
        {selectedFileName && (
          <p className="mt-3 max-w-full truncate text-[11px] font-medium text-slate-600">
            {selectedFileName}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700 disabled:cursor-wait disabled:border-blue-300 disabled:bg-blue-300"
      >
        {pending ? "Caricamento..." : "Carica documento"}
      </button>
      {state.message && (
        <p
          aria-live="polite"
          className={cn(
            "text-[11px]",
            state.status === "success" ? "text-emerald-700" : "text-red-600"
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
