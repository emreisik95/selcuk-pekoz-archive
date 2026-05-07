import type { Countdown } from "./types";

export function countdown(
  targetISO: string,
  fromDate: Date = new Date(),
): Countdown {
  const ms = new Date(targetISO).getTime() - fromDate.getTime();
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, past: true };
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s, past: false };
}

const TR_DAYS = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];
const TR_MONTHS_SHORT = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];
const TR_MONTHS_LONG = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

// Convert any UTC date to its components in Europe/Istanbul (UTC+3, no DST).
function toTRT(d: Date) {
  const ms = d.getTime() + 3 * 3600 * 1000;
  const t = new Date(ms);
  return {
    year: t.getUTCFullYear(),
    month: t.getUTCMonth(),
    date: t.getUTCDate(),
    day: t.getUTCDay(),
    hours: t.getUTCHours(),
    minutes: t.getUTCMinutes(),
  };
}

export type TRDateParts = {
  weekday: string;
  weekdayShort: string;
  day: number;
  month: string;
  monthLong: string;
  monthIdx: number;
  year: number;
  time: string;
  hour: number;
  iso: string;
};

export function dateTR(iso: string): TRDateParts {
  const d = new Date(iso);
  const t = toTRT(d);
  return {
    weekday: TR_DAYS[t.day],
    weekdayShort: TR_DAYS[t.day].slice(0, 3),
    day: t.date,
    month: TR_MONTHS_SHORT[t.month],
    monthLong: TR_MONTHS_LONG[t.month],
    monthIdx: t.month,
    year: t.year,
    time:
      String(t.hours).padStart(2, "0") +
      ":" +
      String(t.minutes).padStart(2, "0"),
    hour: t.hours,
    iso,
  };
}

export function duration(sec?: number | null): string {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}s ${m}d`;
  return `${m} dk`;
}

export function views(n?: number | null): string {
  if (!n) return "";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + " B";
  return String(n);
}

export function relTR(iso: string, fromDate: Date = new Date()): string {
  const ms = fromDate.getTime() - new Date(iso).getTime();
  if (ms < 0) {
    const a = -ms;
    const d = Math.floor(a / 86400000);
    if (d > 0) return `${d} gün sonra`;
    const h = Math.floor(a / 3600000);
    if (h > 0) return `${h} saat sonra`;
    const m = Math.floor(a / 60000);
    return `${m} dakika sonra`;
  }
  const d = Math.floor(ms / 86400000);
  if (d === 0) return "bugün";
  if (d === 1) return "dün";
  if (d < 7) return `${d} gün önce`;
  if (d < 30) return `${Math.floor(d / 7)} hafta önce`;
  if (d < 365) return `${Math.floor(d / 30)} ay önce`;
  return `${Math.floor(d / 365)} yıl önce`;
}

export const TR_WEEKDAYS_SHORT_MON_FIRST = [
  "PZT",
  "SAL",
  "ÇAR",
  "PER",
  "CUM",
  "CMT",
  "PAZ",
];
