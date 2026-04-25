import { searchGames, getPopularGames, getNewGames, getTopRatedGames, getUserRatedGames, getMostReviewedGames, getGenres } from "@/lib/rawg";
import GameGrid from "@/components/GameGrid";
import SearchFilters from "@/components/SearchFilters";
import Link from "next/link";
import { Fragment, Suspense } from "react";
import { Search } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ q?: string; sort?: string; genre?: string; year?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, sort } = await searchParams;
  if (q) return { title: `"${q}" — GameRate` };
  const map: Record<string, string> = {
    popular: "Populares", new: "Recentes",
    metacritic: "Mais votados — Metacritic", users: "Mais votados — Utilizadores",
    reviews: "Mais avaliados",
  };
  return { title: `${map[sort ?? "popular"] ?? "Jogos"} — GameRate` };
}

const SORT_TABS = [
  { key: "popular",    label: "Populares" },
  { key: "metacritic", label: "Metacritic",        group: "Mais votados:" },
  { key: "users",      label: "Utilizadores" },
  { key: "reviews",    label: "Nº de avaliações" },
  { key: "new",        label: "Recentes",           divider: true },
];

const SEARCH_ORDERING: Record<string, string> = {
  popular:    "-ratings_count",
  metacritic: "-metacritic",
  users:      "-rating",
  reviews:    "-ratings_count",
  new:        "-released",
};

export default async function SearchPage({ searchParams }: Props) {
  const { q, sort = "popular", genre, year } = await searchParams;

  const [res, genresRes] = await Promise.all([
    q
      ? searchGames(q, 1, 40, SEARCH_ORDERING[sort] ?? "-ratings_count", genre, year)
      : sort === "new"
      ? getNewGames(1, 40, genre, year)
      : sort === "metacritic"
      ? getTopRatedGames(1, 40, genre, year)
      : sort === "users"
      ? getUserRatedGames(1, 40, genre, year)
      : sort === "reviews"
      ? getMostReviewedGames(1, 40, genre, year)
      : getPopularGames(1, 40, genre, year),
    getGenres(),
  ]);

  const { results, count } = res;

  // Preserva os filtros activos nos links dos sort tabs
  function sortHref(key: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("sort", key);
    if (genre) params.set("genre", genre);
    if (year) params.set("year", year);
    return `/search?${params.toString()}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        {q ? (
          <>
            <div className="flex items-center gap-1.5 text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>
              <Search size={13} />
              Resultados para
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              &ldquo;{q}&rdquo;
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {count.toLocaleString("pt-PT")} jogos encontrados
            </p>
          </>
        ) : (
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {SORT_TABS.find((t) => t.key === sort)?.label ?? "Jogos"}
          </h1>
        )}
        {!q && (
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {count.toLocaleString("pt-PT")} jogos
          </p>
        )}

        {/* Tabs de ordenação */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {SORT_TABS.map(({ key, label, group, divider }) => (
            <Fragment key={key}>
              {group && (
                <span className="text-xs font-medium px-1" style={{ color: "var(--text-tertiary)" }}>
                  {group}
                </span>
              )}
              {divider && <span className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />}
              <Link
                href={sortHref(key)}
                className="text-sm px-4 py-1.5 rounded-full font-medium"
                style={{
                  background: sort === key ? "var(--accent)" : "var(--bg-input)",
                  color: sort === key ? "#fff" : "var(--text-secondary)",
                }}
              >
                {label}
              </Link>
            </Fragment>
          ))}
        </div>

        {/* Filtros */}
        <Suspense fallback={null}>
          <SearchFilters genres={genresRes.results} />
        </Suspense>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-24" style={{ color: "var(--text-tertiary)" }}>
          <div className="text-5xl mb-4">🎮</div>
          <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
            Nenhum jogo encontrado
          </p>
          <p className="text-sm mt-1">Tenta ajustar os filtros ou pesquisar por outro título.</p>
        </div>
      ) : (
        <GameGrid games={results} cols={5} />
      )}
    </div>
  );
}
