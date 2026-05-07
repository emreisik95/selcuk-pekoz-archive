const DISCORD_INVITE = "https://discord.gg/UgcedxJjHK";
const YOUTUBE_CHANNEL = "https://www.youtube.com/@SelçukPeköz";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-hair">
      <div
        className="px-5 md:px-10 py-5 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono text-[11px] text-faint uppercase"
        style={{ letterSpacing: "0.04em" }}
      >
        <span>Resmi olmayan fan projesi</span>
        <div className="flex flex-wrap items-center gap-3 md:gap-5">
          <a
            href={YOUTUBE_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text"
          >
            YouTube ↗
          </a>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text"
          >
            Discord ↗
          </a>
          <span aria-hidden className="hidden md:inline">·</span>
          <span>Veri · yt-dlp</span>
        </div>
      </div>
    </footer>
  );
}
