import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, BookOpen, Gamepad2, Users } from "lucide-react";
import { StarDisplay } from "@/components/RatingModal";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Feed — GameRate" };

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `há ${days}d`;
  return new Date(dateStr).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

interface ActivityItem {
  type: "rating" | "library" | "playing";
  userId: string;
  gameSlug: string;
  gameName: string;
  gameImage: string | null;
  date: string;
  rating?: number;
  review?: string | null;
}

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Ir buscar os IDs dos utilizadores que sigo
  const { data: follows } = await supabaseAdmin
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (follows ?? []).map((f) => f.following_id);

  if (followingIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">👥</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          O teu feed está vazio
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Segue outros utilizadores para ver as suas actividades aqui.
        </p>
        <Link
          href="/search"
          className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          Descobrir utilizadores
        </Link>
      </div>
    );
  }

  // Ir buscar actividades recentes dos utilizadores seguidos
  const [{ data: ratings }, { data: library }, { data: playingData }] = await Promise.all([
    supabaseAdmin
      .from("game_ratings")
      .select("user_id, game_slug, game_name, game_image, rating, review, created_at")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(30),
    supabaseAdmin
      .from("game_library")
      .select("user_id, game_slug, game_name, game_image, added_at")
      .in("user_id", followingIds)
      .order("added_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("game_playing")
      .select("user_id, game_slug, game_name, game_image, added_at")
      .in("user_id", followingIds)
      .order("added_at", { ascending: false })
      .limit(20),
  ]);

  // Ir buscar perfis de todos os utilizadores envolvidos
  const allUserIds = [...new Set([
    ...(ratings ?? []).map((r) => r.user_id),
    ...(library ?? []).map((l) => l.user_id),
    ...(playingData ?? []).map((p) => p.user_id),
  ])];
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", allUserIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Juntar e ordenar todas as actividades por data
  const activities: ActivityItem[] = [
    ...(ratings ?? []).map((r) => ({
      type: "rating" as const,
      userId: r.user_id,
      gameSlug: r.game_slug,
      gameName: r.game_name,
      gameImage: r.game_image,
      date: r.created_at,
      rating: r.rating,
      review: r.review,
    })),
    ...(library ?? []).map((l) => ({
      type: "library" as const,
      userId: l.user_id,
      gameSlug: l.game_slug,
      gameName: l.game_name,
      gameImage: l.game_image,
      date: l.added_at,
    })),
    ...(playingData ?? []).map((p) => ({
      type: "playing" as const,
      userId: p.user_id,
      gameSlug: p.game_slug,
      gameName: p.game_name,
      gameImage: p.game_image,
      date: p.added_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 50);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Users size={22} style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Feed</h1>
        <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Actividade de {followingIds.length} {followingIds.length === 1 ? "utilizador" : "utilizadores"}
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-tertiary)" }}>
          <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
            Ainda não há actividade recente.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activities.map((item, i) => {
            const profile = profileMap.get(item.userId);
            const username = profile?.username ?? "Utilizador";
            const inicial = username[0].toUpperCase();

            return (
              <div
                key={`${item.type}-${item.userId}-${item.gameSlug}-${i}`}
                className="flex gap-3 p-4 rounded-2xl border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
              >
                {/* Avatar do utilizador */}
                <Link href={`/users/${item.userId}`} className="shrink-0">
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-semibold text-white text-sm relative"
                    style={{ background: profile?.avatar_url ? "transparent" : "var(--accent)" }}
                  >
                    {profile?.avatar_url ? (
                      <Image src={profile.avatar_url} alt={username} fill className="object-cover" sizes="36px" />
                    ) : inicial}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  {/* Descrição da acção */}
                  <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                    <Link href={`/users/${item.userId}`} className="font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
                      {username}
                    </Link>
                    {" "}
                    {item.type === "rating" && (
                      <>avaliou com <span className="font-semibold" style={{ color: "var(--accent)" }}>★ {item.rating}/5</span></>
                    )}
                    {item.type === "library" && (
                      <><BookOpen size={13} className="inline mx-0.5" /> adicionou à biblioteca</>
                    )}
                    {item.type === "playing" && (
                      <><Gamepad2 size={13} className="inline mx-0.5" /> está a jogar</>
                    )}
                    <span className="text-xs ml-2" style={{ color: "var(--text-tertiary)" }}>
                      {timeAgo(item.date)}
                    </span>
                  </p>

                  {/* Card do jogo */}
                  <Link
                    href={`/games/${item.gameSlug}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl transition-opacity hover:opacity-80"
                    style={{ background: "var(--bg-subtle)" }}
                  >
                    <div className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-input)" }}>
                      {item.gameImage ? (
                        <Image src={item.gameImage} alt={item.gameName} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">🎮</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {item.gameName}
                      </p>
                      {item.type === "rating" && item.rating && (
                        <StarDisplay rating={item.rating} size={11} />
                      )}
                    </div>
                  </Link>

                  {/* Review (se existir) */}
                  {item.type === "rating" && item.review && (
                    <p className="text-xs mt-2 italic line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      &ldquo;{item.review}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
