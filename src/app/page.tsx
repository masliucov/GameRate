import { getPopularGames, getNewGames, getTopRatedGames, getHeroGames, getPlatformStats } from "@/lib/rawg";
import HeroSlider from "@/components/HeroSlider";
import GameGrid from "@/components/GameGrid";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import { Gamepad2, Package } from "lucide-react";

export default async function HomePage() {
  const [heroGames, popular, newGames, topRated, stats] = await Promise.all([
    getHeroGames(),
    getPopularGames(1, 8),
    getNewGames(1, 8),
    getTopRatedGames(1, 8),
    getPlatformStats(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-16">
      <div className="space-y-6">
        <HeroSlider games={heroGames} />

        {/* Stats — minimal, no box */}
        <div
          className="flex items-center justify-center gap-6 text-sm flex-wrap"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="flex items-center gap-2">
            <Gamepad2 size={15} style={{ color: "var(--accent)" }} />
            <strong style={{ color: "var(--text-primary)" }}>
              {stats.games.toLocaleString("en-US")}
            </strong>{" "}games available
          </span>
          <span className="w-px h-4 hidden sm:block" style={{ background: "var(--border)" }} />
          <span className="flex items-center gap-2">
            <Package size={15} style={{ color: "var(--accent)" }} />
            <strong style={{ color: "var(--text-primary)" }}>
              {stats.dlcs.toLocaleString("en-US")}
            </strong>{" "}DLCs & expansions
          </span>
        </div>
      </div>

      <Reveal>
        <section>
          <SectionHeader title="Popular" subtitle="The most played and best rated" href="/search?sort=popular" />
          <GameGrid games={popular.results} cols={4} />
        </section>
      </Reveal>

      <Reveal>
        <section>
          <SectionHeader title="Top Rated" subtitle="Best Metacritic scores" href="/search?sort=top" />
          <GameGrid games={topRated.results.slice(0, 8)} cols={4} />
        </section>
      </Reveal>

      <Reveal>
        <section>
          <SectionHeader title="Recent Releases" subtitle="The newest games" href="/search?sort=new" />
          <GameGrid games={newGames.results} cols={4} />
        </section>
      </Reveal>
    </div>
  );
}
