import { getAdminConfig } from "@/lib/admin-config";
import { BannerView } from "./BannerView";

export function Banner() {
  const cfg = getAdminConfig();
  if (!cfg.banner?.message) return null;
  return <BannerView message={cfg.banner.message} tone={cfg.banner.tone} />;
}
