import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Calendar, Mail } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/role";
import AdminUserActions from "./AdminUserActions";
import DeleteReviewButton from "./DeleteReviewButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const me = await requireAdmin();
  const { id } = await params;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url, role, banned_at, banned_reason")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);

  const { data: ratings } = await supabaseAdmin
    .from("game_ratings")
    .select("id, game_slug, game_name, game_image, rating, review, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm mb-5 transition-opacity hover:opacity-70"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {/* Header: profile card */}
      <div
        className="rounded-2xl p-5 flex items-start gap-4 mb-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl overflow-hidden relative flex items-center justify-center text-xl font-bold text-white shrink-0"
          style={{ background: profile.avatar_url ? "transparent" : "var(--accent)" }}
        >
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.username ?? ""} fill className="object-cover" sizes="64px" />
          ) : (
            (profile.username?.[0] ?? "?").toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {profile.username ?? "(no name)"}
            </h1>
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
              style={{
                background:
                  profile.role === "super_admin" ? "rgba(168,85,247,0.18)" :
                  profile.role === "admin" ? "rgba(59,130,246,0.18)" : "var(--bg-input)",
                color:
                  profile.role === "super_admin" ? "#a855f7" :
                  profile.role === "admin" ? "#3b82f6" : "var(--text-secondary)",
              }}
            >
              {profile.role}
            </span>
            {profile.banned_at && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                Banned
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-col gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-2"><Mail size={13} /> {authUser?.user?.email ?? "—"}</span>
            {authUser?.user?.created_at && (
              <span className="flex items-center gap-2">
                <Calendar size={13} /> Registado a {new Date(authUser.user.created_at).toLocaleDateString("en-US")}
              </span>
            )}
            <span className="flex items-center gap-2"><Star size={13} /> {ratings?.length ?? 0} ratings</span>
            {profile.banned_at && profile.banned_reason && (
              <span className="text-xs mt-1" style={{ color: "#ef4444" }}>
                Motivo: {profile.banned_reason}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/users/${profile.id}`}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
        >
          View public profile
        </Link>
      </div>

      {/* Action panel (client) */}
      <AdminUserActions
        userId={profile.id}
        currentRole={profile.role}
        isBanned={!!profile.banned_at}
        myRole={me.role}
        isSelf={me.id === profile.id}
      />

      {/* Reviews */}
      <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: "var(--text-primary)" }}>
        Ratings and reviews
      </h2>
      {(ratings?.length ?? 0) === 0 ? (
        <p className="text-sm py-6 text-center rounded-2xl" style={{ color: "var(--text-tertiary)", background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          This user hasn't rated any games yet.
        </p>
      ) : (
        <div className="space-y-2">
          {(ratings ?? []).map((r) => (
            <div
              key={r.id}
              className="rounded-2xl p-4 flex gap-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              {r.game_image && (
                <Link href={`/games/${r.game_slug}`} className="shrink-0">
                  <Image src={r.game_image} alt={r.game_name ?? ""} width={64} height={36} className="rounded-md object-cover" />
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/games/${r.game_slug}`} className="text-sm font-semibold truncate hover:underline" style={{ color: "var(--text-primary)" }}>
                    {r.game_name ?? r.game_slug}
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{r.rating}</span>
                  </div>
                </div>
                {r.review && (
                  <p className="text-sm mt-1.5 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                    {r.review}
                  </p>
                )}
                <p className="text-[10px] mt-2" style={{ color: "var(--text-tertiary)" }}>
                  {new Date(r.created_at).toLocaleString("en-US")}
                </p>
              </div>
              <DeleteReviewButton ratingId={r.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
