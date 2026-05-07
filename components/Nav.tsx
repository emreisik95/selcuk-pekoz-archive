"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";
import { useFavorites } from "@/lib/favorites";

const links = [
  { href: "/", label: "Anasayfa" },
  { href: "/takvim", label: "Takvim" },
  { href: "/arsiv", label: "Arşiv" },
  { href: "/shorts", label: "Shorts" },
  { href: "/istatistikler", label: "İstatistikler" },
];

export function Nav() {
  const pathname = usePathname();
  const favSet = useFavorites();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const favActive = isActive("/favorilerim");

  return (
    <header className="sticky top-0 z-30 bg-bg border-b border-hair">
      <div className="h-14 px-5 md:px-10 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between gap-6">
        <Link href="/" className="flex items-baseline gap-2 md:justify-self-start">
          <span
            className="font-serif text-[17px] font-semibold text-text"
            style={{ letterSpacing: "-0.015em" }}
          >
            Selçuk Peköz
          </span>
          <span
            className="font-serif text-[15px] text-faint"
            style={{ letterSpacing: "-0.01em" }}
          >
            · Yayın Arşivi
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 md:justify-self-center">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "relative py-1 text-[13px] " +
                  (active ? "text-text" : "text-muted hover:text-text")
                }
              >
                {l.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-ink" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 md:justify-self-end">
          <Link
            href="/favorilerim"
            aria-label="Favorilerim"
            className={
              "inline-flex items-center gap-1 " +
              (favActive ? "text-red" : "text-muted hover:text-text")
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill={favSet.size > 0 ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <path d="M7 12.2 2.2 7.4a3 3 0 0 1 4.2-4.2L7 3.8l.6-.6a3 3 0 0 1 4.2 4.2L7 12.2Z" />
            </svg>
            {favSet.size > 0 && (
              <span
                className="font-mono text-[10px] tabular"
                style={{ letterSpacing: "0.04em" }}
              >
                {favSet.size}
              </span>
            )}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
