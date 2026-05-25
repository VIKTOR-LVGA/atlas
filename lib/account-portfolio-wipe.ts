import "server-only";

import { deleteCurrentUserDocument } from "@/lib/documents";
import { deletePolicy } from "@/lib/policies";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export class AccountWipeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountWipeError";
  }
}

export type PortfolioWipeResult = {
  policiesDeleted: number;
  documentsDeleted: number;
  correctionsDeleted: number;
  errors: string[];
};

export async function wipeCurrentUserPortfolio(): Promise<PortfolioWipeResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AccountWipeError("Accedi di nuovo per eliminare i dati.");
  }

  const result: PortfolioWipeResult = {
    policiesDeleted: 0,
    documentsDeleted: 0,
    correctionsDeleted: 0,
    errors: [],
  };

  const { data: policies, error: policiesError } = await supabase
    .from("policies")
    .select("id")
    .eq("user_id", user.id);

  if (policiesError) {
    throw new AccountWipeError("Impossibile leggere le polizze da eliminare.");
  }

  for (const policy of policies ?? []) {
    try {
      const deleted = await deletePolicy(policy.id);
      if (deleted) {
        result.policiesDeleted += 1;
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : "Errore eliminazione polizza."
      );
    }
  }

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", user.id);

  if (documentsError) {
    throw new AccountWipeError("Impossibile leggere i documenti da eliminare.");
  }

  for (const document of documents ?? []) {
    try {
      const deleted = await deleteCurrentUserDocument(document.id);
      if (deleted) {
        result.documentsDeleted += 1;
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : "Errore eliminazione documento."
      );
    }
  }

  const { count: correctionsCount } = await supabase
    .from("extraction_corrections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (correctionsCount && correctionsCount > 0) {
    const { error: correctionsError } = await supabase
      .from("extraction_corrections")
      .delete()
      .eq("user_id", user.id);

    if (correctionsError) {
      result.errors.push("Alcune correzioni estrazione non sono state rimosse.");
    } else {
      result.correctionsDeleted = correctionsCount;
    }
  }

  return result;
}
