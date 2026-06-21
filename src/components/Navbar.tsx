"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Gamepad2, Menu, X } from "lucide-react";
import { useState, Suspense } from "react";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";
import AuthButton from "./AuthButton";
import NotificationBell from "./NotificationBell";
import { useUser } from "./SupabaseProvider";

const NAV_BASE = [
  { href: "/", label: "Home", exact: true, authRequired: false },
  { href: "/feed", label: "Feed", authRequired: true },
  { href: "/search?sort=popular", label: "Popular", authRequired: false },
  { href: "/search?sort=new", label: "New", authRequired: false },
  { href: "/genres", label: "Genres", authRequired: false },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useUser();
  const NAV = NAV_BASE.filter((item) => !item.authRequired || !!user);

  function isActive({ href, exact }: { href: string; exact?: boolean }) {
    const [path, qs] = href.split("?");
    if (exact) return pathname === path;
    if (pathname !== path) return false;
    if (!qs) return true;
    // Check if all URL params match the active link
    const params = new URLSearchParams(qs);
    for (const [k, v] of params.entries()) {
      if (searchParams.get(k) !== v) return false;
    }
    return true;
  }

  return (
    <>
      {NAV.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-none"
            style={{
              color: active ? "var(--accent)" : "var(--text-secondary)",
              background: active ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
              fontWeight: active ? 600 : 500,
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useUser();
  const NAV = NAV_BASE.filter((item) => !item.authRequired || !!user);

  function isActive({ href, exact }: { href: string; exact?: boolean }) {
    const [path, qs] = href.split("?");
    if (exact) return pathname === path;
    if (pathname !== path) return false;
    if (!qs) return true;
    const params = new URLSearchParams(qs);
    for (const [k, v] of params.entries()) {
      if (searchParams.get(k) !== v) return false;
    }
    return true;
  }

  return (
    <>
      {NAV.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="px-3 py-2 rounded-xl text-sm font-medium"
            style={{
              color: active ? "var(--accent)" : "var(--text-secondary)",
              background: active ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 glass border-b"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2 shrink-0 mr-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: "var(--accent-gradient)", boxShadow: "var(--shadow-glow)" }}
          >
            <Gamepad2 size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight" style={{ color: "var(--text-primary)" }}>
            Game<span className="text-gradient">Rate</span>
          </span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Suspense fallback={null}>
            <NavLinks />
          </Suspense>
        </div>

        {/* Search */}
        <div className="flex-1 flex justify-end md:justify-center">
          <SearchBar />
        </div>

        {/* Auth */}
        <AuthButton />

        {/* Notifications */}
        <NotificationBell />

        {/* Alternar tema */}
        <ThemeToggle />

        {/* Mobile menu button */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </nav>

      {/* Mobile navigation */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-4 py-3 flex flex-col gap-1"
          style={{ borderColor: "var(--border-subtle)", background: "var(--navbar-bg)" }}
        >
          <Suspense fallback={null}>
            <MobileNavLinks onNavigate={() => setMenuOpen(false)} />
          </Suspense>
        </div>
      )}
    </header>
  );
}
