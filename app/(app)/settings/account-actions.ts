"use server";

import { revalidatePath } from "next/cache";
import { AccountWipeError, wipeCurrentUserPortfolio } from "@/lib/account-portfolio-wipe";
import { logout } from "@/app/(app)/actions";
const CONFIRMATION_PHRASE = "ELIMINA";

export type AccountDangerActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function wipePortfolioAction(
  _previousState: AccountDangerActionState,
  formData: FormData
): Promise<AccountDangerActionState> {
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (confirmation !== CONFIRMATION_PHRASE) {
    return {
      status: "error",
      message: `Digita ${CONFIRMATION_PHRASE} per confermare l'eliminazione dei dati.`,
    };
  }

  const signOutAfter = formData.get("sign_out") === "on";

  try {
    const result = await wipeCurrentUserPortfolio();

    revalidatePath("/", "layout");

    const summary = [
      `${result.policiesDeleted} polizza${result.policiesDeleted === 1 ? "" : "e"} eliminate`,
      `${result.documentsDeleted} documento${result.documentsDeleted === 1 ? "" : "i"} eliminati`,
    ].join(" · ");

    if (result.errors.length > 0) {
      return {
        status: "error",
        message: `${summary}. Alcuni elementi non sono stati rimossi: riprova o contatta il supporto.`,
      };
    }

    if (signOutAfter) {
      await logout();
    }

    return {
      status: "success",
      message: signOutAfter
        ? `${summary}. Sessione chiusa. Per eliminare anche il profilo, usa «Richiedi eliminazione profilo».`
        : `${summary}. I dati del portfolio sono stati rimossi.`,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof AccountWipeError
          ? error.message
          : "Eliminazione non riuscita. Riprova tra poco.",
    };
  }
}
