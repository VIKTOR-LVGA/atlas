import type { InsuranceCategory } from "@/lib/insurance-knowledge/categories";

export const coverageValueKinds = [
  "boolean",
  "money",
  "percent",
  "duration",
  "text",
  "count",
] as const;

export type CoverageValueKind = (typeof coverageValueKinds)[number];

export type CanonicalCoverageDefinition = {
  canonicalType: string;
  category: InsuranceCategory;
  label: string;
  valueKinds: CoverageValueKind[];
  aliases: { it: string[]; de: string[]; fr: string[] };
};

const c = (
  canonicalType: string,
  category: InsuranceCategory,
  label: string,
  valueKinds: CoverageValueKind[],
  it: string[],
  de: string[],
  fr: string[]
): CanonicalCoverageDefinition => ({
  canonicalType,
  category,
  label,
  valueKinds,
  aliases: { it, de, fr },
});

/** Compact semantic catalog. Product names stay in originalLabel. */
export const canonicalCoverageTaxonomy: CanonicalCoverageDefinition[] = [
  c("other_coverage", "other", "Altra copertura", ["text", "money"], ["altra copertura"], ["andere deckung"], ["autre couverture"]),
  c("statutory_basic_health", "health_basic", "Prestazioni LAMal", ["boolean"], ["assicurazione di base", "lamal", "aoms"], ["grundversicherung", "kvg", "okp"], ["assurance de base", "lamal", "aos"]),
  c("standard_care_model", "health_basic", "Modello standard", ["text"], ["modello standard", "libera scelta del medico"], ["standardmodell", "freie arztwahl"], ["modele standard", "libre choix du medecin"]),
  c("family_doctor_model", "health_basic", "Modello medico di famiglia", ["text"], ["medico di famiglia"], ["hausarztmodell", "hausarzt"], ["modele medecin de famille", "medecin de famille"]),
  c("hmo_model", "health_basic", "Modello HMO", ["text"], ["modello hmo"], ["hmo modell"], ["modele hmo"]),
  c("telemedicine_model", "health_basic", "Modello telemedicina", ["text"], ["telemedicina", "telmed"], ["telemedizin", "telmed"], ["telemedecine", "telmed"]),
  c("accident_health_option", "health_basic", "Copertura infortuni LAMal", ["boolean"], ["infortunio incluso", "copertura infortuni"], ["unfalldeckung", "unfall eingeschlossen"], ["couverture accident", "accident inclus"]),
  c("ambulatory_supplementary", "health_supplementary", "Complementare ambulatoriale", ["money", "percent"], ["ambulatoriale"], ["ambulant"], ["ambulatoire"]),
  c("hospital_general_ward", "health_supplementary", "Reparto comune", ["boolean"], ["reparto comune"], ["allgemeine abteilung"], ["division commune"]),
  c("hospital_semiprivate", "health_supplementary", "Reparto semiprivato", ["boolean"], ["semiprivato", "semi privata"], ["halbprivat"], ["semi prive", "semi-privee"]),
  c("hospital_private", "health_supplementary", "Reparto privato", ["boolean"], ["reparto privato"], ["privatabteilung", "privat"], ["division privee", "privee"]),
  c("alternative_medicine", "health_supplementary", "Medicina alternativa", ["money", "percent"], ["medicina alternativa"], ["alternativmedizin"], ["medecine alternative"]),
  c("dental_care", "health_supplementary", "Cure dentarie", ["money", "percent"], ["dentaria", "cure dentarie"], ["zahnbehandlung", "dental"], ["soins dentaires", "dentaire"]),
  c("optical_aids", "health_supplementary", "Occhiali e lenti", ["money"], ["occhiali", "lenti a contatto"], ["brille", "kontaktlinsen"], ["lunettes", "lentilles de contact"]),
  c("prevention_fitness", "health_supplementary", "Prevenzione e fitness", ["money", "percent"], ["fitness", "prevenzione"], ["fitness", "pravention"], ["fitness", "prevention"]),
  c("foreign_medical_expenses", "health_supplementary", "Spese mediche all'estero", ["money", "percent"], ["cure all estero", "spese mediche estero"], ["heilungskosten im ausland", "ausland"], ["frais medicaux a l etranger", "etranger"]),
  c("motor_liability", "vehicle", "Responsabilita civile veicoli", ["money"], ["rc auto", "responsabilita civile veicoli"], ["motorfahrzeug haftpflicht", "haftpflicht"], ["responsabilite civile automobile", "rc vehicule"]),
  c("partial_casco", "vehicle", "Casco parziale", ["boolean"], ["casco parziale"], ["teilkasko"], ["casco partielle"]),
  c("comprehensive_casco", "vehicle", "Casco totale", ["boolean"], ["casco totale"], ["vollkasko"], ["casco complete"]),
  c("collision_damage", "vehicle", "Collisione", ["money"], ["collisione"], ["kollision"], ["collision"]),
  c("theft", "vehicle", "Furto", ["money"], ["furto"], ["diebstahl"], ["vol"]),
  c("natural_hazards", "vehicle", "Eventi naturali", ["money"], ["eventi naturali", "grandine"], ["elementarereignisse", "hagel"], ["evenements naturels", "grele"]),
  c("glass_damage", "vehicle", "Vetri", ["money"], ["rottura vetri", "vetri"], ["glasbruch", "glasschaden"], ["bris de glaces", "glaces"]),
  c("parking_damage", "vehicle", "Danni di parcheggio", ["money", "count"], ["danni di parcheggio", "danni di parcheggio plus"], ["park schaden", "parkschaden"], ["dommages de parcage"]),
  c("vandalism", "vehicle", "Vandalismo", ["money", "boolean"], ["vandalismo"], ["vandalismus"], ["vandalisme"]),
  c("marten_damage", "vehicle", "Danni da martore", ["money", "boolean"], ["martore", "danni di martore"], ["marderbiss", "marder"], ["fouine", "degats de fouine"]),
  c("animal_collision", "vehicle", "Danni di animali", ["money", "boolean"], ["danni di animali", "animali"], ["tierschaeden", "wildschaden"], ["dommages animaux"]),
  c("forces_of_nature", "vehicle", "Forze della natura", ["money", "boolean"], ["forze della natura"], ["elementarereignisse", "naturgewalt"], ["forces de la nature"]),
  c("gross_negligence_waiver", "vehicle", "Rinuncia alla rivalsa per colpa grave", ["boolean"], ["colpa grave", "rinuncia alla rivalsa"], ["grobfahrlassigkeit", "regressverzicht"], ["faute grave", "renonciation au recours"]),
  c("roadside_assistance", "vehicle", "Assistenza stradale", ["boolean", "money"], ["soccorso stradale", "assistenza", "help point"], ["pannenhilfe", "assistance"], ["depannage", "assistance"]),
  c("bonus_protection", "vehicle", "Protezione bonus", ["boolean"], ["protezione bonus"], ["bonusschutz"], ["protection du bonus"]),
  c("occupants_accident", "vehicle", "Infortuni occupanti", ["money"], ["infortuni occupanti", "infortunio passeggeri", "conducente e passeggeri"], ["insassenunfall"], ["accidents occupants"]),
  c("current_value_compensation", "vehicle", "Valore venale", ["money", "percent"], ["valore venale"], ["zeitwert"], ["valeur venale"]),
  c("replacement_value_compensation", "vehicle", "Valore a nuovo", ["money", "percent"], ["valore a nuovo"], ["neuwert"], ["valeur a neuf"]),
  c("household_contents", "household", "Mobilia domestica", ["money"], ["mobilia domestica", "economia domestica"], ["hausrat"], ["menage", "inventaire du menage"]),
  c("fire", "household", "Incendio", ["money"], ["incendio", "fuoco"], ["feuer", "brand"], ["incendie", "feu"]),
  c("water_damage", "household", "Danni d'acqua", ["money"], ["danni d acqua", "acqua"], ["wasserschaden", "wasser"], ["degats d eau", "eau"]),
  c("simple_theft_away", "household", "Furto semplice fuori casa", ["money"], ["furto semplice fuori casa"], ["einfacher diebstahl auswarts", "einfacher diebstahl auswärts"], ["vol simple hors du domicile"]),
  c("household_glass", "household", "Vetri mobilia/stabile", ["money"], ["vetri della mobilia", "rottura vetri"], ["mobiliarverglasung", "gebaudeverglasung"], ["bris de glaces du mobilier", "vitrages du batiment"]),
  c("cyber", "household", "Cyber", ["money", "boolean"], ["cyber"], ["cyber"], ["cyber"]),
  c("valuables", "household", "Oggetti di valore", ["money"], ["oggetti di valore", "gioielli"], ["wertsachen", "schmuck"], ["objets de valeur", "bijoux"]),
  c("private_liability", "private_liability", "RC privata", ["money"], ["rc privata", "responsabilita civile privata"], ["privathaftpflicht"], ["responsabilite civile privee"]),
  c("tenant_damage", "private_liability", "Danni da locatario", ["money"], ["danni da locatario"], ["mieterschaden"], ["dommages locatifs"]),
  c("third_party_bodily_injury", "private_liability", "Danni corporali a terzi", ["money"], ["danni corporali a terzi"], ["personenschaden"], ["dommages corporels"]),
  c("third_party_property_damage", "private_liability", "Danni materiali a terzi", ["money"], ["danni materiali a terzi"], ["sachschaden"], ["dommages materiels"]),
  c("private_legal", "legal_protection", "Protezione giuridica privata", ["money"], ["protezione giuridica privata"], ["privatrechtsschutz"], ["protection juridique privee"]),
  c("traffic_legal", "legal_protection", "Protezione giuridica circolazione", ["money"], ["protezione giuridica circolazione"], ["verkehrsrechtsschutz"], ["protection juridique circulation"]),
  c("employment_legal", "legal_protection", "Diritto del lavoro", ["money"], ["diritto del lavoro"], ["arbeitsrecht"], ["droit du travail"]),
  c("tenancy_legal", "legal_protection", "Diritto di locazione", ["money"], ["diritto di locazione"], ["mietrecht"], ["droit du bail"]),
  c("consumer_legal", "legal_protection", "Diritto dei consumatori", ["money"], ["consumatori", "diritto contrattuale"], ["konsumentenrecht", "vertragsrecht"], ["droit de la consommation", "droit contractuel"]),
  c("social_insurance_legal", "legal_protection", "Assicurazioni e diritto sociale", ["money"], ["assicurazioni sociali"], ["sozialversicherungsrecht"], ["assurances sociales"]),
  c("trip_cancellation", "travel", "Annullamento viaggio", ["money"], ["spese di annullamento", "annullamento viaggio"], ["annullierungskosten", "reiseannullierung"], ["frais d annulation", "annulation voyage"]),
  c("travel_assistance", "travel", "Assistenza viaggio", ["money", "boolean"], ["assistenza persone", "assistenza viaggio"], ["personen assistance", "reise assistance"], ["assistance aux personnes", "assistance voyage"]),
  c("repatriation", "travel", "Rimpatrio", ["money"], ["rimpatrio"], ["repatriierung", "rucktransport"], ["rapatriement"]),
  c("baggage", "travel", "Bagaglio", ["money"], ["bagaglio", "ritardo bagaglio"], ["reisegepack", "gepackverspatung"], ["bagages", "retard de bagages"]),
  c("travel_delay", "travel", "Ritardo viaggio", ["money", "duration"], ["ritardo viaggio"], ["reiseverspatung"], ["retard de voyage"]),
  c("vehicle_assistance", "travel", "Assistenza veicolo in viaggio", ["money", "boolean"], ["assistenza veicoli"], ["fahrzeug assistance"], ["assistance vehicule"]),
  c("rental_vehicle_deductible", "travel", "Franchigia veicolo a noleggio", ["money"], ["franchigia veicolo a noleggio"], ["mietwagen selbstbehalt"], ["franchise vehicule de location"]),
  c("travel_legal", "travel", "Protezione giuridica viaggi", ["money"], ["protezione giuridica viaggi"], ["reiserechtsschutz"], ["protection juridique voyage"]),
  c("death_benefit", "life", "Prestazione in caso di decesso", ["money"], ["rischio morte", "capitale decesso"], ["todesfallleistung", "todesfallkapital"], ["prestation en cas de deces", "capital deces"]),
  c("disability_income", "life", "Rendita per incapacita di guadagno", ["money"], ["rendita incapacita di guadagno"], ["erwerbsunfahigkeitsrente"], ["rente d incapacite de gain"]),
  c("premium_waiver", "life", "Esonero dal pagamento dei premi", ["boolean", "duration"], ["esonero pagamento premi"], ["pramienbefreiung"], ["liberation du paiement des primes"]),
  c("savings_component", "pension", "Componente di risparmio", ["money", "percent"], ["componente risparmio"], ["sparanteil"], ["part d epargne"]),
  c("investment_component", "pension", "Componente d'investimento", ["money", "percent"], ["componente investimento", "legata a fondi"], ["anlageanteil", "fondsgebunden"], ["part d investissement", "liee a des fonds"]),
  c("surrender_value", "pension", "Valore di riscatto", ["money"], ["valore di riscatto"], ["ruckkaufswert"], ["valeur de rachat"]),
  c("building_structure", "building", "Edificio", ["money"], ["stabile", "edificio"], ["gebaude"], ["batiment"]),
  c("building_owner_liability", "building", "Responsabilita proprietario", ["money"], ["responsabilita proprietario"], ["gebaudeeigentumerhaftpflicht"], ["responsabilite du proprietaire d immeuble"]),
  c("pet_illness", "pet", "Malattia animale", ["money", "percent"], ["malattia animale"], ["tierkrankheit"], ["maladie animal"]),
  c("pet_accident", "pet", "Infortunio animale", ["money", "percent"], ["infortunio animale"], ["tierunfall"], ["accident animal"]),
  c("veterinary_costs", "pet", "Spese veterinarie", ["money", "percent"], ["spese veterinarie"], ["tierarztkosten"], ["frais veterinaires"]),
];

export const canonicalCoverageTypes = canonicalCoverageTaxonomy.map(
  (coverage) => coverage.canonicalType
);

export function getCanonicalCoverageDefinition(canonicalType: string) {
  return canonicalCoverageTaxonomy.find(
    (coverage) => coverage.canonicalType === canonicalType
  );
}
