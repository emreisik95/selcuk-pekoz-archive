import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Yönetici girişi",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (await isAdmin()) {
    redirect("/admin/panel");
  }
  return (
    <>
      <Nav />
      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <div
            className="font-mono text-[10px] uppercase text-muted mb-2"
            style={{ letterSpacing: "0.12em" }}
          >
            Yönetici girişi
          </div>
          <h1
            className="font-serif text-[28px] font-semibold mb-6"
            style={{ letterSpacing: "-0.025em" }}
          >
            Şifrenle giriş yap
          </h1>
          <LoginForm />
          <p className="mt-6 font-mono text-[11px] text-faint leading-relaxed">
            Şifre <code className="bg-hair/40 px-1">.env.local</code>{" "}
            içindeki <code className="bg-hair/40 px-1">ADMIN_PASSWORD</code>{" "}
            ile ayarlanır.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
