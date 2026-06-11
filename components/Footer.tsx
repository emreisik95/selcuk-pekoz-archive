import { getAdminConfig } from "@/lib/admin-config";
import { SocialIcon, platformLabel } from "./SocialIcon";

export function Footer() {
  const cfg = getAdminConfig();
  const links = cfg.socialLinks;

  return (
    <footer className="mt-auto border-t border-hair">
      <div
        className="px-5 md:px-10 py-5 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono text-[11px] text-faint uppercase"
        style={{ letterSpacing: "0.04em" }}
      >
        <span>Resmi olmayan fan projesi</span>
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          {links.map((l) => (
            <a
              key={l.platform + l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-text"
              aria-label={l.label || platformLabel(l.platform)}
            >
              <SocialIcon platform={l.platform} />
              <span>{l.label || platformLabel(l.platform)}</span>
            </a>
          ))}
          <span aria-hidden className="hidden md:inline">·</span>
          <span>Veri · YouTube API</span>
        </div>
      </div>
    </footer>
  );
}
