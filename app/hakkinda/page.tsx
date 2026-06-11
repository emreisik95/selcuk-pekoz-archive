import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SocialIcon, platformLabel } from "@/components/SocialIcon";
import { getAdminConfig } from "@/lib/admin-config";
import { getChannelMeta } from "@/lib/streams";

export const revalidate = 60;

export const metadata = {
  title: "Hakkında",
};

const DEFAULT_BODY = `Bu site Selçuk Peköz'ün YouTube canlı yayınlarını arşivleyen, resmi olmayan bir fan projesidir.

Veriler düzenli olarak YouTube Data API aracılığıyla çekilir. Yaklaşan yayınlar takvimde görünür, tamamlanmış yayınlar arşivde, kısa videolar Shorts sekmesinde, ve bütün rakamlar İstatistikler sayfasında.

Resmi sosyal medya bağlantıları aşağıda. Selçuk'a ulaşmak veya kanalını desteklemek istersen YouTube veya Discord en hızlı yol.`;

export default function HakkindaPage() {
  const cfg = getAdminConfig();
  const meta = getChannelMeta();
  const title = cfg.about?.title ?? "Hakkında";
  const body = cfg.about?.body ?? DEFAULT_BODY;

  return (
    <>
      <Nav />
      <main className="flex-1">
        <section className="px-5 md:px-10 pt-6 md:pt-12 pb-7 md:pb-10 border-b border-hair">
          <div
            className="font-mono text-[10px] md:text-[11px] uppercase text-muted mb-2"
            style={{ letterSpacing: "0.12em" }}
          >
            Hakkında
          </div>
          <h1
            className="font-serif text-[28px] md:text-[42px] font-semibold leading-[1.1] text-balance"
            style={{ letterSpacing: "-0.025em" }}
          >
            {title}
          </h1>
          {meta && (
            <p
              className="mt-3 font-mono text-[11px] md:text-[12px] text-muted"
              style={{ letterSpacing: "0.04em" }}
            >
              Kanal: {meta.title} · {meta.handle}
            </p>
          )}
        </section>

        <section className="px-5 md:px-10 pt-7 md:pt-10 pb-10 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-10">
          <article className="text-[15px] leading-[1.7] text-text whitespace-pre-line max-w-[640px]">
            {body}
          </article>

          <aside className="md:border-l md:border-hair md:pl-8">
            <div
              className="font-mono text-[10px] uppercase text-muted mb-3"
              style={{ letterSpacing: "0.12em" }}
            >
              Bağlantılar
            </div>
            <ul className="space-y-2">
              {cfg.socialLinks.map((l) => (
                <li key={l.platform + l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 border border-hair rounded-[2px] px-3 py-2 hover:border-text"
                  >
                    <span className="flex items-center gap-2.5">
                      <SocialIcon platform={l.platform} />
                      <span className="text-[13px] font-medium">
                        {l.label || platformLabel(l.platform)}
                      </span>
                    </span>
                    <span className="text-muted text-[12px]">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  );
}
