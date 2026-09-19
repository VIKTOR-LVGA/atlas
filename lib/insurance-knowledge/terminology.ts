export type SwissInsuranceTerm = {
  canonical: string;
  it: string[];
  de: string[];
  fr: string[];
};

/** Common non-coverage concepts used during classification and extraction. */
export const swissInsuranceTerminology: SwissInsuranceTerm[] = [
  { canonical: "policy", it: ["polizza"], de: ["police", "versicherungspolice"], fr: ["police"] },
  { canonical: "policyholder", it: ["contraente", "stipulante"], de: ["versicherungsnehmer"], fr: ["preneur d assurance"] },
  { canonical: "insured_person", it: ["persona assicurata", "assicurato"], de: ["versicherte person"], fr: ["personne assuree"] },
  { canonical: "premium", it: ["premio"], de: ["pramie"], fr: ["prime"] },
  { canonical: "deductible", it: ["franchigia"], de: ["selbstbehalt", "franchise"], fr: ["franchise"] },
  { canonical: "coinsurance", it: ["aliquota percentuale", "quota parte"], de: ["selbstbehalt prozentual", "kostenbeteiligung"], fr: ["quote-part", "participation aux couts"] },
  { canonical: "sum_insured", it: ["somma assicurata", "massimale"], de: ["versicherungssumme", "deckungssumme"], fr: ["somme d assurance", "plafond"] },
  { canonical: "general_conditions", it: ["condizioni generali di assicurazione", "cga"], de: ["allgemeine versicherungsbedingungen", "avb"], fr: ["conditions generales d assurance", "cga"] },
  { canonical: "supplementary_conditions", it: ["condizioni supplementari", "condizioni complementari"], de: ["zusatzbedingungen", "besondere bedingungen"], fr: ["conditions complementaires", "conditions supplementaires"] },
  { canonical: "expiry", it: ["scadenza"], de: ["ablauf", "vertragsende"], fr: ["echeance", "fin du contrat"] },
  { canonical: "cancellation_deadline", it: ["termine di disdetta"], de: ["kundigungsfrist"], fr: ["delai de resiliation"] },
  { canonical: "exclusion", it: ["esclusione"], de: ["ausschluss"], fr: ["exclusion"] },
  { canonical: "beneficiary", it: ["beneficiario"], de: ["begunstigter"], fr: ["beneficiaire"] },
  { canonical: "pillar_3a", it: ["previdenza vincolata", "pilastro 3a"], de: ["gebundene vorsorge", "saule 3a"], fr: ["prevoyance liee", "pilier 3a"] },
  { canonical: "pillar_3b", it: ["previdenza libera", "pilastro 3b"], de: ["freie vorsorge", "saule 3b"], fr: ["prevoyance libre", "pilier 3b"] },
];
