"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import RatingModal from "./RatingModal";

interface Props {
  gameSlug: string;
  gameName: string;
  gameImage: string | null;
  rating: number;
  review: string | null;
}

export default function ReviewEditButtons({ gameSlug, gameName, gameImage, rating, review }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("game_ratings").delete().eq("user_id", user.id).eq("game_slug", gameSlug);
    }
    setDeleting(false);
    setConfirming(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-0.5 ml-auto shrink-0">
        {confirming ? (
          <>
            <span className="text-xs mr-1" style={{ color: "var(--text-tertiary)" }}>Are you sure?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs px-2 py-0.5 rounded-lg font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ background: "#ef444420", color: "#ef4444" }}
            >
              {deleting ? "…" : "Yes"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs px-2 py-0.5 rounded-lg font-medium transition-opacity hover:opacity-70 ml-1"
              style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
            >
              No
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowModal(true)}
              className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: "var(--text-tertiary)" }}
              title="Edit review"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: "var(--text-tertiary)" }}
              title="Remove rating"
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>

      {showModal && (
        <RatingModal
          gameSlug={gameSlug}
          gameName={gameName}
          gameImage={gameImage}
          initialRating={rating}
          initialReview={review}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); router.refresh(); }}
        />
      )}
    </>
  );
}
