"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Star, User } from "lucide-react";
import { Game } from "@/lib/rawg";

const API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY!;

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setGames([]);
      setUsers([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();

    Promise.all([
      fetch(
        `https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(q)}&page_size=5&search_precise=true&ordering=-ratings_count&exclude_additions=true`,
        { signal: controller.signal }
      ).then((r) => r.json()).then((d) => d.results ?? []).catch(() => []),

      fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => r.json()).catch(() => []),
    ]).then(([gameResults, userResults]) => {
      setGames(gameResults);
      setUsers(userResults);
      setOpen(true);
      setActiveIndex(-1);
    }).finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Navigable items: users first, then games
  const allItems = [
    ...users.map((u) => ({ type: "user" as const, data: u })),
    ...games.map((g) => ({ type: "game" as const, data: g })),
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    setQuery("");
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleSelectGame(game: Game) {
    setOpen(false);
    setQuery("");
    router.push(`/games/${game.slug}`);
  }

  function handleSelectUser(user: UserProfile) {
    setOpen(false);
    setQuery("");
    router.push(`/users/${user.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || !allItems.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const item = allItems[activeIndex];
      if (item.type === "user") handleSelectUser(item.data as UserProfile);
      else handleSelectGame(item.data as Game);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const clear = useCallback(() => {
    setQuery("");
    setGames([]);
    setUsers([]);
    setOpen(false);
    inputRef.current?.focus();
  }, []);

  const hasResults = games.length > 0 || users.length > 0;
  let itemIndex = 0;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-sm">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search
            size={14}
            className="absolute left-3 pointer-events-none"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => hasResults && setOpen(true)}
            placeholder="Search games or users…"
            autoComplete="off"
            className="w-full rounded-xl pl-8 pr-8 py-2 text-sm outline-none transition-all"
            style={{
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--border)";
            }}
            onMouseLeave={(e) => {
              if (document.activeElement !== e.target)
                (e.target as HTMLInputElement).style.borderColor = "transparent";
            }}
            onFocusCapture={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--accent)";
            }}
            onBlurCapture={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "transparent";
            }}
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              className="absolute right-2.5 rounded-full p-0.5 transition-opacity hover:opacity-70"
              style={{ color: "var(--text-tertiary)" }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50"
          style={{
            background: "var(--bg-elevated)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {loading && (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              Searching…
            </div>
          )}

          {!loading && !hasResults && debouncedQuery.trim().length >= 2 && (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              No results for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          {/* Users */}
          {!loading && users.length > 0 && (
            <>
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Users
                </span>
              </div>
              {users.map((user) => {
                const idx = itemIndex++;
                const inicial = (user.username[0] ?? "?").toUpperCase();
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                    style={{ background: idx === activeIndex ? "var(--bg-subtle)" : "transparent" }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-semibold text-white shrink-0 relative text-sm"
                      style={{ background: user.avatar_url ? "transparent" : "var(--accent)" }}
                    >
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.username} fill className="object-cover" sizes="32px" />
                      ) : (
                        inicial
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {user.username}
                      </p>
                    </div>
                    <User size={12} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
                  </button>
                );
              })}
            </>
          )}

          {/* Separator between users and games */}
          {!loading && users.length > 0 && games.length > 0 && (
            <div className="mx-3 border-t my-1" style={{ borderColor: "var(--border-subtle)" }} />
          )}

          {/* Games */}
          {!loading && games.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Games
                </span>
              </div>
              {games.map((game) => {
                const idx = itemIndex++;
                return (
                  <button
                    key={game.id}
                    onClick={() => handleSelectGame(game)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{ background: idx === activeIndex ? "var(--bg-subtle)" : "transparent" }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <div className="relative w-12 h-8 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700">
                      {game.background_image ? (
                        <Image src={game.background_image} alt={game.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🎮</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {game.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {game.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                            <Star size={10} className="fill-yellow-400 text-yellow-400" />
                            {game.rating.toFixed(1)}
                          </span>
                        )}
                        {game.released && (
                          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                            {new Date(game.released).getFullYear()}
                          </span>
                        )}
                      </div>
                    </div>
                    {game.metacritic && (
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          background: game.metacritic >= 75 ? "#22c55e22" : game.metacritic >= 50 ? "#eab30822" : "#ef444422",
                          color: game.metacritic >= 75 ? "#16a34a" : game.metacritic >= 50 ? "#b45309" : "#dc2626",
                        }}
                      >
                        {game.metacritic}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* View all game results */}
          {!loading && games.length > 0 && (
            <button
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              className="w-full px-4 py-2.5 text-sm text-left transition-colors border-t"
              style={{ color: "var(--accent)", borderColor: "var(--border-subtle)" }}
            >
              View all results for &ldquo;{query}&rdquo; →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
