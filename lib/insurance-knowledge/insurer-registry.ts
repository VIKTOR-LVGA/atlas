import { normalizeKnowledgeText } from "@/lib/insurance-knowledge/document-types";

export type SwissInsurerDefinition = {
  id: string;
  brand: string;
  legalEntities: string[];
  domains: string[];
  aliases: string[];
  productSignals: string[];
};

export const swissInsurerRegistry: SwissInsurerDefinition[] = [
  { id: "axa", brand: "AXA", legalEntities: ["AXA Versicherungen AG", "AXA Assicurazioni SA", "AXA-ARAG Rechtsschutz AG"], domains: ["axa.ch"], aliases: ["axa", "axa winterthur", "axa-arag"], productSignals: ["intertours"] },
  { id: "zurich", brand: "Zurich", legalEntities: ["Zurich Insurance Company Ltd", "Zurigo Compagnia di Assicurazioni SA", "Zurich Compagnia di Assicurazioni SA", "Zurigo Compagnia di Assicurazioni"], domains: ["zurich.ch"], aliases: ["zurich", "zurigo", "zurigo assicurazioni", "zurich compagnia", "zurich insurance"], productSignals: ["relax assistance", "orion", "help point"] },
  { id: "helvetia", brand: "Helvetia", legalEntities: ["Helvetia Compagnia Svizzera d'Assicurazioni SA", "Helvetia Schweizerische Versicherungsgesellschaft AG"], domains: ["helvetia.com"], aliases: ["helvetia"], productSignals: ["you­niverse", "youniverse"] },
  { id: "allianz", brand: "Allianz Suisse", legalEntities: ["Allianz Suisse Societa di Assicurazioni SA", "Allianz Suisse Versicherungs-Gesellschaft AG", "Allianz Suisse Societa di Assicurazioni sulla Vita SA"], domains: ["allianz.ch"], aliases: ["allianz", "allianz suisse"], productSignals: ["smart invest", "balance invest"] },
  { id: "mobiliar", brand: "La Mobiliare", legalEntities: ["Societa svizzera d'assicurazioni La Mobiliare", "Schweizerische Mobiliar Versicherungsgesellschaft AG"], domains: ["mobiliere.ch", "mobiliar.ch"], aliases: ["la mobiliare", "mobiliare", "mobiliere", "mobiliar", "die mobiliar"], productSignals: [] },
  { id: "baloise", brand: "Baloise", legalEntities: ["Baloise Assicurazione SA", "Baloise Versicherung AG"], domains: ["baloise.ch"], aliases: ["baloise", "basler"], productSignals: ["baloisecombi"] },
  { id: "generali", brand: "Generali", legalEntities: ["Generali Assicurazioni Generali SA", "Generali Personenversicherungen AG"], domains: ["generali.ch"], aliases: ["generali"], productSignals: ["fortuna"] },
  { id: "vaudoise", brand: "Vaudoise", legalEntities: ["Vaudoise Generale Compagnia di Assicurazioni SA", "Vaudoise Generale, Compagnie d'Assurances SA"], domains: ["vaudoise.ch"], aliases: ["vaudoise"], productSignals: ["home in one", "juris"] },
  { id: "css", brand: "CSS", legalEntities: ["CSS Assicurazione malattie SA", "CSS Kranken-Versicherung AG"], domains: ["css.ch"], aliases: ["css", "css assicurazione", "css versicherung"], productSignals: ["profit", "multimed"] },
  { id: "helsana", brand: "Helsana", legalEntities: ["Helsana Assicurazioni SA", "Helsana Versicherungen AG", "Helsana Assicurazioni integrative SA"], domains: ["helsana.ch"], aliases: ["helsana"], productSignals: ["benefit plus", "premed-24", "completa"] },
  { id: "swica", brand: "SWICA", legalEntities: ["SWICA Assicurazione malattia SA", "SWICA Krankenversicherung AG"], domains: ["swica.ch"], aliases: ["swica"], productSignals: ["favorit casa", "favorit telmed", "sante24"] },
  { id: "sanitas", brand: "Sanitas", legalEntities: ["Sanitas Assicurazione Base SA", "Sanitas Grundversicherungen AG", "Sanitas Assicurazioni Private SA"], domains: ["sanitas.com"], aliases: ["sanitas", "wincare"], productSignals: ["callmed", "compact one", "hospital liberty"] },
  { id: "groupe-mutuel", brand: "Groupe Mutuel", legalEntities: ["Groupe Mutuel Assicurazioni GMA SA", "Groupe Mutuel Assurances GMA SA"], domains: ["groupemutuel.ch"], aliases: ["groupe mutuel", "mutuel assicurazione", "mutuel assurance"], productSignals: ["primacare", "primaflex"] },
  { id: "visana", brand: "Visana", legalEntities: ["Visana AG", "Visana Versicherungen AG"], domains: ["visana.ch"], aliases: ["visana"], productSignals: ["med direct", "combi care"] },
];

export type InsurerRecognition = {
  insurerId: string | null;
  brand: string | null;
  legalEntity: string | null;
  matchedSignals: string[];
  confidence: number;
};

export function recognizeSwissInsurer(text: string): InsurerRecognition {
  const source = normalizeKnowledgeText(text.slice(0, 25000));
  const matches = swissInsurerRegistry
    .map((insurer) => {
      const legal = insurer.legalEntities.find((value) =>
        source.includes(normalizeKnowledgeText(value))
      );
      const domains = insurer.domains.filter((value) =>
        source.includes(normalizeKnowledgeText(value))
      );
      const aliases = insurer.aliases.filter((value) =>
        source.includes(normalizeKnowledgeText(value))
      );
      const products = insurer.productSignals.filter((value) =>
        source.includes(normalizeKnowledgeText(value))
      );
      const score = (legal ? 8 : 0) + domains.length * 6 + aliases.length * 3 + products.length * 2;
      return {
        insurer,
        legal,
        signals: [legal, ...domains, ...aliases, ...products].filter(
          (value): value is string => Boolean(value)
        ),
        score,
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  const match = matches[0];
  if (!match) {
    return { insurerId: null, brand: null, legalEntity: null, matchedSignals: [], confidence: 0 };
  }

  return {
    insurerId: match.insurer.id,
    brand: match.insurer.brand,
    legalEntity: match.legal ?? null,
    matchedSignals: match.signals,
    confidence: Math.min(99, 62 + match.score * 3),
  };
}
