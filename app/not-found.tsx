import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
      <Link href="/" className="mb-8 inline-flex">
        <AtlasBrandLogo variant="stacked" />
      </Link>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <FileQuestion className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-[20px] font-semibold tracking-tight text-foreground">
        Pagina non trovata
      </h1>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
        Il contenuto che cerchi non esiste o non è più disponibile nel tuo account.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link href="/dashboard" className="atlas-btn-primary px-4 py-2.5 text-[13px]">
          Vai alla dashboard
        </Link>
        <Link href="/login" className="atlas-btn-secondary px-4 py-2.5 text-[13px]">
          Accedi
        </Link>
      </div>
    </div>
  );
}
