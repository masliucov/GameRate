import { getGamesByGenre } from "@/lib/rawg";
import GameGrid from "@/components/GameGrid";
import Link from "next/link";
import { Fragment } from "react";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

const SORT_OPTIONS = [
  { key: "popular",    label: "Popular",          ordering: "-added" },
  { key: "metacritic", label: "Metacritic",          ordering: "-metacritic" },
  { key: "users",      label: "Users",        ordering: "-rating" },
  { key: "reviews",    label: "# of ratings",   ordering: "-ratings_count" },
  { key: "new",        label: "Recent",            ordering: "-released" },
  { key: "playtime",   label: "Most played",        ordering: "-playtime" },
  { key: "name",       label: "A–Z",                 ordering: "name" },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: `${name} — GameRate` };
}

export default async function GenrePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sort = "popular" } = await searchParams;

  const option = SORT_OPTIONS.find((o) => o.key === sort) ?? SORT_OPTIONS[0];
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const { results, count } = await getGamesByGenre(slug, 1, 40, option.ordering);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href="/genres"
        className="inline-flex items-center gap-1 text-sm mb-6 transition-opacity hover:opacity-70"
        style={{ color: "var(--accent)" }}
      >
        <ChevronLeft size={15} />
        Genres
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{name}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {count.toLocaleString("en-US")} games
        </p>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-8">
        {SORT_OPTIONS.map(({ key, label }, i) => (
          <Fragment key={key}>
            {i === 1 && (
              <span
                className="text-xs font-medium px-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Top rated:
              </span>
            )}
            {i === 4 && (
              <span
                className="w-px h-5 mx-1"
                style={{ background: "var(--border)" }}
              />
            )}
            <Link
              href={`/genres/${slug}?sort=${key}`}
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

      {/* Grid */}
      {results.length === 0 ? (
        <div className="text-center py-24" style={{ color: "var(--text-tertiary)" }}>
          <div className="text-5xl mb-4">🎮</div>
          <p style={{ color: "var(--text-secondary)" }}>No games found in this genre.</p>
        </div>
      ) : (
        <GameGrid games={results} cols={5} />
      )}
    </div>
  );
}
