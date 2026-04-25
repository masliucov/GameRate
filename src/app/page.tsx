import { getPopularGames, getNewGames, getTopRatedGames, getHeroGames, getPlatformStats } from "@/lib/rawg";
import HeroSlider from "@/components/HeroSlider";
import GameGrid from "@/components/GameGrid";
import SectionHeader from "@/components/SectionHeader";
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-14">
      <div className="space-y-4">
        <HeroSlider games={heroGames} />

        {/* Stats bar */}
        <div
          className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl text-sm flex-wrap"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <span className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <Gamepad2 size={14} style={{ color: "var(--accent)" }} />
            <strong style={{ color: "var(--text-primary)" }}>
              {stats.games.toLocaleString("pt-PT")}
            </strong>{" "}jogos disponíveis
          </span>
          <span className="w-px h-4 hidden sm:block" style={{ background: "var(--border)" }} />
          <span className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <Package size={14} style={{ color: "var(--accent)" }} />
            <strong style={{ color: "var(--text-primary)" }}>
              {stats.dlcs.toLocaleString("pt-PT")}
            </strong>{" "}DLCs e expansões
          </span>
        </div>
      </div>

      <section>
        <SectionHeader title="Populares" subtitle="Os mais jogados e bem avaliados" href="/search?sort=popular" />
        <GameGrid games={popular.results} cols={4} />
      </section>

      <section>
        <SectionHeader title="Mais Votados" subtitle="Melhores pontuações no Metacritic" href="/search?sort=top" />
        <GameGrid games={topRated.results.slice(0, 8)} cols={4} />
      </section>

      <section>
        <SectionHeader title="Lançamentos Recentes" subtitle="Os jogos mais recentes" href="/search?sort=new" />
        <GameGrid games={newGames.results} cols={4} />
      </section>
    </div>
  );
}

