import type { Stream } from "./types";

// "Now" pinned so countdown is reproducible: 7 May 2026, 14:30 TRT
export const NOW = new Date("2026-05-07T11:30:00Z");

const palettes: Array<[string, string, string]> = [
  ["#1a1a2e", "#e94560", "#0f3460"],
  ["#2d1b3d", "#ff6b35", "#1a1a2e"],
  ["#0f0f1e", "#00d4ff", "#7c3aed"],
  ["#1a0f1f", "#fbbf24", "#dc2626"],
  ["#0a1929", "#10b981", "#1e3a8a"],
  ["#1f1a17", "#f97316", "#7c2d12"],
  ["#16101e", "#ec4899", "#312e81"],
  ["#0d1421", "#06b6d4", "#1e293b"],
  ["#211a0f", "#eab308", "#422006"],
  ["#1c0e15", "#ef4444", "#450a0a"],
  ["#0f1c14", "#22c55e", "#14532d"],
  ["#1a1a1a", "#a3a3a3", "#404040"],
];

const upcomingTitles = [
  "Pazartesi Sohbeti — Haftaya Bakış",
  "Geç Saat Yayın · Soru-Cevap",
  "Stüdyodan Canlı: Misafirli Bölüm",
  "Cuma Gecesi Açık Mikrofon",
  "Sabah Kahvesi · Erken Yayın",
  "Hafta Sonu Maraton",
];

const liveTitles = ["🔴 Şu An Canlı: Salı Sohbeti"];

const pastTitles = [
  "Bahar Bilançosu — Nisan 2026",
  "Spor Tartışmaları · Final Haftası",
  "Kitap Köşesi: Bu Ay Okuduklarım",
  "Geç Yayın — Müzik ve Muhabbet",
  "Soru-Cevap Maratonu",
  "Misafir: Bir Editörün Hayatı",
  "Pazartesi Sohbeti #142",
  "Hafta Sonu Açılışı",
  "Stüdyo Turu ve Yeni Düzen",
  "Yılbaşı Geriye Bakış",
  "Cuma Gecesi · Uzun Format",
  "Yeni Yıl İlk Yayın",
  "Şubat Bilançosu",
  "Pazartesi Sohbeti #138",
  "Açık Mikrofon · Şubat",
  "Stüdyodan: Plan Yapma Sanatı",
  "Geç Saat · Felsefe Köşesi",
  "Sohbet: Yayıncılığın Geleceği",
  "Spor Bültenleri · Mart",
  "Kitap Köşesi · Mart Seçkisi",
  "Hafta İçi Erken Yayın",
  "Cuma Sohbeti · Uzun Format",
  "Misafir: Bir Köşe Yazarı",
  "Açık Mikrofon · Ocak Finali",
  "Pazartesi Sohbeti #135",
  "Stüdyo Sohbeti · Plan B",
  "Ocak Açılış Yayını",
  "Yıl Sonu Maratonu",
  "Aralık Bilançosu",
  "Soru-Cevap · Aralık",
  "Geç Yayın · Müzikli Sohbet",
  "Pazartesi Sohbeti #130",
];

const upcomingDays = [0, 2, 5, 8, 11, 15];
const upcomingHours = [21, 23, 20, 22, 9, 14];
const upcomingMins = [30, 0, 0, 0, 0, 0];

export const upcomingStreams: Stream[] = upcomingTitles.map((title, i) => {
  const t = new Date(NOW);
  t.setUTCDate(t.getUTCDate() + upcomingDays[i]);
  // TRT = UTC+3
  t.setUTCHours(upcomingHours[i] - 3, upcomingMins[i], 0, 0);
  return {
    id: `up-${i}`,
    kind: "upcoming",
    title,
    scheduledAt: t.toISOString(),
    durationSec: null,
    viewCount: null,
    palette: palettes[i % palettes.length],
    episodeNo: 168 - i,
  };
});

export const liveStreams: Stream[] = liveTitles.map((title, i) => ({
  id: `live-${i}`,
  kind: "live",
  title,
  scheduledAt: new Date(NOW.getTime() - 47 * 60 * 1000).toISOString(),
  actualStartAt: new Date(NOW.getTime() - 47 * 60 * 1000).toISOString(),
  durationSec: null,
  viewCount: 1247,
  concurrentViewers: 1247,
  palette: ["#0d0d0d", "#ef4444", "#7f1d1d"],
  episodeNo: 167,
}));

export const pastStreams: Stream[] = pastTitles.map((title, i) => {
  const daysBack = 3 + i * 4 + Math.floor(i / 3);
  const hour = i % 3 === 0 ? 22 : i % 3 === 1 ? 21 : 14;
  const t = new Date(NOW);
  t.setUTCDate(t.getUTCDate() - daysBack);
  t.setUTCHours(hour - 3, 0, 0, 0);
  const duration = 1800 + ((i * 173) % 7200);
  return {
    id: `past-${i}`,
    kind: "completed",
    title,
    scheduledAt: t.toISOString(),
    actualStartAt: t.toISOString(),
    actualEndAt: new Date(t.getTime() + duration * 1000).toISOString(),
    durationSec: duration,
    viewCount: 800 + ((i * 911) % 18000),
    palette: palettes[(i + 3) % palettes.length],
    episodeNo: 166 - i,
  };
});

export const allStreams: Stream[] = [
  ...liveStreams,
  ...upcomingStreams,
  ...pastStreams,
];

export function getStreamById(id: string): Stream | undefined {
  return allStreams.find((s) => s.id === id);
}
