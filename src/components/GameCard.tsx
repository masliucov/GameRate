import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Game } from "@/lib/rawg";

interface Props {
  game: Game;
}

function MetaScore({ score }: { score: number }) {
  const color =
    score >= 75 ? { bg: "#dcfce7", text: "#15803d" } :
    score >= 50 ? { bg: "#fef9c3", text: "#854d0e" } :
    { bg: "#fee2e2", text: "#b91c1c" };

  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
      style={{ background: color.bg, color: color.text }}
    >
      {score}
    </span>
  );
}

const PLATFORM_ICONS: Record<string, string> = {
  pc: "🖥",
  playstation: "🎮",
  xbox: "🅧",
  nintendo: "🕹",
  ios: "📱",
  android: "📱",
  mac: "🍎",
  linux: "🐧",
};

export default function GameCard({ game }: Props) {
  return (
    <Link href={`/games/${game.slug}`} className="group block">
      <div
        className="card overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        {/* Cover */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {game.background_image ? (
            <Image
              src={game.background_image}
              alt={game.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🎮</div>
          )}
          {game.metacritic && (
            <div className="absolute top-2 right-2">
              <MetaScore score={game.metacritic} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3">
          <h3
            className="text-sm font-semibold leading-snug mb-1.5 line-clamp-1 transition-colors group-hover:opacity-70"
            style={{ color: "var(--text-primary)" }}
          >
            {game.name}
          </h3>

          <div className="flex items-center justify-between">
            {/* Platforms */}
            <div className="flex gap-0.5">
              {(() => {
                if (!game.platforms?.length) return null;
                const seen = new Set<string>();
                return game.platforms.slice(0, 4).map(({ platform }) => {
                  const key = platform.slug.split("-")[0];
                  if (seen.has(key)) return null;
                  seen.add(key);
                  return (
                    <span key={platform.id} className="text-xs opacity-50" title={platform.name}>
                      {PLATFORM_ICONS[key] ?? "🎮"}
                    </span>
                  );
                });
              })()}
            </div>

            {/* Rating */}
            {game.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {game.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Year + genre */}
          <div className="mt-1.5 flex items-center gap-2">
            {game.released && (
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {new Date(game.released).getFullYear()}
              </span>
            )}
            {game.genres?.[0] && (
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                · {game.genres[0].name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
