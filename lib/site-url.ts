export const PRODUCTION_SITE_URL = "https://sp.emre.zip";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? PRODUCTION_SITE_URL
).replace(/\/$/, "");
