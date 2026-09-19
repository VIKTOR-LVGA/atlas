"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  listHouseholdContextAction,
  removeFamilyMemberAction,
  removePropertyAction,
  removeVehicleAction,
  saveFamilyMemberAction,
  savePropertyAction,
  saveVehicleAction,
} from "@/app/(app)/settings/household-actions";
import type { FamilyMember, InsuredProperty, Vehicle } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent";

type HouseholdData = {
  familyMembers: FamilyMember[];
  properties: InsuredProperty[];
  vehicles: Vehicle[];
};

const empty: HouseholdData = { familyMembers: [], properties: [], vehicles: [] };

export function HouseholdContextCards({ ownerName }: { ownerName: string }) {
  const [data, setData] = useState<HouseholdData>(empty);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [familyForm, setFamilyForm] = useState<FamilyMember | "new" | null>(null);
  const [propertyForm, setPropertyForm] = useState<InsuredProperty | "new" | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Vehicle | "new" | null>(null);

  const refresh = useCallback(async () => {
    const result = await listHouseholdContextAction();
    if (result.ok && result.data) setData(result.data);
    else setMessage(result.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void listHouseholdContextAction().then((result) => {
      if (!active) return;
      if (result.ok && result.data) setData(result.data);
      else setMessage(result.message);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function complete(result: { ok: boolean; message: string }) {
    setMessage(result.message);
    if (result.ok) {
      setFamilyForm(null);
      setPropertyForm(null);
      setVehicleForm(null);
      void refresh();
    }
  }

  return (
    <div className="grid gap-3" aria-busy={loading || pending}>
      {message ? <p role="status" className="rounded-lg bg-card-muted px-3 py-2 text-[12px] text-muted">{message}</p> : null}

      <section className="atlas-consumer-card px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Il tuo nucleo familiare</h2>
            <p className="mt-1 text-[12px] text-muted">Il profilo principale resta la fonte per i tuoi dati; qui aggiungi le altre persone assicurate.</p>
          </div>
          <button type="button" onClick={() => setFamilyForm("new")} className="atlas-btn-secondary px-3 py-2 text-[12px]">Aggiungi persona</button>
        </div>
        <div className="mt-4 rounded-xl bg-card-muted px-4 py-3">
          <p className="text-[14px] font-medium text-foreground">{ownerName}</p>
          <p className="text-[12px] text-muted">Tu · profilo principale</p>
        </div>
        <ul className="mt-2 space-y-2">
          {data.familyMembers.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle px-4 py-3">
              <div><p className="text-[13px] font-medium text-foreground">{member.firstName} {member.lastName}</p><p className="text-[11px] text-muted">{member.relationship}</p></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setFamilyForm(member)} className="text-[12px] font-medium text-accent">Modifica</button>
                <button type="button" onClick={() => startTransition(async () => complete(await removeFamilyMemberAction(member.id)))} className="text-[12px] text-muted">Elimina</button>
              </div>
            </li>
          ))}
        </ul>
        {familyForm ? (
          <form className="mt-4 grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            startTransition(async () => complete(await saveFamilyMemberAction(familyForm === "new" ? null : familyForm.id, {
              firstName: String(form.get("first_name") || ""),
              lastName: String(form.get("last_name") || ""),
              relationship: String(form.get("relationship")) as FamilyMember["relationship"],
              birthDate: String(form.get("birth_date") || "") || null,
              isPolicyHolder: form.get("is_policy_holder") === "on",
            })));
          }}>
            <label className="text-[12px] text-muted">Nome<input aria-label="Nome persona" name="first_name" required defaultValue={familyForm === "new" ? "" : familyForm.firstName} className={inputClass} /></label>
            <label className="text-[12px] text-muted">Cognome<input aria-label="Cognome persona" name="last_name" defaultValue={familyForm === "new" ? "" : familyForm.lastName ?? ""} className={inputClass} /></label>
            <label className="text-[12px] text-muted">Relazione<select aria-label="Relazione" name="relationship" defaultValue={familyForm === "new" ? "partner" : familyForm.relationship} className={inputClass}><option value="partner">Partner</option><option value="child">Figlio/a</option><option value="other">Altro</option><option value="self">Self</option></select></label>
            <label className="text-[12px] text-muted">Data di nascita<input aria-label="Data di nascita persona" name="birth_date" type="date" defaultValue={familyForm === "new" ? "" : familyForm.birthDate ?? ""} className={inputClass} /></label>
            <label className="flex items-center gap-2 text-[12px] text-muted"><input name="is_policy_holder" type="checkbox" defaultChecked={familyForm !== "new" && familyForm.isPolicyHolder} />Intestatario di polizza</label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setFamilyForm(null)} className="atlas-btn-secondary px-3 py-2 text-[12px]">Annulla</button><button disabled={pending} className="atlas-btn-primary px-3 py-2 text-[12px]">Salva persona</button></div>
          </form>
        ) : null}
      </section>

      <section className="atlas-consumer-card px-5 py-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-[15px] font-semibold tracking-tight text-foreground">Casa</h2><p className="mt-1 text-[12px] text-muted">Abitazioni rilevanti per le tue coperture.</p></div><button type="button" onClick={() => setPropertyForm("new")} className="atlas-btn-secondary px-3 py-2 text-[12px]">Aggiungi casa</button></div>
        <ul className="mt-3 space-y-2">{data.properties.map((property) => <li key={property.id} className="flex items-center justify-between gap-3 rounded-xl bg-card-muted px-4 py-3"><div><p className="text-[13px] font-medium text-foreground">{property.label}</p><p className="text-[11px] text-muted">{[property.street, property.postalCode, property.city].filter(Boolean).join(", ") || `${property.propertyType} · ${property.occupancyType}`}</p></div><div className="flex gap-2"><button type="button" onClick={() => setPropertyForm(property)} className="text-[12px] font-medium text-accent">Modifica</button><button type="button" onClick={() => startTransition(async () => complete(await removePropertyAction(property.id)))} className="text-[12px] text-muted">Elimina</button></div></li>)}</ul>
        {propertyForm ? <form className="mt-4 grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2" onSubmit={(event) => {
          event.preventDefault(); const form = new FormData(event.currentTarget);
          startTransition(async () => complete(await savePropertyAction(propertyForm === "new" ? null : propertyForm.id, {
            label: String(form.get("label") || ""), propertyType: String(form.get("property_type")) as InsuredProperty["propertyType"], occupancyType: String(form.get("occupancy_type")) as InsuredProperty["occupancyType"], street: String(form.get("street") || ""), postalCode: String(form.get("postal_code") || ""), city: String(form.get("city") || ""), canton: String(form.get("canton") || ""), householdSize: form.get("household_size") ? Number(form.get("household_size")) : null,
          })));
        }}>
          <label className="text-[12px] text-muted">Nome<input aria-label="Nome abitazione" name="label" required defaultValue={propertyForm === "new" ? "Casa" : propertyForm.label} className={inputClass} /></label>
          <label className="text-[12px] text-muted">Tipo<select aria-label="Tipo abitazione" name="property_type" defaultValue={propertyForm === "new" ? "apartment" : propertyForm.propertyType} className={inputClass}><option value="apartment">Appartamento</option><option value="house">Casa</option><option value="other">Altro</option></select></label>
          <label className="text-[12px] text-muted">Occupazione<select aria-label="Occupazione abitazione" name="occupancy_type" defaultValue={propertyForm === "new" ? "tenant" : propertyForm.occupancyType} className={inputClass}><option value="tenant">In affitto</option><option value="owner">Proprietà</option><option value="other">Altro</option></select></label>
          <label className="text-[12px] text-muted">Via<input aria-label="Via abitazione" name="street" defaultValue={propertyForm === "new" ? "" : propertyForm.street ?? ""} className={inputClass} /></label>
          <label className="text-[12px] text-muted">NPA<input aria-label="NPA abitazione" name="postal_code" defaultValue={propertyForm === "new" ? "" : propertyForm.postalCode ?? ""} className={inputClass} /></label>
          <label className="text-[12px] text-muted">Città<input aria-label="Città abitazione" name="city" defaultValue={propertyForm === "new" ? "" : propertyForm.city ?? ""} className={inputClass} /></label>
          <label className="text-[12px] text-muted">Cantone<input aria-label="Cantone abitazione" name="canton" defaultValue={propertyForm === "new" ? "" : propertyForm.canton ?? ""} className={inputClass} /></label>
          <label className="text-[12px] text-muted">Persone<input aria-label="Persone abitazione" name="household_size" type="number" min="1" defaultValue={propertyForm === "new" ? "" : propertyForm.householdSize ?? ""} className={inputClass} /></label>
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setPropertyForm(null)} className="atlas-btn-secondary px-3 py-2 text-[12px]">Annulla</button><button disabled={pending} className="atlas-btn-primary px-3 py-2 text-[12px]">Salva casa</button></div>
        </form> : null}
      </section>

      <section className="atlas-consumer-card px-5 py-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-[15px] font-semibold tracking-tight text-foreground">Veicoli</h2><p className="mt-1 text-[12px] text-muted">Le vecchie targhe nei dettagli polizza restano intatte.</p></div><button type="button" onClick={() => setVehicleForm("new")} className="atlas-btn-secondary px-3 py-2 text-[12px]">Aggiungi veicolo</button></div>
        <ul className="mt-3 space-y-2">{data.vehicles.map((vehicle) => <li key={vehicle.id} className="flex items-center justify-between gap-3 rounded-xl bg-card-muted px-4 py-3"><div><p className="text-[13px] font-medium text-foreground">{vehicle.label}</p><p className="text-[11px] text-muted">{[vehicle.make, vehicle.model, vehicle.licensePlate].filter(Boolean).join(" · ") || vehicle.vehicleType}</p></div><div className="flex gap-2"><button type="button" onClick={() => setVehicleForm(vehicle)} className="text-[12px] font-medium text-accent">Modifica</button><button type="button" onClick={() => startTransition(async () => complete(await removeVehicleAction(vehicle.id)))} className="text-[12px] text-muted">Elimina</button></div></li>)}</ul>
        {vehicleForm ? <form className="mt-4 grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2" onSubmit={(event) => {
          event.preventDefault(); const form = new FormData(event.currentTarget);
          startTransition(async () => complete(await saveVehicleAction(vehicleForm === "new" ? null : vehicleForm.id, {
            label: String(form.get("label") || ""), vehicleType: String(form.get("vehicle_type")) as Vehicle["vehicleType"], make: String(form.get("make") || ""), model: String(form.get("model") || ""), year: form.get("year") ? Number(form.get("year")) : null, licensePlate: String(form.get("license_plate") || ""), canton: String(form.get("canton") || ""), ownershipType: String(form.get("ownership_type") || "") as Vehicle["ownershipType"], firstRegistrationDate: String(form.get("first_registration_date") || "") || null,
          })));
        }}>
          <label className="text-[12px] text-muted">Nome<input aria-label="Nome veicolo" name="label" required defaultValue={vehicleForm === "new" ? "Auto" : vehicleForm.label} className={inputClass} /></label>
          <label className="text-[12px] text-muted">Tipo<select aria-label="Tipo veicolo" name="vehicle_type" defaultValue={vehicleForm === "new" ? "car" : vehicleForm.vehicleType} className={inputClass}><option value="car">Auto</option><option value="motorcycle">Moto</option><option value="camper">Camper</option><option value="commercial">Commerciale</option><option value="other">Altro</option></select></label>
          <label className="text-[12px] text-muted">Marca<input aria-label="Marca veicolo" name="make" defaultValue={vehicleForm === "new" ? "" : vehicleForm.make ?? ""} className={inputClass} /></label>
          <label className="text-[12px] text-muted">Modello<input aria-label="Modello veicolo" name="model" defaultValue={vehicleForm === "new" ? "" : vehicleForm.model ?? ""} className={inputClass} /></label>
          <label className="text-[12px] text-muted">Anno<input aria-label="Anno veicolo" name="year" type="number" min="1886" defaultValue={vehicleForm === "new" ? "" : vehicleForm.year ?? ""} className={inputClass} /></label>
          <label className="text-[12px] text-muted">Targa<input aria-label="Targa veicolo" name="license_plate" defaultValue={vehicleForm === "new" ? "" : vehicleForm.licensePlate ?? ""} className={inputClass} /></label>
          <label className="text-[12px] text-muted">Cantone<input aria-label="Cantone veicolo" name="canton" defaultValue={vehicleForm === "new" ? "" : vehicleForm.canton ?? ""} className={inputClass} /></label>
          <label className="text-[12px] text-muted">Proprietà<select aria-label="Proprietà veicolo" name="ownership_type" defaultValue={vehicleForm === "new" ? "owned" : vehicleForm.ownershipType ?? "owned"} className={inputClass}><option value="owned">Di proprietà</option><option value="leased">Leasing</option><option value="financed">Finanziato</option><option value="other">Altro</option></select></label>
          <label className="text-[12px] text-muted">Prima immatricolazione<input aria-label="Prima immatricolazione" name="first_registration_date" type="date" defaultValue={vehicleForm === "new" ? "" : vehicleForm.firstRegistrationDate ?? ""} className={inputClass} /></label>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setVehicleForm(null)} className="atlas-btn-secondary px-3 py-2 text-[12px]">Annulla</button><button disabled={pending} className="atlas-btn-primary px-3 py-2 text-[12px]">Salva veicolo</button></div>
        </form> : null}
      </section>
    </div>
  );
}
