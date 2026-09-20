import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FamilyMember,
  FamilyRelationship,
  InsuredProperty,
  Vehicle,
} from "@/lib/types";

export type FamilyMemberInput = {
  firstName: string;
  lastName?: string | null;
  relationship: FamilyRelationship;
  birthDate?: string | null;
  gender?: string | null;
  isPolicyHolder?: boolean;
  notes?: string | null;
};

export type PropertyInput = {
  label: string;
  propertyType: InsuredProperty["propertyType"];
  occupancyType: InsuredProperty["occupancyType"];
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  canton?: string | null;
  country?: string;
  householdSize?: number | null;
  notes?: string | null;
};

export type VehicleInput = {
  label: string;
  vehicleType: Vehicle["vehicleType"];
  make?: string | null;
  model?: string | null;
  year?: number | null;
  licensePlate?: string | null;
  canton?: string | null;
  ownershipType?: Vehicle["ownershipType"];
  firstRegistrationDate?: string | null;
  notes?: string | null;
};

export class HouseholdDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HouseholdDataError";
  }
}

function clean(value?: string | null, max = 240) {
  const normalized = value?.trim() || null;
  return normalized?.slice(0, max) ?? null;
}

function validDate(value?: string | null) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HouseholdDataError("Data non valida.");
  }
  return value;
}

async function context() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new HouseholdDataError("Accedi di nuovo per continuare.");
  return { supabase, user };
}

