import type { MetadataRoute } from "next";

const siteUrl = "https://atlas-liard-three.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/intelligence`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
