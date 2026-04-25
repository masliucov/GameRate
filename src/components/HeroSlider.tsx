"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Game } from "@/lib/rawg";

interface Props { games: Game[]; }

export default function HeroSlider({ games }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % games.length), [games.length]);
  const prev = () => setCurrent((c) => (c - 1 + games.length) % games.length);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, paused]);

  if (!games.length) return null;
  const game = games[current];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl select-none"
      style={{ aspectRatio: "21/8", minHeight: 260, maxHeight: 480 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Imagem */}
      {game.background_image && (
        <Image
          key={game.id}
          src={game.background_image}
          alt={game.name}
          fill
          priority
          loading="eager"
          className="object-cover transition-opacity duration-500"
          sizes="100vw"
        />
      )}

      {/* Link que cobre toda a imagem */}
      <Link href={`/games/${game.slug}`} className="absolute inset-0 z-10" aria-label={game.name} />

      {/* Gradiente escuro */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

      {/* Conteúdo */}
      <div className="absolute bottom-0 left-0 p-6 md:p-10 max-w-xl z-20">
        {game.genres?.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {game.genres.slice(0, 2).map((g) => (
              <span
                key={g.id}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}
              >
                {g.name}
              </span>
            ))}
          </div>
        )}
        <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-2">{game.name}</h2>
        <div className="flex items-center gap-3 mb-5">
          {game.rating > 0 && (
            <span className="flex items-center gap-1 text-sm text-white/80">
              <Star size={13} className="fill-yellow-400 text-yellow-400" />
              {game.rating.toFixed(1)}
            </span>
          )}
          {game.metacritic && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-green-500/20 text-green-300">
              MC {game.metacritic}
            </span>
          )}
          {game.released && (
            <span className="text-sm text-white/60">{new Date(game.released).getFullYear()}</span>
          )}
        </div>
        <Link
          href={`/games/${game.slug}`}
          className="inline-block text-sm font-semibold px-5 py-2 rounded-xl text-white transition-opacity hover:opacity-80"
          style={{ background: "var(--accent)" }}
        >
          Ver jogo
        </Link>
      </div>

      {/* Setas de navegação */}
      {["prev", "next"].map((dir) => (
        <button
          key={dir}
          onClick={dir === "prev" ? prev : next}
          className="absolute top-1/2 -translate-y-1/2 rounded-full p-2 transition-all hover:scale-110 z-20"
          style={{
            [dir === "prev" ? "left" : "right"]: 12,
            background: "rgba(0,0,0,0.35)",
            color: "white",
          }}
        >
          {dir === "prev" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      ))}

      {/* Indicadores */}
      <div className="absolute bottom-4 right-6 flex gap-1.5 z-20">
        {games.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all"
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              background: i === current ? "white" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
