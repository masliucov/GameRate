"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Library, Heart, Star, Trash2, Settings, Gamepad2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StarDisplay } from "@/components/RatingModal";
import SettingsModal from "@/components/SettingsModal";
import FollowListModal from "@/components/FollowListModal";

interface GameEntry {
  id: string;
  game_slug: string;
  game_name: string;
  game_image: string | null;
  added_at?: string;
  created_at?: string;
  rating?: number;
  review?: string | null;
}

interface Props {
  user: { id: string; email: string; username: string };
  library: GameEntry[];
  wishlist: GameEntry[];
  ratings: GameEntry[];
  playing: GameEntry[];
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
}

type Tab = "library" | "wishlist" | "ratings" | "playing";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "library",  label: "Library",      icon: <Library size={15} /> },
  { key: "playing",  label: "Playing",          icon: <Gamepad2 size={15} /> },
  { key: "wishlist", label: "Wishlist", icon: <Heart size={15} /> },
  { key: "ratings",  label: "Ratings",       icon: <Star size={15} /> },
];

function GameCard({ entry, onRemove, showRating }: { entry: GameEntry; onRemove: () => void; showRating?: boolean }) {
  const [removing, setRemoving] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
      <Link href={`/games/${entry.game_slug}`} className="shrink-0">
        <div className="relative w-20 h-12 rounded-lg overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
          {entry.game_image ? (
            <Image src={entry.game_image} alt={entry.game_name} fill className="object-cover" sizes="80px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">🎮</div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/games/${entry.game_slug}`}>
          <p className="text-sm font-medium truncate hover:opacity-70 transition-opacity" style={{ color: "var(--text-primary)" }}>
            {entry.game_name}
          </p>
        </Link>
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

      <button
        onClick={() => { setRemoving(true); onRemove(); }}
        disabled={removing}
        className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 disabled:opacity-40 shrink-0"
        style={{ color: "var(--text-tertiary)" }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function ProfileContent({ user, library: initialLibrary, wishlist: initialWishlist, ratings: initialRatings, playing: initialPlaying, avatarUrl: initialAvatarUrl, followersCount, followingCount }: Props) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) ?? "library");
  const [showSettings, setShowSettings] = useState(searchParams.get("settings") === "1");
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    const t = searchParams.get("tab") as Tab | null;
    if (t) setTab(t);
    if (searchParams.get("settings") === "1") setShowSettings(true);
  }, [searchParams]);
  const [library, setLibrary]   = useState(initialLibrary);
  const [wishlist, setWishlist] = useState(initialWishlist);
  const [ratings, setRatings]   = useState(initialRatings);
  const [playing, setPlaying]   = useState(initialPlaying);
  const [displayName, setDisplayName] = useState(user.username || user.email.split("@")[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);

  const supabase = createClient();

  async function removeFromLibrary(slug: string) {
    await supabase.from("game_library").delete().eq("user_id", user.id).eq("game_slug", slug);
    setLibrary((p) => p.filter((g) => g.game_slug !== slug));
  }
  async function removeFromWishlist(slug: string) {
    await supabase.from("game_wishlist").delete().eq("user_id", user.id).eq("game_slug", slug);
    setWishlist((p) => p.filter((g) => g.game_slug !== slug));
  }
  async function removeRating(slug: string) {
    await supabase.from("game_ratings").delete().eq("user_id", user.id).eq("game_slug", slug);
    setRatings((p) => p.filter((g) => g.game_slug !== slug));
  }
  async function removePlaying(slug: string) {
    await supabase.from("game_playing").delete().eq("user_id", user.id).eq("game_slug", slug);
    setPlaying((p) => p.filter((g) => g.game_slug !== slug));
  }

  // Stats calculated from ratings
  const mediaNotas = ratings.length
    ? ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / ratings.length
    : null;
  const distribuicao = [5, 4, 3, 2, 1].map((n) => ({
    n,
    total: ratings.filter((r) => Math.round(r.rating ?? 0) === n).length,
  }));
  const maxDist = Math.max(...distribuicao.map((d) => d.total), 1);

  const initials = displayName[0].toUpperCase();
  const current =
    tab === "library"  ? library  :
    tab === "wishlist" ? wishlist :
    tab === "playing"  ? playing  : ratings;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-white shrink-0 relative"
          style={{ background: avatarUrl ? "transparent" : "var(--accent)" }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="64px" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>{displayName}</h1>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
              style={{ color: "var(--text-tertiary)" }}
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
          <p className="text-sm truncate" style={{ color: "var(--text-tertiary)" }}>{user.email}</p>
          <div className="flex gap-4 mt-1 text-xs flex-wrap" style={{ color: "var(--text-tertiary)" }}>
            <button onClick={() => setFollowModal("followers")} className="hover:underline hover:opacity-70 transition-opacity">
              <strong style={{ color: "var(--text-primary)" }}>{followersCount}</strong> followers
            </button>
            <button onClick={() => setFollowModal("following")} className="hover:underline hover:opacity-70 transition-opacity">
              <strong style={{ color: "var(--text-primary)" }}>{followingCount}</strong> following
            </button>
            <span><strong style={{ color: "var(--text-primary)" }}>{library.length}</strong> in library</span>
            <span><strong style={{ color: "var(--text-primary)" }}>{ratings.length}</strong> ratings</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {ratings.length > 0 && (
        <div
          className="rounded-2xl p-4 mb-6 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
            Statistics
          </p>
          <div className="flex items-start gap-8 flex-wrap">
            {/* Average */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
                {mediaNotas!.toFixed(1)}
              </span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>average given</span>
            </div>
            {/* Distribution */}
            <div className="flex flex-col gap-1 flex-1 min-w-40">
              {distribuicao.map(({ n, total }) => (
                <div key={n} className="flex items-center gap-2">
                  <span className="text-xs w-5 text-right shrink-0" style={{ color: "var(--text-tertiary)" }}>{n}★</span>
                  <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: "var(--bg-input)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.round((total / maxDist) * 100)}%`, background: "var(--accent)", opacity: 0.65 + (n / 5) * 0.35 }}
                    />
                  </div>
                  <span className="text-xs w-4 shrink-0" style={{ color: "var(--text-tertiary)" }}>{total}</span>
                </div>
              ))}
            </div>
            {/* Totais */}
            <div className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              <span><strong style={{ color: "var(--text-primary)" }}>{library.length}</strong> in library</span>
              <span><strong style={{ color: "var(--text-primary)" }}>{playing.length}</strong> a jogar</span>
              <span><strong style={{ color: "var(--text-primary)" }}>{wishlist.length}</strong> na wishlist</span>
              <span><strong style={{ color: "var(--text-primary)" }}>{ratings.length}</strong> ratings</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(({ key, label, icon }) => {
          const count =
            key === "library"  ? library.length  :
            key === "wishlist" ? wishlist.length  :
            key === "playing"  ? playing.length   : ratings.length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: tab === key ? "var(--accent)" : "var(--bg-input)",
                color: tab === key ? "#fff" : "var(--text-secondary)",
              }}
            >
              {icon} {label}
              <span className="text-xs rounded-full px-1.5 py-0.5 font-bold"
                style={{ background: tab === key ? "rgba(255,255,255,0.2)" : "var(--border)", color: tab === key ? "#fff" : "var(--text-tertiary)" }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {current.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-tertiary)" }}>
          <div className="text-4xl mb-3">{tab === "library" ? "📚" : tab === "wishlist" ? "❤️" : "⭐"}</div>
          <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
            {tab === "library" ? "Your library is empty" : tab === "wishlist" ? "Your wishlist is empty" : tab === "playing" ? "You're not playing any game" : "You haven't rated any games yet"}
          </p>
          <p className="text-sm mt-1">
            <Link href="/" className="underline" style={{ color: "var(--accent)" }}>Explore games</Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {current.map((entry) => (
            <GameCard
              key={entry.id}
              entry={entry}
              showRating={tab === "ratings"}
              onRemove={() => {
                if (tab === "library") removeFromLibrary(entry.game_slug);
                else if (tab === "wishlist") removeFromWishlist(entry.game_slug);
                else if (tab === "playing") removePlaying(entry.game_slug);
                else removeRating(entry.game_slug);
              }}
            />
          ))}
        </div>
      )}

      {followModal && (
        <FollowListModal
          profileId={user.id}
          type={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          user={{ ...user, avatarUrl }}
          onClose={() => setShowSettings(false)}
          onSave={(newName) => setDisplayName(newName)}
          onAvatarChange={(url) => setAvatarUrl(url)}
        />
      )}
    </div>
  );
}

export default function ProfileClient(props: Props) {
  return (
    <Suspense fallback={null}>
      <ProfileContent {...props} />
    </Suspense>
  );
}
