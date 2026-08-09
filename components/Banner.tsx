import { getAdminConfig } from "@/lib/admin-config";
import { BannerView } from "./BannerView";

export async function Banner() {
  const cfg = await getAdminConfig();
  if (!cfg.banner?.message) return null;
  return <BannerView message={cfg.banner.message} tone={cfg.banner.tone} />;
}
