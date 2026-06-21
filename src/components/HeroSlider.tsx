"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Game } from "@/lib/rawg";

interface Props { games: Game[]; }

const SLIDE_INTERVAL_MS = 5500;

export default function HeroSlider({ games }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  const next = useCallback(() => setCurrent((c) => (c + 1) % games.length), [games.length]);
  const prev = () => setCurrent((c) => (c - 1 + games.length) % games.length);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [next, paused]);

  if (!games.length) return null;
  const game = games[current];

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl select-none glass-panel"
      style={{ aspectRatio: "21/8", minHeight: 280, maxHeight: 500 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Image with crossfade + Ken Burns */}
      <AnimatePresence initial={false}>
        <motion.div
          key={game.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: "easeInOut" }}
        >
          {game.background_image && (
            <Image
              src={game.background_image}
              alt={game.name}
              fill
              priority
              className={`object-cover ${reduceMotion ? "" : "animate-kenburns"}`}
              sizes="100vw"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradientes */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

      {/* Link covering the whole image */}
      <Link href={`/games/${game.slug}`} className="absolute inset-0 z-10" aria-label={game.name} />

      {/* Content (animated per slide) — lets clicks pass through to the link */}
      <div className="absolute bottom-0 left-0 p-6 md:p-10 max-w-xl z-20 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={game.id}
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {game.genres?.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {game.genres.slice(0, 2).map((g) => (
                  <span
                    key={g.id}
                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full backdrop-blur-md"
                    style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.95)" }}
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
              {game.name}
            </h2>
            <div className="flex items-center gap-3 mb-5">
              {game.rating > 0 && (
                <span className="flex items-center gap-1 text-sm text-white/85">
                  <Star size={13} className="fill-yellow-400 text-yellow-400" />
                  {game.rating.toFixed(1)}
                </span>
              )}
              {game.metacritic && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-green-500/25 text-green-200">
                  MC {game.metacritic}
                </span>
              )}
              {game.released && (
                <span className="text-sm text-white/60">{new Date(game.released).getFullYear()}</span>
              )}
            </div>
            <span className="btn-accent inline-flex items-center text-sm font-semibold px-5 py-2.5">
              View game
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {["prev", "next"].map((dir) => (
        <button
          key={dir}
          onClick={dir === "prev" ? prev : next}
          aria-label={dir === "prev" ? "Previous slide" : "Next slide"}
          className="absolute top-1/2 -translate-y-1/2 rounded-full p-2.5 z-20 glass transition-transform hover:scale-110"
          style={{
            [dir === "prev" ? "left" : "right"]: 14,
            color: "white",
            border: "1px solid rgba(255,255,255,0.25)",
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
            aria-label={`Go to slide ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 22 : 6,
              height: 6,
              background: i === current ? "#fff" : "rgba(255,255,255,0.4)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
