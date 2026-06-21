"use client";

import { useState, useEffect } from "react";
import { BookOpen, Heart, Star, Gamepad2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./SupabaseProvider";
import AuthModal from "./AuthModal";
import RatingModal from "./RatingModal";

interface Props {
  gameSlug: string;
  gameName: string;
  gameImage: string | null;
}

export default function GameActions({ gameSlug, gameName, gameImage }: Props) {
  const user = useUser();
  const router = useRouter();
  const [inLibrary,  setInLibrary]  = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [inPlaying,  setInPlaying]  = useState(false);
  const [myRating,   setMyRating]   = useState<number | null>(null);
  const [myReview,   setMyReview]   = useState<string | null>(null);
  const [showAuth,   setShowAuth]   = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelado = false;
    const supabase = createClient();
    Promise.all([
      supabase.from("game_library").select("id").eq("user_id", user.id).eq("game_slug", gameSlug).maybeSingle(),
      supabase.from("game_wishlist").select("id").eq("user_id", user.id).eq("game_slug", gameSlug).maybeSingle(),
      supabase.from("game_playing").select("id").eq("user_id", user.id).eq("game_slug", gameSlug).maybeSingle(),
      supabase.from("game_ratings").select("rating, review").eq("user_id", user.id).eq("game_slug", gameSlug).maybeSingle(),
    ]).then(([lib, wish, playing, rating]) => {
      if (cancelado) return;
      setInLibrary(!!lib.data);
      setInWishlist(!!wish.data);
      setInPlaying(!!playing.data);
      setMyRating(rating.data?.rating ?? null);
      setMyReview(rating.data?.review ?? null);
      setLoading(false);
    });
    return () => { cancelado = true; };
  }, [user, gameSlug]);

  async function toggleLibrary() {
    if (!user) { setShowAuth(true); return; }
    const supabase = createClient();
    if (inLibrary) {
      await supabase.from("game_library").delete().eq("user_id", user.id).eq("game_slug", gameSlug);
      setInLibrary(false);
    } else {
      await supabase.from("game_library").insert({ user_id: user.id, game_slug: gameSlug, game_name: gameName, game_image: gameImage });
      setInLibrary(true);
      if (inWishlist) {
        await supabase.from("game_wishlist").delete().eq("user_id", user.id).eq("game_slug", gameSlug);
        setInWishlist(false);
      }
      if (inPlaying) {
        await supabase.from("game_playing").delete().eq("user_id", user.id).eq("game_slug", gameSlug);
        setInPlaying(false);
      }
    }
  }

  async function toggleWishlist() {
    if (!user) { setShowAuth(true); return; }
    if (inLibrary) return;
    const supabase = createClient();
    if (inWishlist) {
      await supabase.from("game_wishlist").delete().eq("user_id", user.id).eq("game_slug", gameSlug);
      setInWishlist(false);
    } else {
      await supabase.from("game_wishlist").insert({ user_id: user.id, game_slug: gameSlug, game_name: gameName, game_image: gameImage });
      setInWishlist(true);
    }
  }

  async function togglePlaying() {
    if (!user) { setShowAuth(true); return; }
    const supabase = createClient();
    if (inPlaying) {
      await supabase.from("game_playing").delete().eq("user_id", user.id).eq("game_slug", gameSlug);
      setInPlaying(false);
    } else {
      await supabase.from("game_playing").insert({ user_id: user.id, game_slug: gameSlug, game_name: gameName, game_image: gameImage });
      setInPlaying(true);
      // Remove from wishlist if it was there
      if (inWishlist) {
        await supabase.from("game_wishlist").delete().eq("user_id", user.id).eq("game_slug", gameSlug);
        setInWishlist(false);
      }
    }
  }

  function handleRatingSave(rating: number, review: string) {
    setMyRating(rating || null);
    setMyReview(review || null);
    setShowRating(false);
    // Refresh server components (ReviewsSection) without a full page reload
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {/* Library */}
        <button
          onClick={toggleLibrary}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style={{
            background: inLibrary ? "var(--accent)" : "var(--bg-input)",
            color: inLibrary ? "#fff" : "var(--text-secondary)",
            border: `1px solid ${inLibrary ? "transparent" : "var(--border)"}`,
          }}
        >
          <BookOpen size={15} />
          {inLibrary ? "In library ✓" : "Add to library"}
        </button>

        {/* A jogar */}
        <button
          onClick={togglePlaying}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style={{
            background: inPlaying ? "#8b5cf615" : "var(--bg-input)",
            color: inPlaying ? "#8b5cf6" : "var(--text-secondary)",
            border: `1px solid ${inPlaying ? "#8b5cf630" : "var(--border)"}`,
          }}
        >
          <Gamepad2 size={15} />
          {inPlaying ? "Playing ✓" : "Playing"}
        </button>

        {/* Wishlist */}
        <button
          onClick={toggleWishlist}
          disabled={loading || inLibrary}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style={{
            background: inWishlist ? "#ef444415" : "var(--bg-input)",
            color: inWishlist ? "#ef4444" : "var(--text-secondary)",
            border: `1px solid ${inWishlist ? "#ef444430" : "var(--border)"}`,
          }}
        >
          <Heart size={15} className={inWishlist ? "fill-red-500" : ""} />
          {inWishlist ? "In wishlist ✓" : "Wishlist"}
        </button>

        {/* Rate */}
        <button
          onClick={() => user ? setShowRating(true) : setShowAuth(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style={{
            background: myRating ? "#facc1515" : "var(--bg-input)",
            color: myRating ? "#d97706" : "var(--text-secondary)",
            border: `1px solid ${myRating ? "#facc1530" : "var(--border)"}`,
          }}
        >
          <Star size={15} className={myRating ? "fill-yellow-400 text-yellow-400" : ""} />
          {myRating ? `Your rating: ${myRating}/5` : "Rate"}
        </button>
      </div>

      {!user && !loading && (
        <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
          <button onClick={() => setShowAuth(true)} className="underline" style={{ color: "var(--accent)" }}>Entra</button>{" "}
          to add to your library or rate.
        </p>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showRating && (
        <RatingModal
          gameSlug={gameSlug}
          gameName={gameName}
          gameImage={gameImage}
          initialRating={myRating}
          initialReview={myReview}
          onClose={() => setShowRating(false)}
          onSave={handleRatingSave}
        />
      )}
    </>
  );
}
