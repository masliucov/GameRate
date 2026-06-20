const API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY!;
const BASE_URL = "https://api.rawg.io/api";

// ISR revalidation windows (seconds)
const REVALIDATE_GAMES = 1800; // game lists / detail: 30 min
const REVALIDATE_STATIC = 86400; // genres / platform stats: 24 h

// Cache tag for on-demand revalidation of all RAWG data (see app/api/revalidate)
export const GAMES_TAG = "games";

export interface Game {
  id: number;
  name: string;
  slug: string;
  background_image: string | null;
  rating: number;
  rating_top: number;
  ratings_count: number;
  metacritic: number | null;
  released: string | null;
  playtime: number;
  genres: Genre[];
  platforms: PlatformWrapper[] | null;
  short_screenshots: Screenshot[];
  tags: Tag[];
  esrb_rating: ESRBRating | null;
  description_raw?: string;
  website?: string;
  developers?: Developer[];
  publishers?: Publisher[];
  parent_platforms?: ParentPlatformWrapper[];
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface PlatformWrapper {
  platform: Platform;
  released_at: string | null;
}

export interface ParentPlatformWrapper {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface Platform {
  id: number;
  name: string;
  slug: string;
}

export interface Screenshot {
  id: number;
  image: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface ESRBRating {
  id: number;
  name: string;
  slug: string;
}

export interface Developer {
  id: number;
  name: string;
  slug: string;
}

export interface Publisher {
  id: number;
  name: string;
  slug: string;
}

export interface GamesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Game[];
}

export interface GenresResponse {
  results: Genre[];
}

function buildUrl(endpoint: string, params: Record<string, string | number | undefined> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export async function getPopularGames(page = 1, pageSize = 20, genreFilter?: string, yearFilter?: string): Promise<GamesResponse> {
  const url = buildUrl("/games", {
    ordering: "-rating",
    page,
    page_size: pageSize,
    metacritic: "1,100",
    exclude_additions: 1,
    ...(genreFilter && { genres: genreFilter }),
    ...(yearFilter && { dates: `${yearFilter}-01-01,${yearFilter}-12-31` }),
  });
  const res = await fetch(url, { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } });
  if (!res.ok) throw new Error("Failed to fetch popular games");
  return res.json();
}

export async function getNewGames(page = 1, pageSize = 20, genreFilter?: string, yearFilter?: string): Promise<GamesResponse> {
  const url = buildUrl("/games", {
    ordering: "-released",
    page,
    page_size: pageSize,
    dates: yearFilter ? `${yearFilter}-01-01,${yearFilter}-12-31` : `2023-01-01,${new Date().toISOString().split("T")[0]}`,
    exclude_additions: 1,
    ...(genreFilter && { genres: genreFilter }),
  });
  const res = await fetch(url, { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } });
  if (!res.ok) throw new Error("Failed to fetch new games");
  return res.json();
}

export async function getTrendingGames(pageSize = 10): Promise<GamesResponse> {
  const url = buildUrl("/games", {
    ordering: "-added",
    page_size: pageSize,
    exclude_additions: 1,
  });
  const res = await fetch(url, { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } });
  if (!res.ok) throw new Error("Failed to fetch trending games");
  return res.json();
}

export async function getHeroGames(): Promise<Game[]> {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const from = twoYearsAgo.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const [recent, trending] = await Promise.all([
    fetch(
      buildUrl("/games", {
        ordering: "-metacritic",
        metacritic: "85,100",
        dates: `${from},${today}`,
        page_size: 12,
        exclude_additions: 1,
      }),
      { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } }
    ).then((r) => r.json() as Promise<GamesResponse>),
    fetch(
      buildUrl("/games", {
        ordering: "-added",
        metacritic: "75,100",
        page_size: 8,
        exclude_additions: 1,
      }),
      { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } }
    ).then((r) => r.json() as Promise<GamesResponse>),
  ]);

  // Junta os dois resultados, remove duplicados e jogos sem imagem
  const seen = new Set<number>();
  const pool: Game[] = [];
  for (const g of [...recent.results, ...trending.results]) {
    if (!seen.has(g.id) && g.background_image) {
      seen.add(g.id);
      pool.push(g);
    }
  }

  // Deterministic shuffle based on current date (changes daily)
  const seed = Math.floor(Date.now() / 86_400_000);
  pool.sort((a, b) => ((a.id * seed) % 97) - ((b.id * seed) % 97));

  return pool.slice(0, 8);
}

