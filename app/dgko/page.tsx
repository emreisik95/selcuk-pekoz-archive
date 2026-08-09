import type { Metadata } from "next";
import { getShorts } from "@/lib/shorts";
import { getAllStreams } from "@/lib/streams";
import { getBirthdayYearStats } from "@/lib/dgko-year";
import { BirthdayExperience, type BirthdayShort } from "./BirthdayExperience";
import "./dgko.css";

export const metadata: Metadata = {
  title: "İyi ki doğdun Selçuk Peköz",
  description: "Selçuk Peköz için bir yıllık sinematik Nintendo zaman tüneli.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "İyi ki doğdun Selçuk Peköz",
    description: "Bir yıl. Seksen kısa hikâye. Yeni bir tur.",
    url: "https://sp.emre.zip/dgko",
  },
  twitter: {
    card: "summary",
    title: "İyi ki doğdun Selçuk Peköz",
    description: "Bir yıl. Seksen kısa hikâye. Yeni bir tur.",
  },
};

const CURATED_IDS = [
  "nYwFmfSxUM8",
  "XIuS8SRVYS4",
  "y1_mBBN_jw4",
  "pD_GqCT4QDU",
  "o8uHdMdG04I",
  "LwoL_HneuIU",
  "AAXZDmvv3Ag",
  "f7bRe-qC_RM",
] as const;

export default async function DgkoPage() {
  const shorts = getShorts();
  const yearStats = getBirthdayYearStats(
    await getAllStreams(),
    shorts,
    new Date("2025-07-23T00:00:00+03:00"),
    new Date("2026-07-24T00:00:00+03:00"),
  );
  const byId = new Map(shorts.map((short) => [short.id, short]));
  const selected = CURATED_IDS.map((id) => byId.get(id)).filter(
    (short) => short !== undefined,
  );
  const fallback = shorts.filter(
    (short) => !selected.some((selectedShort) => selectedShort.id === short.id),
  );
  const items = [...selected, ...fallback].slice(0, 8).map(
    (short): BirthdayShort => ({
      id: short.id,
      title: short.title.replace(/\s*#\S+/g, "").trim(),
      publishedAt: short.publishedAt,
      thumbnailUrl: short.thumbnailUrl,
      videoUrl: `/dgko/videos/${short.id}.mp4`,
    }),
  );

  return <BirthdayExperience shorts={items} yearStats={yearStats} />;
}
