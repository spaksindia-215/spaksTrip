import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.spakstrip.com";
  const lastmod = new Date("2026-06-29");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: lastmod,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/flight`,
      lastModified: lastmod,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/hotel`,
      lastModified: lastmod,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/taxi-package`,
      lastModified: lastmod,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/national-tour-packages`,
      lastModified: lastmod,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/international-tour-packages`,
      lastModified: lastmod,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cabs`,
      lastModified: lastmod,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bus`,
      lastModified: lastmod,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/train/search`,
      lastModified: lastmod,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cruise`,
      lastModified: lastmod,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sightseeing`,
      lastModified: lastmod,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/transfer`,
      lastModified: lastmod,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/self-drive`,
      lastModified: lastmod,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/islandhopper`,
      lastModified: lastmod,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/insurance`,
      lastModified: lastmod,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: lastmod,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy_policy`,
      lastModified: lastmod,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms_conditions`,
      lastModified: lastmod,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund_policy`,
      lastModified: lastmod,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return staticRoutes;
}
