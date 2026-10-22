"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function requestAccountDeletionAction() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { error: insertError } = await supabase.from("insura_deletion_requests")
    .upsert({user_id:user.id,status:"pending"}, {onConflict:"user_id",ignoreDuplicates:true});
  if (insertError) redirect("/settings?deletion=error");
  revalidatePath("/settings");
  redirect("/settings?deletion=requested");
}