export async function searchGames(
  query: string,
  page = 1,
  pageSize = 20,
  ordering = "-ratings_count",
  genreFilter?: string,
  yearFilter?: string
): Promise<GamesResponse> {
  const url = buildUrl("/games", {
    search: query,
    page,
    page_size: pageSize,
    search_precise: 1,
    ordering,
    exclude_additions: 1,
    ...(genreFilter && { genres: genreFilter }),
    ...(yearFilter && { dates: `${yearFilter}-01-01,${yearFilter}-12-31` }),
  });
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to search games");
  return res.json();
}

export async function getGameBySlug(slug: string): Promise<Game> {
  const url = buildUrl(`/games/${slug}`);
  const res = await fetch(url, { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } });
  if (!res.ok) throw new Error("Failed to fetch game");
  return res.json();
}

export async function getGameAdditions(slug: string): Promise<GamesResponse> {
  const url = buildUrl(`/games/${slug}/additions`);
  const res = await fetch(url, { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } });
  if (!res.ok) return { count: 0, next: null, previous: null, results: [] };
  return res.json();
}

export async function getGameScreenshots(slug: string): Promise<{ results: Screenshot[] }> {
  const url = buildUrl(`/games/${slug}/screenshots`);
  const res = await fetch(url, { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } });
  if (!res.ok) return { results: [] };
  return res.json();
}

export async function getGamesByGenre(
  genreSlug: string,
  page = 1,
  pageSize = 20,
  ordering = "-rating"
): Promise<GamesResponse> {
  const url = buildUrl("/games", {
    genres: genreSlug,
    ordering,
    page,
    page_size: pageSize,
    exclude_additions: 1,
  });
  const res = await fetch(url, { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } });
  if (!res.ok) throw new Error("Failed to fetch games by genre");
  return res.json();
}

export async function getPlatformStats(): Promise<{ games: number; dlcs: number }> {
  const [gamesRes, totalRes] = await Promise.all([
    fetch(buildUrl("/games", { page_size: 1, exclude_additions: 1 }), { next: { revalidate: REVALIDATE_STATIC, tags: [GAMES_TAG] } }),
    fetch(buildUrl("/games", { page_size: 1 }), { next: { revalidate: REVALIDATE_STATIC, tags: [GAMES_TAG] } }),
  ]);
  const [games, total] = await Promise.all([gamesRes.json(), totalRes.json()]);
  return { games: games.count ?? 0, dlcs: (total.count ?? 0) - (games.count ?? 0) };
}

export async function getGenres(): Promise<GenresResponse> {
  const url = buildUrl("/genres");
  const res = await fetch(url, { next: { revalidate: REVALIDATE_STATIC, tags: [GAMES_TAG] } });
  if (!res.ok) throw new Error("Failed to fetch genres");
  return res.json();
}

export async function getTopRatedGames(page = 1, pageSize = 20, genreFilter?: string, yearFilter?: string): Promise<GamesResponse> {
  const url = buildUrl("/games", {
    ordering: "-metacritic",
    page,
    page_size: pageSize,
    metacritic: "80,100",
    exclude_additions: 1,
    ...(genreFilter && { genres: genreFilter }),
    ...(yearFilter && { dates: `${yearFilter}-01-01,${yearFilter}-12-31` }),
  });
  const res = await fetch(url, { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } });
  if (!res.ok) throw new Error("Failed to fetch top rated games");
  return res.json();
}

export async function getUserRatedGames(page = 1, pageSize = 20, genreFilter?: string, yearFilter?: string): Promise<GamesResponse> {
  const url = buildUrl("/games", {
    ordering: "-rating",
    page,
    page_size: pageSize,
    ratings_count: 500,
    exclude_additions: 1,
    ...(genreFilter && { genres: genreFilter }),
    ...(yearFilter && { dates: `${yearFilter}-01-01,${yearFilter}-12-31` }),
  });
  const res = await fetch(url, { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } });
  if (!res.ok) throw new Error("Failed to fetch user rated games");
  return res.json();
}

export async function getMostReviewedGames(page = 1, pageSize = 20, genreFilter?: string, yearFilter?: string): Promise<GamesResponse> {
  const url = buildUrl("/games", {
    ordering: "-ratings_count",
    page,
    page_size: pageSize,
    exclude_additions: 1,
    ...(genreFilter && { genres: genreFilter }),
    ...(yearFilter && { dates: `${yearFilter}-01-01,${yearFilter}-12-31` }),
  });
  const res = await fetch(url, { next: { revalidate: REVALIDATE_GAMES, tags: [GAMES_TAG] } });
  if (!res.ok) throw new Error("Failed to fetch most reviewed games");
  return res.json();
}
