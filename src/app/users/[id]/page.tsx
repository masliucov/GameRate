import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { StarDisplay } from "@/components/RatingModal";
import FollowSection from "@/components/FollowSection";
import { Library, Heart, Star, Gamepad2 } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin.from("profiles").select("username").eq("id", id).single();
  return { title: data?.username ? `${data.username} — GameRate` : "Profile — GameRate" };
}

const TABS = [
  { key: "library",  label: "Library",      icon: Library },
  { key: "playing",  label: "Playing",          icon: Gamepad2 },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "ratings",  label: "Ratings",       icon: Star },
] as const;

type Tab = typeof TABS[number]["key"];

interface GameEntry {
  id: string;
  game_slug: string;
  game_name: string;
  game_image: string | null;
  rating?: number;
  review?: string | null;
}

function GameCard({ entry, showRating }: { entry: GameEntry; showRating?: boolean }) {
  return (
    <Link
      href={`/games/${entry.game_slug}`}
      className="flex items-center gap-3 p-3 rounded-2xl border transition-opacity hover:opacity-80"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      <div className="relative w-20 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-subtle)" }}>
        {entry.game_image ? (
          <Image src={entry.game_image} alt={entry.game_name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🎮</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{entry.game_name}</p>
        {showRating && entry.rating && (
          <div className="flex items-center gap-2 mt-0.5">
            <StarDisplay rating={entry.rating} size={12} />
            <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{entry.rating}/5</span>
          </div>
        )}
        {showRating && entry.review && (
          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-tertiary)" }}>{entry.review}</p>
        )}
      </div>
    </Link>
  );
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab = "library" } = await searchParams;
  const activeTab = (TABS.some((t) => t.key === tab) ? tab : "library") as Tab;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const [{ data: library }, { data: wishlist }, { data: ratings }, { data: playing }, { count: followersCount }, { count: followingCount }, followCheck] = await Promise.all([
    supabaseAdmin.from("game_library").select("id, game_slug, game_name, game_image").eq("user_id", id).order("added_at", { ascending: false }),
    supabaseAdmin.from("game_wishlist").select("id, game_slug, game_name, game_image").eq("user_id", id).order("added_at", { ascending: false }),
    supabaseAdmin.from("game_ratings").select("id, game_slug, game_name, game_image, rating, review").eq("user_id", id).order("created_at", { ascending: false }),
    supabaseAdmin.from("game_playing").select("id, game_slug, game_name, game_image").eq("user_id", id).order("added_at", { ascending: false }),
    supabaseAdmin.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
    supabaseAdmin.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
    currentUser
      ? supabaseAdmin.from("follows").select("follower_id").eq("follower_id", currentUser.id).eq("following_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const counts = {
    library:  (library  ?? []).length,
    wishlist: (wishlist ?? []).length,
    ratings:  (ratings  ?? []).length,
    playing:  (playing  ?? []).length,
  };
  const isFollowing = !!(followCheck as { data: unknown }).data;

  const current: GameEntry[] =
    activeTab === "library"  ? (library  ?? []) :
    activeTab === "wishlist" ? (wishlist ?? []) :
    activeTab === "playing"  ? (playing  ?? []) :
                               (ratings  ?? []);

  const inicial = (profile.username?.[0] ?? "?").toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <div
          className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-white shrink-0 relative"
          style={{ background: profile.avatar_url ? "transparent" : "var(--accent)" }}
        >
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" sizes="64px" />
          ) : (
            inicial
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{profile.username}</h1>
            <FollowSection
              targetUserId={id}
              initialIsFollowing={isFollowing}
              initialFollowersCount={followersCount ?? 0}
              followingCount={followingCount ?? 0}
              libraryCount={counts.library}
              ratingsCount={counts.ratings}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/users/${id}?tab=${key}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: activeTab === key ? "var(--accent)" : "var(--bg-input)",
              color: activeTab === key ? "#fff" : "var(--text-secondary)",
            }}
          >
            <Icon size={15} />
            {label}
            <span
              className="text-xs rounded-full px-1.5 py-0.5 font-bold"
              style={{
                background: activeTab === key ? "rgba(255,255,255,0.2)" : "var(--border)",
                color: activeTab === key ? "#fff" : "var(--text-tertiary)",
              }}
            >
              {counts[key]}
            </span>
          </Link>
        ))}
      </div>

      {/* Content */}
      {current.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-tertiary)" }}>
          <div className="text-4xl mb-3">
            {activeTab === "library" ? "📚" : activeTab === "wishlist" ? "❤️" : "⭐"}
          </div>
          <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
            {activeTab === "library"  ? `${profile.username} has no games in their library`  :
           activeTab === "wishlist" ? `${profile.username} has no games in their wishlist` :
           activeTab === "playing"  ? `${profile.username} isn't playing any game` :
                                      `${profile.username} hasn't rated any games yet`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {current.map((entry) => (
            <GameCard key={entry.id} entry={entry} showRating={activeTab === "ratings"} />
          ))}
        </div>
      )}
    </div>
  );
}
