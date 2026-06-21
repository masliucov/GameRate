import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { StarDisplay } from "@/components/RatingModal";
import ReviewEditButtons from "@/components/ReviewEditButtons";
import ReviewReactions from "@/components/ReviewReactions";
import Image from "next/image";
import Link from "next/link";

// Converts a date to relative time string
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const dias = Math.floor(diff / 86400000);
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `${dias} days ago`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `${meses} ${meses === 1 ? "month" : "months"} ago`;
  const anos = Math.floor(meses / 12);
  return `${anos} ${anos === 1 ? "year" : "years"} ago`;
}

// User avatar: profile photo or initials with accent color
function Avatar({ username, avatarUrl, size = 36 }: { username: string; avatarUrl: string | null; size?: number }) {
  const inicial = (username[0] ?? "?").toUpperCase();
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center font-semibold text-white shrink-0 relative"
      style={{ width: size, height: size, fontSize: size * 0.38, background: avatarUrl ? "transparent" : "var(--accent)" }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={username} fill className="object-cover" sizes={`${size}px`} />
      ) : (
        inicial
      )}
    </div>
  );
}

export default async function ReviewsSection({
  gameSlug,
  gameName,
  gameImage,
}: {
  gameSlug: string;
  gameName: string;
  gameImage: string | null;
}) {
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Fetch all ratings for this game, newest first
  const { data: avaliacoes } = await supabase
    .from("game_ratings")
    .select("id, user_id, rating, review, created_at")
    .eq("game_slug", gameSlug)
    .order("created_at", { ascending: false });

  if (!avaliacoes?.length) return null;

  // Always show the current user's review at the top
  const ordenadas = currentUser
    ? [...avaliacoes].sort((a, b) =>
        a.user_id === currentUser.id ? -1 : b.user_id === currentUser.id ? 1 : 0
      )
    : avaliacoes;

  // Fetch profiles for all users who rated — uses admin client to bypass RLS
  const userIds = [...new Set(avaliacoes.map((a) => a.user_id))];
  const { data: perfis } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  // Map for quick profile lookup by user_id
  const perfilMap = new Map((perfis ?? []).map((p) => [p.id, p]));

  // Fetch all reactions (likes/dislikes) for this game's reviews
  const reviewIds = avaliacoes.map((a) => a.id);
  const { data: reactions } = await supabaseAdmin
    .from("review_reactions")
    .select("review_id, user_id, reaction")
    .in("review_id", reviewIds);

  // Group reactions by review_id
  const reactionsMap = new Map<string, { likes: number; dislikes: number; userReaction: "like" | "dislike" | null }>();
  for (const id of reviewIds) {
    const rr = reactions?.filter((r) => r.review_id === id) ?? [];
    reactionsMap.set(id, {
      likes: rr.filter((r) => r.reaction === "like").length,
      dislikes: rr.filter((r) => r.reaction === "dislike").length,
      userReaction: (rr.find((r) => r.user_id === currentUser?.id)?.reaction ?? null) as "like" | "dislike" | null,
    });
  }

  // Average score and distribution by star level (1–5)
  const media = avaliacoes.reduce((soma, a) => soma + a.rating, 0) / avaliacoes.length;
  const contagem = [5, 4, 3, 2, 1].map((estrelas) => ({
    estrelas,
    total: avaliacoes.filter((a) => Math.round(a.rating) === estrelas).length,
  }));
  const maxContagem = Math.max(...contagem.map((c) => c.total), 1);

  return (
    <div
      className="rounded-2xl p-6 border"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header with overall average */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Community ratings
        </h2>
        <div className="flex items-center gap-2">
          <StarDisplay rating={media} size={13} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {media.toFixed(1)}
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            ({avaliacoes.length} {avaliacoes.length === 1 ? "rating" : "ratings"})
          </span>
        </div>
      </div>

      {/* Distribution chart */}
      <div className="mb-5 flex flex-col gap-1.5">
        {contagem.map(({ estrelas, total }) => {
          const pct = Math.round((total / maxContagem) * 100);
          return (
            <div key={estrelas} className="flex items-center gap-2">
              <span className="text-xs w-6 text-right shrink-0 font-medium" style={{ color: "var(--text-secondary)" }}>
                {estrelas}★
              </span>
              <div className="rounded-full overflow-hidden h-2" style={{ width: 120, background: "var(--bg-input)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: "var(--accent)", opacity: 0.7 + (estrelas / 5) * 0.3 }}
                />
              </div>
              <span className="text-xs w-5 shrink-0" style={{ color: "var(--text-tertiary)" }}>
                {total}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mb-5 border-t" style={{ borderColor: "var(--border-subtle)" }} />

      {/* Ratings list */}
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {ordenadas.map((a) => {
          const perfil = perfilMap.get(a.user_id);
          const username = perfil?.username ?? "User";
          const avatarUrl = perfil?.avatar_url ?? null;
          const isOwn = currentUser?.id === a.user_id;
          const reactionData = reactionsMap.get(a.id) ?? { likes: 0, dislikes: 0, userReaction: null };

          return (
            <div key={a.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <Avatar username={username} avatarUrl={avatarUrl} size={36} />
              <div className="flex-1 min-w-0">
                {/* Name, stars, date and edit buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/users/${a.user_id}`} className="text-sm font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                    {username}
                  </Link>
                  <StarDisplay rating={a.rating} size={12} />
                  <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{a.rating}/5</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{timeAgo(a.created_at)}</span>
                  {isOwn && (
                    <ReviewEditButtons
                      gameSlug={gameSlug}
                      gameName={gameName}
                      gameImage={gameImage}
                      rating={a.rating}
                      review={a.review}
                    />
                  )}
                </div>
                {/* Comment (optional) */}
                {a.review && (
                  <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {a.review}
                  </p>
                )}
                <ReviewReactions
                  reviewId={a.id}
                  reviewOwnerId={a.user_id}
                  initialLikes={reactionData.likes}
                  initialDislikes={reactionData.dislikes}
                  initialUserReaction={reactionData.userReaction}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
