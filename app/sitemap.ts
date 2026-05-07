import type { MetadataRoute } from "next";
import { getAllStreams } from "@/lib/streams";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3007";

export default function sitemap(): MetadataRoute.Sitemap {
  const streams = getAllStreams();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE_URL}/takvim`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/arsiv`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/istatistikler`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
  ];

  const streamRoutes: MetadataRoute.Sitemap = streams.map((s) => ({
    url: `${BASE_URL}/y/${s.id}`,
    lastModified: new Date(s.scheduledAt),
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [...staticRoutes, ...streamRoutes];
}
