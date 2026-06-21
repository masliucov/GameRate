"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, Library, Heart, Star, Gamepad2, Rss, Settings, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser, useRole } from "./SupabaseProvider";

const MENU_ITEMS = [
  { href: "/profile?tab=library",  icon: Library,  label: "Library" },
  { href: "/profile?tab=playing",  icon: Gamepad2, label: "Playing" },
  { href: "/profile?tab=wishlist", icon: Heart,    label: "Wishlist" },
  { href: "/profile?tab=ratings",  icon: Star,     label: "Ratings" },
  { href: "/feed",                 icon: Rss,      label: "Feed" },
];

export default function UserMenu() {
  const user = useUser();
  const role = useRole();
  const isAdmin = role === "admin" || role === "super_admin";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
  }

  if (!user) return null;

  const name = user.user_metadata?.username ?? user.email?.split("@")[0] ?? "User";
  const initials = name[0].toUpperCase();
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white transition-opacity hover:opacity-80 relative"
        style={{ background: avatarUrl ? "transparent" : "var(--accent)" }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="32px" />
        ) : initials}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
          style={{ background: "var(--bg-elevated)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-subtle)" }}
        >
          {/* User info */}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div
              className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0 relative"
              style={{ background: avatarUrl ? "transparent" : "var(--accent)" }}
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="36px" />
              ) : initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
              <p className="text-xs" style={{ color: "var(--accent)" }}>Ver perfil →</p>
            </div>
          </Link>

          {/* Links */}
          <div className="p-1.5">
            {MENU_ITEMS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: "var(--text-secondary)" }}
              >
                <Icon size={14} style={{ color: "var(--text-tertiary)" }} />
                {label}
              </Link>
            ))}

            {isAdmin && (
              <>
                <div className="my-1 border-t" style={{ borderColor: "var(--border-subtle)" }} />
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: "var(--accent)" }}
                >
                  <ShieldAlert size={14} />
                  Dashboard de Admin
                </Link>
              </>
            )}

            <div className="my-1 border-t" style={{ borderColor: "var(--border-subtle)" }} />

            <Link
              href="/profile?settings=1"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Settings size={14} style={{ color: "var(--text-tertiary)" }} />
              Settings
            </Link>

            <button
              onClick={signOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-red-500/10"
              style={{ color: "#ef4444" }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
