"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./SupabaseProvider";

interface Props {
  targetUserId: string;
  initialIsFollowing: boolean;
  onFollowersChange?: (delta: number) => void;
}

export default function FollowButton({ targetUserId, initialIsFollowing, onFollowersChange }: Props) {
  const user = useUser();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  if (!user || user.id === targetUserId) return null;

  async function handleFollow() {
    if (!user || loading) return;
    setLoading(true);
    const supabase = createClient();

    if (isFollowing) {
      const { error } = await supabase.from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      if (!error) {
        setIsFollowing(false);
        onFollowersChange?.(-1);
      }
    } else {
      const { error } = await supabase.from("follows")
        .insert({ follower_id: user.id, following_id: targetUserId });
      if (!error) {
        setIsFollowing(true);
        onFollowersChange?.(1);
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: "new_follower",
          from_user_id: user.id,
        });
      }
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
      style={{
        background: isFollowing ? "var(--bg-input)" : "var(--accent)",
        color: isFollowing ? "var(--text-secondary)" : "#fff",
        border: `1px solid ${isFollowing ? "var(--border)" : "transparent"}`,
      }}
    >
      {isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
      {isFollowing ? "A seguir" : "Seguir"}
    </button>
  );
}
