export const PRODUCTION_SITE_URL =
  "https://selcuk-pekoz-archive.hello-e43.workers.dev";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? PRODUCTION_SITE_URL
).replace(/\/$/, "");