function toFamilyMember(row: Record<string, unknown>): FamilyMember {
  return {
    id: String(row.id),
    firstName: String(row.first_name),
    lastName: row.last_name ? String(row.last_name) : null,
    relationship: row.relationship as FamilyRelationship,
    birthDate: row.birth_date ? String(row.birth_date) : null,
    gender: row.gender ? String(row.gender) : null,
    isPolicyHolder: Boolean(row.is_policy_holder),
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toProperty(row: Record<string, unknown>): InsuredProperty {
  return {
    id: String(row.id),
    label: String(row.label),
    propertyType: row.property_type as InsuredProperty["propertyType"],
    occupancyType: row.occupancy_type as InsuredProperty["occupancyType"],
    street: row.street ? String(row.street) : null,
    postalCode: row.postal_code ? String(row.postal_code) : null,
    city: row.city ? String(row.city) : null,
    canton: row.canton ? String(row.canton) : null,
    country: String(row.country || "CH"),
    householdSize: row.household_size === null ? null : Number(row.household_size),
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: String(row.id),
    label: String(row.label),
    vehicleType: row.vehicle_type as Vehicle["vehicleType"],
    make: row.make ? String(row.make) : null,
    model: row.model ? String(row.model) : null,
    year: row.year === null ? null : Number(row.year),
    licensePlate: row.license_plate ? String(row.license_plate) : null,
    canton: row.canton ? String(row.canton) : null,
    ownershipType: (row.ownership_type as Vehicle["ownershipType"]) ?? null,
    firstRegistrationDate: row.first_registration_date ? String(row.first_registration_date) : null,
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listFamilyMembers() {
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("family_members").select("*").eq("user_id", user.id).order("created_at");
  if (error) throw new HouseholdDataError("Nucleo familiare non disponibile.");
  return (data ?? []).map((row) => toFamilyMember(row));
}

export async function createFamilyMember(input: FamilyMemberInput) {
  const firstName = clean(input.firstName, 120);
  if (!firstName) throw new HouseholdDataError("Inserisci il nome.");
  if (!["self", "partner", "child", "other"].includes(input.relationship)) {
    throw new HouseholdDataError("Relazione non valida.");
  }
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("family_members").insert({
    user_id: user.id,
    first_name: firstName,
    last_name: clean(input.lastName, 120),
    relationship: input.relationship,
    birth_date: validDate(input.birthDate),
    gender: clean(input.gender, 40),
    is_policy_holder: Boolean(input.isPolicyHolder),
    notes: clean(input.notes, 4000),
  }).select("*").single();
  if (error || !data) throw new HouseholdDataError("Membro non salvato.");
  return toFamilyMember(data);
}

export async function updateFamilyMember(id: string, input: FamilyMemberInput) {
  const firstName = clean(input.firstName, 120);
  if (!firstName) throw new HouseholdDataError("Inserisci il nome.");
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("family_members").update({
    first_name: firstName,
    last_name: clean(input.lastName, 120),
    relationship: input.relationship,
    birth_date: validDate(input.birthDate),
    gender: clean(input.gender, 40),
    is_policy_holder: Boolean(input.isPolicyHolder),
    notes: clean(input.notes, 4000),
  }).eq("id", id).eq("user_id", user.id).select("*").maybeSingle();
  if (error || !data) throw new HouseholdDataError("Membro non aggiornato.");
  return toFamilyMember(data);
}

export async function deleteFamilyMember(id: string) {
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("family_members").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
  if (error || !data) throw new HouseholdDataError("Membro non eliminato.");
  return true;
}

export async function listProperties() {
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("properties").select("*").eq("user_id", user.id).order("created_at");
  if (error) throw new HouseholdDataError("Abitazioni non disponibili.");
  return (data ?? []).map((row) => toProperty(row));
}

function normalizeProperty(input: PropertyInput) {
  const label = clean(input.label, 120);
  if (!label) throw new HouseholdDataError("Inserisci un nome per l'abitazione.");
  const householdSize = input.householdSize ?? null;
  if (householdSize !== null && (!Number.isInteger(householdSize) || householdSize < 1 || householdSize > 100)) {
    throw new HouseholdDataError("Numero persone non valido.");
  }
  return {
    label,
    property_type: input.propertyType,
    occupancy_type: input.occupancyType,
    street: clean(input.street, 240),
    postal_code: clean(input.postalCode, 20),
    city: clean(input.city, 120),
    canton: clean(input.canton, 40),
    country: clean(input.country, 2)?.toUpperCase() || "CH",
    household_size: householdSize,
    notes: clean(input.notes, 4000),
  };
}

export async function createProperty(input: PropertyInput) {
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("properties").insert({ user_id: user.id, ...normalizeProperty(input) }).select("*").single();
  if (error || !data) throw new HouseholdDataError("Abitazione non salvata.");
  return toProperty(data);
}

export async function updateProperty(id: string, input: PropertyInput) {
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("properties").update(normalizeProperty(input)).eq("id", id).eq("user_id", user.id).select("*").maybeSingle();
  if (error || !data) throw new HouseholdDataError("Abitazione non aggiornata.");
  return toProperty(data);
}

export async function deleteProperty(id: string) {
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("properties").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
  if (error || !data) throw new HouseholdDataError("Abitazione non eliminata.");
  return true;
}

export async function listVehicles() {
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at");
  if (error) throw new HouseholdDataError("Veicoli non disponibili.");
  return (data ?? []).map((row) => toVehicle(row));
}

function normalizeVehicle(input: VehicleInput) {
  const label = clean(input.label, 120);
  if (!label) throw new HouseholdDataError("Inserisci un nome per il veicolo.");
  const year = input.year ?? null;
  if (year !== null && (!Number.isInteger(year) || year < 1886 || year > 2200)) {
    throw new HouseholdDataError("Anno non valido.");
  }
  return {
    label,
    vehicle_type: input.vehicleType,
    make: clean(input.make, 120),
    model: clean(input.model, 120),
    year,
    license_plate: clean(input.licensePlate, 40)?.toUpperCase() ?? null,
    canton: clean(input.canton, 40)?.toUpperCase() ?? null,
    ownership_type: input.ownershipType ?? null,
    first_registration_date: validDate(input.firstRegistrationDate),
    notes: clean(input.notes, 4000),
  };
}

export async function createVehicle(input: VehicleInput) {
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("vehicles").insert({ user_id: user.id, ...normalizeVehicle(input) }).select("*").single();
  if (error || !data) throw new HouseholdDataError("Veicolo non salvato.");
  return toVehicle(data);
}

export async function updateVehicle(id: string, input: VehicleInput) {
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("vehicles").update(normalizeVehicle(input)).eq("id", id).eq("user_id", user.id).select("*").maybeSingle();
  if (error || !data) throw new HouseholdDataError("Veicolo non aggiornato.");
  return toVehicle(data);
}

export async function deleteVehicle(id: string) {
  const { supabase, user } = await context();
  const { data, error } = await supabase.from("vehicles").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
  if (error || !data) throw new HouseholdDataError("Veicolo non eliminato.");
  return true;
}

export async function getCurrentHouseholdContext() {
  const [familyMembers, properties, vehicles] = await Promise.all([
    listFamilyMembers(),
    listProperties(),
    listVehicles(),
  ]);
  return { familyMembers, properties, vehicles };
}
