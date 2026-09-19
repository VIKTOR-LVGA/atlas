"use server";

import { revalidatePath } from "next/cache";
import {
  createFamilyMember,
  createProperty,
  createVehicle,
  deleteFamilyMember,
  deleteProperty,
  deleteVehicle,
  getCurrentHouseholdContext,
  HouseholdDataError,
  updateFamilyMember,
  updateProperty,
  updateVehicle,
  type FamilyMemberInput,
  type PropertyInput,
  type VehicleInput,
} from "@/lib/household";

export type HouseholdActionResult<T = null> = {
  ok: boolean;
  message: string;
  data: T | null;
};

async function run<T>(operation: () => Promise<T>, success: string): Promise<HouseholdActionResult<T>> {
  try {
    const data = await operation();
    revalidatePath("/settings");
    return { ok: true, message: success, data };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof HouseholdDataError ? error.message : "Operazione non riuscita.",
      data: null,
    };
  }
}

export async function listHouseholdContextAction() {
  return run(getCurrentHouseholdContext, "Dati aggiornati.");
}
export async function saveFamilyMemberAction(id: string | null, input: FamilyMemberInput) {
  return run(() => id ? updateFamilyMember(id, input) : createFamilyMember(input), id ? "Membro aggiornato." : "Membro aggiunto.");
}
export async function removeFamilyMemberAction(id: string) {
  return run(() => deleteFamilyMember(id), "Membro eliminato.");
}
export async function savePropertyAction(id: string | null, input: PropertyInput) {
  return run(() => id ? updateProperty(id, input) : createProperty(input), id ? "Abitazione aggiornata." : "Abitazione aggiunta.");
}
export async function removePropertyAction(id: string) {
  return run(() => deleteProperty(id), "Abitazione eliminata.");
}
export async function saveVehicleAction(id: string | null, input: VehicleInput) {
  return run(() => id ? updateVehicle(id, input) : createVehicle(input), id ? "Veicolo aggiornato." : "Veicolo aggiunto.");
}
export async function removeVehicleAction(id: string) {
  return run(() => deleteVehicle(id), "Veicolo eliminato.");
}
