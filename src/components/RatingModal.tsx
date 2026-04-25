"use client";

import { useState } from "react";
import { X, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./SupabaseProvider";

interface Props {
  gameSlug: string;
  gameName: string;
  gameImage: string | null;
  initialRating: number | null;
  initialReview: string | null;
  onClose: () => void;
  onSave: (rating: number, review: string) => void;
}

const LABELS: Record<string, string> = {
  "0.5": "Horrível", "1": "Muito fraco", "1.5": "Fraco",
  "2": "Mau", "2.5": "Razoável", "3": "Ok",
  "3.5": "Bom", "4": "Muito bom", "4.5": "Ótimo", "5": "Excelente",
};

function HalfStar({ size, filled, half }: { size: number; filled: boolean; half: boolean }) {
  return (
    <div className="relative" style={{ width: size, height: size, flexShrink: 0 }}>
      {/* Estrela vazia (fundo) */}
      <Star size={size} style={{ color: "var(--border)", position: "absolute", top: 0, left: 0 }} />
      {/* Estrela preenchida com clip: 100% cheio, 50% meia estrela, 0% vazio */}
      <div style={{ position: "absolute", top: 0, left: 0, overflow: "hidden", width: filled ? "100%" : half ? "50%" : "0%" }}>
        <Star size={size} className="fill-yellow-400 text-yellow-400" />
      </div>
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  function getVal(e: React.MouseEvent<HTMLButtonElement>, star: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientX - rect.left < rect.width / 2 ? star - 0.5 : star;
  }

  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseMove={(e) => setHovered(getVal(e, s))}
          onClick={(e) => onChange(getVal(e, s))}
          className="transition-transform hover:scale-110 cursor-pointer"
        >
          <HalfStar size={36} filled={display >= s} half={!( display >= s) && display >= s - 0.5} />
        </button>
      ))}
    </div>
  );
}

export function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <HalfStar key={s} size={size} filled={rating >= s} half={!(rating >= s) && rating >= s - 0.5} />
      ))}
    </div>
  );
}

export default function RatingModal({ gameSlug, gameName, gameImage, initialRating, initialReview, onClose, onSave }: Props) {
  const user = useUser();
  const [rating, setRating] = useState<number>(initialRating ?? 0);
  const [review, setReview] = useState(initialReview ?? "");
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  const label = LABELS[String(rating)] ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !user) return;
    setLoading(true);
    setSaveError("");
    const supabase = createClient();

    // Save rating without game_image first (always works)
    const { error } = await supabase.from("game_ratings").upsert(
      { user_id: user.id, game_slug: gameSlug, game_name: gameName, rating, review: review || null },
      { onConflict: "user_id,game_slug" }
    );

    if (error) {
      setSaveError("Erro ao guardar. Tenta novamente.");
      setLoading(false);
      return;
    }

    // Try to save the image separately (column may not exist if SQL hasn't been run yet)
    if (gameImage) {
      await supabase
        .from("game_ratings")
        .update({ game_image: gameImage })
        .eq("user_id", user.id)
        .eq("game_slug", gameSlug)
        .then(() => {});
    }

    onSave(rating, review);
    setLoading(false);
  }

  async function handleDelete() {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("game_ratings").delete().eq("user_id", user.id).eq("game_slug", gameSlug);
    onSave(0, "");
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {initialRating ? "Editar avaliação" : "Avaliar jogo"}
          </h2>
          <button onClick={onClose} className="transition-opacity hover:opacity-60" style={{ color: "var(--text-tertiary)" }}>
            <X size={18} />
          </button>
        </div>

        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>{gameName}</p>

        {/* Stars */}
        <div className="flex justify-center mb-1">
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {/* Label */}
        <p className="text-center text-sm font-medium mb-4 h-5" style={{ color: "var(--accent)" }}>{label}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Escreve uma review (opcional)…"
            rows={3}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
            style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          />
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          <button type="submit" disabled={!rating || loading} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40" style={{ background: "var(--accent)" }}>
            {loading ? "A guardar…" : "Guardar avaliação"}
          </button>
          {initialRating && (
            <button type="button" onClick={handleDelete} disabled={loading} className="w-full py-2 text-sm transition-opacity hover:opacity-70 disabled:opacity-40" style={{ color: "var(--text-tertiary)" }}>
              Remover avaliação
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
