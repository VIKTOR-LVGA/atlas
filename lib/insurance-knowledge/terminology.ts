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
  { canonical: "annual_premium", it: ["premio annuo", "premio annuale"], de: ["jahresprämie", "jahrespraemie"], fr: ["prime annuelle"] },
  { canonical: "monthly_premium", it: ["premio mensile"], de: ["monatsprämie", "monatspraemie"], fr: ["prime mensuelle"] },
  { canonical: "final_premium", it: ["premio totale", "premio complessivo", "premio a suo carico"], de: ["gesamtprämie", "totalprämie", "zu ihren lasten"], fr: ["prime totale", "prime à votre charge"] },
  { canonical: "payment_frequency", it: ["modalità di pagamento", "semestrale"], de: ["zahlungsweise", "halbjährlich"], fr: ["mode de paiement", "semestriel"] },
  { canonical: "partial_casco", it: ["casco parziale"], de: ["teilkasko"], fr: ["casco partielle"] },
  { canonical: "collision", it: ["collisione"], de: ["kollision"], fr: ["collision"] },
  { canonical: "third_party_motor_liability", it: ["responsabilità civile veicoli", "rc auto"], de: ["motorfahrzeughaftpflicht"], fr: ["responsabilité civile véhicules"] },
  { canonical: "basic_health", it: ["assicurazione di base", "lamal"], de: ["grundversicherung", "kvg"], fr: ["assurance de base", "lamal"] },
  { canonical: "supplementary_health", it: ["assicurazione complementare", "lca"], de: ["zusatzversicherung", "vvg"], fr: ["assurance complémentaire", "lca"] },
  { canonical: "special_conditions", it: ["condizioni particolari", "cpa"], de: ["besondere versicherungsbedingungen", "bvb"], fr: ["conditions particulières", "cpa"] },
  { canonical: "effective_date", it: ["entrata in vigore", "decorrenza"], de: ["inkrafttreten", "versicherungsbeginn"], fr: ["entrée en vigueur", "début de l assurance"] },
  { canonical: "not_insured", it: ["non assicurato", "non coperto"], de: ["nicht versichert", "nicht gedeckt"], fr: ["non assuré", "non couvert"] },
  { canonical: "insured_benefit", it: ["prestazione assicurata", "copertura inclusa"], de: ["versicherte leistung", "deckung eingeschlossen"], fr: ["prestation assurée", "couverture incluse"] },
  { canonical: "discount", it: ["sconto", "ribasso"], de: ["rabatt", "nachlass"], fr: ["rabais", "réduction"] },
  { canonical: "taxes", it: ["tasse", "imposte"], de: ["abgaben", "steuern"], fr: ["taxes", "impôts"] },
];
