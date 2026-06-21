import { getGameBySlug, getGameScreenshots, getGameAdditions } from "@/lib/rawg";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Calendar, Clock, Globe } from "lucide-react";
import BackButton from "@/components/BackButton";
import ExpandableDescription from "@/components/ExpandableDescription";
import ScreenshotGallery from "@/components/ScreenshotGallery";
import GameActions from "@/components/GameActions";
import ReviewsSection from "@/components/ReviewsSection";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const game = await getGameBySlug(slug);
    return {
      title: `${game.name} — GameRate`,
      description: game.description_raw?.slice(0, 160),
    };
  } catch {
    return { title: "Game not found — GameRate" };
  }
}

function ScorePill({ score, label }: { score: number; label: string }) {
  const { bg, text } =
    score >= 75 ? { bg: "#dcfce7", text: "#15803d" } :
    score >= 50 ? { bg: "#fef9c3", text: "#854d0e" } :
    { bg: "#fee2e2", text: "#b91c1c" };
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-3xl font-bold" style={{ color: text }}>{score}</span>
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full"
        style={{ background: bg, color: text }}
      >
        {label}
      </span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full border"
      style={{
        background: "var(--bg-subtle)",
        color: "var(--text-secondary)",
        borderColor: "var(--border)",
      }}
    >
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel p-6">
      <h2 className="font-display text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{title}</h2>
      {children}
    </div>
  );
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params;

  let game, screenshots, additions;
  try {
    [game, screenshots, additions] = await Promise.all([
      getGameBySlug(slug),
      getGameScreenshots(slug),
      getGameAdditions(slug),
    ]);
  } catch {
    notFound();
  }

  const platforms = game.platforms?.map((p) => p.platform) ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackButton />

      {/* Hero image */}
      <div
        className="relative w-full rounded-3xl overflow-hidden mb-8 glass-panel"
        style={{ aspectRatio: "21/7", minHeight: 200, maxHeight: 400 }}
      >
        {game.background_image && (
          <Image
            src={game.background_image}
            alt={game.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-10">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">{game.name}</h1>
          {game.released && (
            <p className="text-white/60 mt-2 flex items-center gap-1.5 text-sm">
              <Calendar size={13} />
              {new Date(game.released).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6">
        <GameActions gameSlug={game.slug} gameName={game.name} gameImage={game.background_image} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scores */}
          <Section title="Rating">
            <div className="flex items-center gap-8 flex-wrap">
              {game.metacritic ? (
                <ScorePill score={game.metacritic} label="Metacritic" />
              ) : null}
              {game.rating > 0 && (
                <ScorePill score={Math.round(game.rating * 20)} label="Users" />
              )}
              <div className="flex flex-col gap-1.5 ml-2">
                <div className="flex items-center gap-1.5">
                  <Star size={15} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {game.rating.toFixed(1)}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>/ 5</span>
                </div>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  {game.ratings_count.toLocaleString("en-US")} ratings
                </p>
                {game.playtime > 0 && (
                  <p className="text-sm flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                    <Clock size={12} />
                    ~{game.playtime}h playtime
                  </p>
                )}
              </div>
            </div>
          </Section>

          {/* Description */}
          {game.description_raw && (
            <Section title="About the game">
              <ExpandableDescription text={game.description_raw} />
            </Section>
          )}

          {/* Screenshots */}
          {screenshots.results.length > 0 && (
            <Section title="Screenshots">
              <ScreenshotGallery screenshots={screenshots.results} />
            </Section>
          )}

          {/* DLCs & Expansions */}
          {additions.results.length > 0 && (
            <Section title="DLCs & Expansions">
              <div className="flex flex-col gap-2">
                {additions.results.map((dlc) => (
                  <Link
                    key={dlc.id}
                    href={`/games/${dlc.slug}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl transition-opacity hover:opacity-80"
                    style={{ background: "var(--bg-subtle)" }}
                  >
                    <div className="relative w-20 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-input)" }}>
                      {dlc.background_image ? (
                        <Image src={dlc.background_image} alt={dlc.name} fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🎮</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{dlc.name}</p>
                      {dlc.released && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                          {new Date(dlc.released).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                    {dlc.metacritic && (
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          background: dlc.metacritic >= 75 ? "#22c55e22" : dlc.metacritic >= 50 ? "#eab30822" : "#ef444422",
                          color: dlc.metacritic >= 75 ? "#16a34a" : dlc.metacritic >= 50 ? "#b45309" : "#dc2626",
                        }}
                      >
                        {dlc.metacritic}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Etiquetas */}
          {game.tags && game.tags.length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-2">
                {game.tags.slice(0, 24).map((tag) => (
                  <Pill key={tag.id}>{tag.name}</Pill>
                ))}
              </div>
            </Section>
          )}

          {/* Community ratings and reviews */}
          <ReviewsSection gameSlug={game.slug} gameName={game.name} gameImage={game.background_image} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass-panel p-6 space-y-5 lg:sticky lg:top-20">
            <h2 className="font-display text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Information</h2>

            {game.genres?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: "var(--text-tertiary)" }}>Genres</p>
                <div className="flex flex-wrap gap-1.5">
                  {game.genres.map((g) => (
                    <Link
                      key={g.id}
                      href={`/genres/${g.slug}`}
                      className="text-xs px-2.5 py-1 rounded-full border transition-colors hover:opacity-70"
                      style={{ background: "var(--bg-subtle)", color: "var(--accent)", borderColor: "var(--border)" }}
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {platforms.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: "var(--text-tertiary)" }}>Platforms</p>
                <div className="flex flex-wrap gap-1.5">
                  {platforms.map((p) => <Pill key={p.id}>{p.name}</Pill>)}
                </div>
              </div>
            )}

            {(game.developers?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-1.5 font-medium" style={{ color: "var(--text-tertiary)" }}>Developer</p>
                <div className="flex flex-wrap gap-1.5">
                  {game.developers!.map((d) => <Pill key={d.id}>{d.name}</Pill>)}
                </div>
              </div>
            )}

            {(game.publishers?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-1.5 font-medium" style={{ color: "var(--text-tertiary)" }}>Publisher</p>
                <div className="flex flex-wrap gap-1.5">
                  {game.publishers!.map((p) => <Pill key={p.id}>{p.name}</Pill>)}
                </div>
              </div>
            )}

            {game.esrb_rating && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-1.5 font-medium" style={{ color: "var(--text-tertiary)" }}>ESRB</p>
                <Pill>{game.esrb_rating.name}</Pill>
              </div>
            )}

            {game.website && (
              <a
                href={game.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--accent)" }}
              >
                <Globe size={13} />
                Official website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
