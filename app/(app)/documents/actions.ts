"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  analyzeCurrentUserDocument,
  DocumentAnalysisError,
} from "@/lib/document-analysis";
import {
  deleteCurrentUserDocument,
  DocumentManagementError,
  DocumentUploadError,
  uploadUserDocument,
} from "@/lib/documents";

export type UploadDocumentActionState = {
  status: "idle" | "success" | "error";
  message: string;
  documentId?: string;
};

export type DeleteDocumentActionState = UploadDocumentActionState;
export type AnalyzeDocumentActionState = UploadDocumentActionState;

export async function uploadDocumentAction(
  _previousState: UploadDocumentActionState,
  formData: FormData
): Promise<UploadDocumentActionState> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      status: "error",
      message: "Seleziona un PDF da caricare.",
    };
  }

  try {
    const document = await uploadUserDocument(file);
    revalidatePath("/documents");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: "Documento caricato con successo.",
      documentId: document.id,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof DocumentUploadError
          ? error.message
          : "Upload non riuscito. Riprova tra poco.",
    };
  }
}

export async function deleteDocumentAction(
  id: string,
  redirectTo: "/documents" | null,
  previousState: DeleteDocumentActionState,
  formData: FormData
): Promise<DeleteDocumentActionState> {
  void previousState;
  void formData;

  try {
    const deleted = await deleteCurrentUserDocument(id);

    if (!deleted) {
      return {
        status: "error",
        message: "Documento non trovato.",
      };
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof DocumentManagementError
          ? error.message
          : "Eliminazione non riuscita. Riprova tra poco.",
    };
  }

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath(`/documents/${id}`);

  if (redirectTo === "/documents") {
    redirect(redirectTo);
  }

  return {
    status: "success",
    message: "Documento eliminato.",
  };
}

export async function analyzeDocumentAction(
  id: string,
  _previousState: AnalyzeDocumentActionState,
  formData: FormData
): Promise<AnalyzeDocumentActionState> {
  void formData;

  let policyId: string;

  try {
    const policy = await analyzeCurrentUserDocument(id);
    policyId = policy.id;
  } catch (error) {
    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath(`/documents/${id}`);

    return {
      status: "error",
      message:
        error instanceof DocumentAnalysisError ||
        error instanceof DocumentManagementError
          ? error.message
          : "Analisi non riuscita. Riprova tra poco.",
    };
  }

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath("/policies");
  revalidatePath(`/documents/${id}`);
  redirect(`/policies/${policyId}`);
}
