// Lightweight title-based topic tagging. No NLP — just curated keyword
// dictionary tuned to Selçuk's content (Nintendo / chat formats / books).

import type { Stream } from "./types";

type TagRule = { tag: string; pattern: RegExp };

// Game tags are specific titles; Platform tags are consoles. When a title
// mentions a game ("Pokemon Legends (Switch 2)"), we keep only the game and
// drop the platform — otherwise "Switch" becomes a noisy catch-all.
const GAME_TAGS = new Set([
  "Pokémon",
  "Mario",
  "Mario Kart",
  "Zelda",
  "Tomodachi",
  "Pragmata",
  "Kirby",
  "Animal Crossing",
  "Xenoblade",
  "Bayonetta",
]);

const PLATFORM_TAGS = new Set(["Switch", "Wii", "Nintendo"]);

export const TAG_RULES: TagRule[] = [
  // Games (specific titles)
  { tag: "Pokémon", pattern: /pokémon|pokemon/i },
  { tag: "Mario Kart", pattern: /mario\s*kart/i },
  { tag: "Mario", pattern: /\bmario\b/i },
  { tag: "Zelda", pattern: /zelda|minish/i },
  { tag: "Tomodachi", pattern: /tomodachi/i },
  { tag: "Pragmata", pattern: /pragmata/i },
  { tag: "Kirby", pattern: /kirby/i },
  { tag: "Animal Crossing", pattern: /animal\s*crossing/i },
  { tag: "Xenoblade", pattern: /xenoblade/i },
  { tag: "Bayonetta", pattern: /bayonetta/i },
  // Platforms (only kept when no specific game matched)
  { tag: "Switch", pattern: /\bswitch\b/i },
  { tag: "Wii", pattern: /\bwii\b/i },
  { tag: "Nintendo", pattern: /nintendo/i },
  // Format / topic
  { tag: "Sohbet", pattern: /sohbet|muhabbet|geyik|goygoy/i },
  { tag: "Soru-Cevap", pattern: /soru[-\s]?cevap|sorucevap/i },
  { tag: "Açık Mikrofon", pattern: /açık\s+mikrofon|acik\s+mikrofon/i },
  { tag: "Kitap", pattern: /kitap|köşe[-\s]?yazısı/i },
  { tag: "Misafir", pattern: /misafir/i },
  { tag: "Müzik", pattern: /müzik|muzik/i },
  { tag: "Spor", pattern: /spor|maç|futbol/i },
  { tag: "Bilim", pattern: /bilim|jeoloji|evrim/i },
  { tag: "Bilanço", pattern: /bilanço|bilanco/i },
  { tag: "Yıl Sonu", pattern: /yıl\s*sonu|yil\s*sonu/i },
  { tag: "Yılbaşı", pattern: /yılbaşı|yilbasi/i },
  { tag: "Maraton", pattern: /maraton/i },
];

const ALL_TAGS = TAG_RULES.map((r) => r.tag);

export function extractTags(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const r of TAG_RULES) {
    if (r.pattern.test(text)) out.push(r.tag);
  }
  return out;
}

export function streamTags(stream: Stream): string[] {
  const all = extractTags(stream.title);
  const hasGame = all.some((t) => GAME_TAGS.has(t));
  // Keep platform tag only if no specific game name was found in the title.
  return hasGame ? all.filter((t) => !PLATFORM_TAGS.has(t)) : all;
}

export function tagCounts(streams: Stream[]): Array<{
  tag: string;
  count: number;
}> {
  const counts = new Map<string, number>();
  for (const s of streams) {
    for (const t of streamTags(s)) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function knownTags(): string[] {
  return [...ALL_TAGS];
}
