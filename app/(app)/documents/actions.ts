"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { DocumentUploadError, uploadUserDocument } from "@/lib/documents";

export type UploadDocumentActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

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
    await uploadUserDocument(file);
    revalidatePath("/documents");

    return {
      status: "success",
      message: "Documento caricato.",
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
