import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";
import SupabaseProvider from "@/components/SupabaseProvider";
import ScrollToTop from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: "GameRate — Descobre e avalia videojogos",
  description: "A tua base de dados de videojogos. Descobre, pesquisa e acompanha os melhores jogos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <SupabaseProvider>
          <ScrollToTop />
          <Navbar />
          <main style={{ minHeight: "calc(100vh - 56px)" }}>
            {children}
          </main>
          <footer
            className="border-t mt-20 py-8 text-center text-xs"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}
          >
            GameRate © {new Date().getFullYear()} · Dados por{" "}
            <a
              href="https://rawg.io"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}
            >
              RAWG
            </a>
          </footer>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
