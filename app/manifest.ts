import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ATLAS — Gestione assicurativa",
    short_name: "ATLAS",
    description:
      "Piattaforma pilota per organizzare e comprendere le proprie assicurazioni.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8faff",
    theme_color: "#1d4ed8",
    lang: "it-CH",
  };
}
