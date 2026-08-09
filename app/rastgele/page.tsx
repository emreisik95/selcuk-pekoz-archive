import { redirect } from "next/navigation";
import { getPastStreams } from "@/lib/streams";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rastgele yayın",
  robots: { index: false, follow: true },
};

export default async function RastgelePage() {
  const past = await getPastStreams();
  if (past.length === 0) redirect("/arsiv");
  const pick = past[Math.floor(Math.random() * past.length)];
  redirect(`/y/${pick.id}`);
}
