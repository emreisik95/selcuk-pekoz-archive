import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getAllStreams, getNow } from "@/lib/streams";
import { FavoritesBrowser } from "./FavoritesBrowser";

export const revalidate = 60;

export const metadata = {
  title: "Favorilerim",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const streams = await getAllStreams();
  const now = getNow();
  return (
    <>
      <Nav />
      <main className="flex-1">
        <FavoritesBrowser streams={streams} nowISO={now.toISOString()} />
      </main>
      <Footer />
    </>
  );
}
