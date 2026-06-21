import Link from "next/link";
import Image from "next/image";
import { Star, Monitor, Gamepad2, Smartphone, Apple, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Game } from "@/lib/rawg";

interface Props {
  game: Game;
}

function MetaScore({ score }: { score: number }) {
  const color =
    score >= 75 ? { bg: "rgba(34,197,94,0.15)", text: "#22c55e", ring: "rgba(34,197,94,0.35)" } :
    score >= 50 ? { bg: "rgba(234,179,8,0.15)", text: "#eab308", ring: "rgba(234,179,8,0.35)" } :
    { bg: "rgba(239,68,68,0.15)", text: "#ef4444", ring: "rgba(239,68,68,0.35)" };

  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm"
      style={{ background: color.bg, color: color.text, boxShadow: `inset 0 0 0 1px ${color.ring}` }}
    >
      {score}
    </span>
  );
}

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  pc: Monitor,
  playstation: Gamepad2,
  xbox: Gamepad2,
  nintendo: Gamepad2,
  ios: Smartphone,
  android: Smartphone,
  mac: Apple,
  linux: Terminal,
};

export default function GameCard({ game }: Props) {
  return (
    <Link
      href={`/games/${game.slug}`}
      aria-label={`View details for ${game.name}`}
      className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-[var(--bg)]"
    >
      <div
        className="card glow-hover overflow-hidden h-full"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Cover */}
        <div className="relative aspect-video overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
          {game.background_image ? (
            <Image
              src={game.background_image}
              alt={game.name}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-30">
              <Gamepad2 size={32} aria-hidden="true" />
            </div>
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
            <div className="flex gap-1.5 items-center">
              {(() => {
                if (!game.platforms?.length) return null;
                const seen = new Set<string>();
                return game.platforms.slice(0, 4).map(({ platform }) => {
                  const key = platform.slug.split("-")[0];
                  if (seen.has(key)) return null;
                  seen.add(key);
                  const Icon = PLATFORM_ICONS[key] ?? Gamepad2;
                  return (
                    <span
                      key={platform.id}
                      className="opacity-60"
                      title={platform.name}
                      aria-label={platform.name}
                    >
                      <Icon size={12} aria-hidden="true" />
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
