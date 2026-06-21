"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./SupabaseProvider";
import Image from "next/image";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  from_user_id: string;
  read: boolean;
  created_at: string;
  from_profile: { username: string; avatar_url: string | null } | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `${mins}min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const user = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel("notif-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function fetchNotifications() {
    const res = await fetch("/api/notifications");
    if (res.ok) setNotifications(await res.json());
  }

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && notifications.some((n) => !n.read)) {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  if (!user) return null;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full transition-colors"
        style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span
            className="absolute top-0.5 right-0.5 min-w-4 h-4 rounded-full flex items-center justify-center font-bold text-white px-0.5"
            style={{ background: "var(--accent)", fontSize: 9 }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden z-50"
          style={{ background: "var(--bg-elevated)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Notifications</h3>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              No notifications
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => {
                const inicial = (n.from_profile?.username?.[0] ?? "?").toUpperCase();
                return (
                  <Link
                    key={n.id}
                    href={`/users/${n.from_user_id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ background: n.read ? "transparent" : "color-mix(in srgb, var(--accent) 6%, transparent)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden shrink-0 relative flex items-center justify-center font-semibold text-white text-sm"
                      style={{ background: n.from_profile?.avatar_url ? "transparent" : "var(--accent)" }}
                    >
                      {n.from_profile?.avatar_url ? (
                        <Image src={n.from_profile.avatar_url} alt="" fill className="object-cover" sizes="36px" />
                      ) : inicial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                        <span className="font-semibold">{n.from_profile?.username ?? "Someone"}</span>
                        {n.type === "new_follower" && " started following you"}
                        {n.type === "review_like" && " liked your comment"}
                        {n.type === "review_dislike" && " disliked your comment"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
