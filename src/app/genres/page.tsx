import { getGenres } from "@/lib/rawg";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Géneros — GameRate",
};

const GENRE_EMOJI: Record<string, string> = {
  action: "⚔️", adventure: "🗺️", rpg: "🧙", shooter: "🔫",
  strategy: "♟️", puzzle: "🧩", racing: "🏎️", sports: "⚽",
  simulation: "🏗️", platformer: "🕹️", fighting: "🥊",
  arcade: "👾", indie: "💡", family: "👨‍👩‍👧", casual: "🎈",
  "massively-multiplayer": "🌍", "board-games": "🎲",
  "card-games": "🃏", educational: "📚",
};

export default async function GenresPage() {
  const { results } = await getGenres();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Géneros</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Explora jogos por categoria
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {results.map((genre) => (
          <Link
            key={genre.id}
            href={`/genres/${genre.slug}`}
            className="card flex flex-col items-center justify-center py-6 px-4 text-center group"
            style={{ background: "var(--bg-card)" }}
          >
            <span className="text-3xl mb-2">{GENRE_EMOJI[genre.slug] ?? "🎮"}</span>
            <span
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              {genre.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
