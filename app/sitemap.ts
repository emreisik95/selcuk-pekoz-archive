import type { MetadataRoute } from "next";
import { getAllStreams } from "@/lib/streams";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const streams = await getAllStreams();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/takvim`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/arsiv`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/istatistikler`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
  ];

  const streamRoutes: MetadataRoute.Sitemap = streams.map((s) => ({
    url: `${SITE_URL}/y/${s.id}`,
    lastModified: new Date(s.scheduledAt),
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [...staticRoutes, ...streamRoutes];
}
