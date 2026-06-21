"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteReviewButton({ ratingId }: { ratingId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const res = await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ratingId }),
      });
      if (res.ok) router.refresh();
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-[10px] font-bold px-2 py-1 rounded-md text-white"
          style={{ background: "#ef4444" }}
        >
          {pending ? "…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[10px] px-2 py-1 rounded-md"
          style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label="Delete review"
      title="Delete review"
      className="shrink-0 self-start w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
      style={{ color: "#ef4444" }}
    >
      <Trash2 size={14} />
    </button>
  );
}
