import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Search as SearchIcon, Ban, CheckCircle2 } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/role";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const me = await requireAdmin();
  const { q = "" } = await searchParams;

  let query = supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url, role, banned_at, banned_reason")
    .order("username", { ascending: true })
    .limit(100);

  if (q.trim()) query = query.ilike("username", `%${q.trim()}%`);
  const { data: profiles } = await query;
  const list = profiles ?? [];

  // Fetch emails + signup dates from auth.users in bulk
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200, page: 1 });
  const authMap = new Map(authData.users.map((u) => [u.id, u]));

  // Count ratings per user
  const ids = list.map((p) => p.id);
  const ratingCounts = new Map<string, number>();
  if (ids.length) {
    const { data: ratings } = await supabaseAdmin
      .from("game_ratings")
      .select("user_id")
      .in("user_id", ids);
    for (const r of ratings ?? []) {
      ratingCounts.set(r.user_id, (ratingCounts.get(r.user_id) ?? 0) + 1);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)22" }}>
          <ShieldAlert size={20} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Admin Dashboard</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            You are signed in as <strong>{me.role}</strong>
          </p>
        </div>
      </div>

      <form action="/admin" method="get" className="mb-5 relative max-w-md">
        <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-tertiary)" }} />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search user by name…"
          className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
          style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
      </form>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        {list.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--text-tertiary)" }}>
            No results.
          </p>
        ) : (
          <div
            className="grid"
            style={{ gridTemplateColumns: "minmax(0,1fr) 120px 90px 110px 110px" }}
          >
            {/* Header row */}
            <div className="contents text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
              <span className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>User</span>
              <span className="px-4 py-3 border-b text-center" style={{ borderColor: "var(--border-subtle)" }}>Role</span>
              <span className="px-4 py-3 border-b text-center" style={{ borderColor: "var(--border-subtle)" }}>Reviews</span>
              <span className="px-4 py-3 border-b text-center" style={{ borderColor: "var(--border-subtle)" }}>Status</span>
              <span className="px-4 py-3 border-b text-right" style={{ borderColor: "var(--border-subtle)" }}>Actions</span>
            </div>

            {list.map((p) => {
              const authUser = authMap.get(p.id);
              const banned = !!p.banned_at;
              return (
                <div key={p.id} className="contents text-sm">
                  <Link
                    href={`/admin/users/${p.id}`}
                    className="px-4 py-3 border-b flex items-center gap-3 min-w-0 group"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden relative flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: p.avatar_url ? "transparent" : "var(--accent)" }}
                    >
                      {p.avatar_url ? (
                        <Image src={p.avatar_url} alt={p.username ?? ""} fill className="object-cover" sizes="36px" />
                      ) : (
                        (p.username?.[0] ?? "?").toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate group-hover:underline" style={{ color: "var(--text-primary)" }}>
                        {p.username ?? "(no name)"}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                        {authUser?.email ?? "—"}
                      </p>
                    </div>
                  </Link>
                  <div className="px-4 py-3 border-b flex items-center justify-center" style={{ borderColor: "var(--border-subtle)" }}>
                    <RoleBadge role={p.role} />
                  </div>
                  <div className="px-4 py-3 border-b flex items-center justify-center tabular-nums" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
                    {ratingCounts.get(p.id) ?? 0}
                  </div>
                  <div className="px-4 py-3 border-b flex items-center justify-center" style={{ borderColor: "var(--border-subtle)" }}>
                    {banned ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                        <Ban size={11} /> Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                        <CheckCircle2 size={11} /> Active
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-3 border-b flex items-center justify-end" style={{ borderColor: "var(--border-subtle)" }}>
                    <Link
                      href={`/admin/users/${p.id}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                      style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const palette =
    role === "super_admin"
      ? { bg: "rgba(168,85,247,0.18)", text: "#a855f7", label: "super_admin" }
      : role === "admin"
        ? { bg: "rgba(59,130,246,0.18)", text: "#3b82f6", label: "admin" }
        : { bg: "var(--bg-input)", text: "var(--text-secondary)", label: "user" };
  return (
    <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ background: palette.bg, color: palette.text }}>
      {palette.label}
    </span>
  );
}
