"use client";

import { useState } from "react";
import FollowButton from "./FollowButton";
import FollowListModal from "./FollowListModal";

interface Props {
  targetUserId: string;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  followingCount: number;
  libraryCount: number;
  ratingsCount: number;
}

type ModalType = "followers" | "following" | null;

export default function FollowSection({
  targetUserId,
  initialIsFollowing,
  initialFollowersCount,
  followingCount,
  libraryCount,
  ratingsCount,
}: Props) {
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <>
      <FollowButton
        targetUserId={targetUserId}
        initialIsFollowing={initialIsFollowing}
        onFollowersChange={(delta) => setFollowersCount((c) => c + delta)}
      />

      <div className="flex gap-4 mt-1.5 text-xs w-full" style={{ color: "var(--text-tertiary)" }}>
        <button
          onClick={() => setModal("followers")}
          className="hover:underline transition-opacity hover:opacity-70"
        >
          <strong style={{ color: "var(--text-primary)" }}>{followersCount}</strong> followers
        </button>
        <button
          onClick={() => setModal("following")}
          className="hover:underline transition-opacity hover:opacity-70"
        >
          <strong style={{ color: "var(--text-primary)" }}>{followingCount}</strong> following
        </button>
        <span><strong style={{ color: "var(--text-primary)" }}>{libraryCount}</strong> in library</span>
        <span><strong style={{ color: "var(--text-primary)" }}>{ratingsCount}</strong> ratings</span>
      </div>

      {modal && (
        <FollowListModal
          profileId={targetUserId}
          type={modal}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
