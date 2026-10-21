"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, CloudUpload, LoaderCircle, ArrowRight, FileCheck2 } from "lucide-react";
import {
  uploadDocumentAction,
  type UploadDocumentActionState,
} from "@/app/(app)/documents/actions";
import Link from "next/link";
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
    <form action={formAction} className="space-y-4" aria-busy={pending}>
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
          "flex flex-col items-center rounded-[22px] border-2 border-dashed bg-[#f5f7fc] px-4 py-10 text-center transition",
          dragging
            ? "border-accent bg-accent-soft shadow-sm ring-4 ring-accent/20"
            : "border-border hover:border-border hover:bg-card-muted"
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
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <CloudUpload className="h-6 w-6" />
        </div>
        <p className="mt-3 text-[13px] font-semibold text-foreground">
          Carica la tua polizza
        </p>
        <p className="mt-1 text-[11px] text-muted">PDF fino a 10 MB · poi potrai controllare i dati estratti</p>
        <label
          htmlFor="policy-document-file"
          className="atlas-btn-primary mt-4 cursor-pointer px-5 py-2 text-[13px]"
        >
          Scegli un PDF
        </label>
        {selectedFileName && state.status !== "success" && (
          <p className="mt-3 max-w-full truncate text-[11px] font-medium text-muted">
            {selectedFileName}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="atlas-btn-primary w-full px-4 py-2 text-[13px] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Caricamento...
          </span>
        ) : (
          "Carica documento"
        )}
      </button>
      {pending && (
        <div className="space-y-1.5" role="progressbar" aria-label="Upload in corso">
          <div className="h-1.5 overflow-hidden rounded-full bg-accent-soft">
            <span className="block h-full w-2/3 animate-pulse rounded-full bg-accent" />
          </div>
          <p className="text-[11px] text-muted">Salvataggio nel tuo archivio privato.</p>
        </div>
      )}
      {state.status === "error" && (
        <p
          aria-live="polite"
          className="text-[11px] text-red-600"
        >
          {state.message}
        </p>
      )}
      {state.status === "success" && state.documentId && (
        <div role="status" className="rounded-2xl border border-[#b9d5f5] bg-[#f1f6ff] p-4">
          <p className="flex items-center gap-2 text-[13px] font-bold text-[#174ac5]"><FileCheck2 className="h-4 w-4" /> Passaggio 1 completato</p>
          <p className="mt-2 text-[12px] text-[#53647e]">Il PDF è salvato. Prosegui per avviare l’analisi, poi controlla i dati prima di confermare.</p>
          <Link href={`/documents/${state.documentId}`} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3157eb] px-4 py-3 text-[13px] font-bold text-white">Continua con l’analisi <ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}
      {state.status === "success" && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-2.5 rounded-xl border border-[var(--success-border)] bg-card px-4 py-3 text-[12px] font-medium text-foreground shadow-xl shadow-[var(--shadow-card)]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success-text)]">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          {state.message}
        </div>
      )}
    </form>
  );
}
