"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./SupabaseProvider";
import { useRouter } from "next/navigation";

interface Props {
  reviewId: string;
  reviewOwnerId: string;
  initialLikes: number;
  initialDislikes: number;
  initialUserReaction: "like" | "dislike" | null;
}

export default function ReviewReactions({ reviewId, reviewOwnerId, initialLikes, initialDislikes, initialUserReaction }: Props) {
  const user = useUser();
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(initialUserReaction);
  const [loading, setLoading] = useState(false);

  async function handleReaction(reaction: "like" | "dislike") {
    if (!user || loading) return;
    setLoading(true);
    const supabase = createClient();
    const isSame = userReaction === reaction;

    // Optimistic update
    if (isSame) {
      if (reaction === "like") setLikes((l) => l - 1);
      else setDislikes((d) => d - 1);
      setUserReaction(null);
    } else {
      if (userReaction === "like") setLikes((l) => l - 1);
      if (userReaction === "dislike") setDislikes((d) => d - 1);
      if (reaction === "like") setLikes((l) => l + 1);
      else setDislikes((d) => d + 1);
      setUserReaction(reaction);
    }

    let error;
    if (isSame) {
      ({ error } = await supabase.from("review_reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("review_id", reviewId));
    } else {
      ({ error } = await supabase.from("review_reactions")
        .upsert(
          { user_id: user.id, review_id: reviewId, reaction },
          { onConflict: "user_id,review_id" }
        ));
    }

    if (error) {
      setLikes(initialLikes);
      setDislikes(initialDislikes);
      setUserReaction(initialUserReaction);
    } else {
      // Notify the review owner (only on add/change, not on remove, and not on own review)
      if (!isSame && user.id !== reviewOwnerId) {
        await supabase.from("notifications").insert({
          user_id: reviewOwnerId,
          type: reaction === "like" ? "review_like" : "review_dislike",
          from_user_id: user.id,
        });
      }
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <button
        onClick={() => handleReaction("like")}
        disabled={!user}
        title={!user ? "Entra para reagir" : undefined}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all disabled:cursor-default"
        style={{
          background: userReaction === "like" ? "var(--accent)22" : "var(--bg-input)",
          color: userReaction === "like" ? "var(--accent)" : "var(--text-tertiary)",
        }}
      >
        <ThumbsUp size={12} className={userReaction === "like" ? "fill-current" : ""} />
        {likes > 0 && <span>{likes}</span>}
      </button>

      <button
        onClick={() => handleReaction("dislike")}
        disabled={!user}
        title={!user ? "Entra para reagir" : undefined}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all disabled:cursor-default"
        style={{
          background: userReaction === "dislike" ? "#ef444420" : "var(--bg-input)",
          color: userReaction === "dislike" ? "#ef4444" : "var(--text-tertiary)",
        }}
      >
        <ThumbsDown size={12} className={userReaction === "dislike" ? "fill-current" : ""} />
        {dislikes > 0 && <span>{dislikes}</span>}
      </button>
    </div>
  );
}
