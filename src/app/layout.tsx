import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";
import SupabaseProvider from "@/components/SupabaseProvider";
import ScrollToTop from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: "GameRate — Discover and rate video games",
  description: "Your video game database. Discover, search, and follow the best games.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
            GameRate © {new Date().getFullYear()} · Data by{" "}
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
