# GameRate

A social platform for tracking, rating, and discovering video games. Built with Next.js 16, Supabase, and the RAWG API.

## Features

- **Game Discovery** — Browse popular, top-rated, and recent games; filter by genre and year; search by title
- **Collections** — Add games to your library, wishlist, or mark as currently playing
- **Ratings & Reviews** — Rate games (0.5–5 stars), write reviews, and react to other users' reviews
- **Social** — Follow users, see their activity on your feed, and get notified about new followers and reactions
- **Profile** — Public profile with stats, collections, and followers/following lists

## Tech Stack

| Layer     | Technology                                 |
| --------- | ------------------------------------------ |
| Framework | Next.js 16 (App Router, Server Components) |
| Database  | Supabase (PostgreSQL)                      |
| Auth      | Supabase Auth (OAuth)                      |
| Storage   | Supabase Storage                           |
| Game Data | RAWG API                                   |
| Styling   | Tailwind CSS v4                            |

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/masliucov/GameRate.git
cd gamerate
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable                        | Where to get it                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_RAWG_API_KEY`      | [rawg.io/apidocs](https://rawg.io/apidocs)                                                          |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → General → **Project ID** (format: `https://<project-id>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys → Legacy API keys → **anon public**                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Project Settings → API Keys → Legacy API keys → **service_role**                         |
| `REVALIDATE_SECRET`             | Any long random string (e.g. `openssl rand -hex 32`) — guards the scheduled cache-refresh endpoint   |

### 3. Set up the database

In your Supabase project, go to **SQL Editor** and run the following:

```sql
-- Profiles (extends Supabase auth.users)
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  avatar_url text
);

-- Auto-create profile on sign up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- Game library
create table game_library (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  game_slug  text not null,
  game_name  text not null,
  game_image text,
  added_at   timestamptz default now(),
  unique (user_id, game_slug)
);

-- Wishlist
create table game_wishlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  game_slug  text not null,
  game_name  text not null,
  game_image text,
  added_at   timestamptz default now(),
  unique (user_id, game_slug)
);

-- Currently playing
create table game_playing (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  game_slug  text not null,
  game_name  text not null,
  game_image text,
  added_at   timestamptz default now(),
  unique (user_id, game_slug)
);

-- Ratings & reviews
create table game_ratings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  game_slug  text not null,
  game_name  text not null,
  game_image text,
  rating     numeric(2,1) check (rating >= 0.5 and rating <= 5.0),
  review     text,
  created_at timestamptz default now(),
  unique (user_id, game_slug)
);

-- Review reactions (like / dislike)
create table review_reactions (
  review_id  uuid references game_ratings(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  reaction   text check (reaction in ('like', 'dislike')),
  primary key (review_id, user_id)
);

-- Follows
create table follows (
  follower_id  uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  primary key (follower_id, following_id)
);

-- Notifications
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  from_user_id uuid references profiles(id) on delete cascade,
  type         text check (type in ('new_follower', 'review_like', 'review_dislike')),
  read         boolean default false,
  created_at   timestamptz default now()
);


-- Row Level Security

alter table profiles        enable row level security;
alter table game_library    enable row level security;
alter table game_wishlist   enable row level security;
alter table game_playing    enable row level security;
alter table game_ratings    enable row level security;
alter table review_reactions enable row level security;
alter table follows         enable row level security;
alter table notifications   enable row level security;

-- Profiles: public read, owner write
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Game collections: public read, owner write
create policy "Game library is viewable by everyone"
  on game_library for select using (true);
create policy "Users manage own library"
  on game_library for all using (auth.uid() = user_id);

create policy "Wishlist is viewable by everyone"
  on game_wishlist for select using (true);
create policy "Users manage own wishlist"
  on game_wishlist for all using (auth.uid() = user_id);

create policy "Playing is viewable by everyone"
  on game_playing for select using (true);
create policy "Users manage own playing"
  on game_playing for all using (auth.uid() = user_id);

-- Ratings: public read, owner write
create policy "Ratings are viewable by everyone"
  on game_ratings for select using (true);
create policy "Users manage own ratings"
  on game_ratings for all using (auth.uid() = user_id);

-- Reactions: public read, owner write
create policy "Reactions are viewable by everyone"
  on review_reactions for select using (true);
create policy "Users manage own reactions"
  on review_reactions for all using (auth.uid() = user_id);

-- Follows: public read, owner write
create policy "Follows are viewable by everyone"
  on follows for select using (true);
create policy "Users manage own follows"
  on follows for all using (auth.uid() = follower_id);

-- Notifications: private (owner only)
create policy "Users see own notifications"
  on notifications for select using (auth.uid() = user_id);
create policy "Anyone can create notifications"
  on notifications for insert with check (true);
create policy "Users update own notifications"
  on notifications for update using (auth.uid() = user_id);


-- Storage bucket for avatars
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload their own avatar"
  on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update their own avatar"
  on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
```

Then, to enable the admin dashboard (roles + banning), run this additional block. Replace the email on line `set role = 'super_admin'` with the account that should be the first super admin:

```sql
-- Admin roles + banning

alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin', 'super_admin')),
  add column if not exists banned_at timestamptz,
  add column if not exists banned_reason text;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_banned_at_idx on public.profiles (banned_at);

-- Seed the first super admin (change the email below)
update public.profiles
set role = 'super_admin'
where id = (select id from auth.users where email = 'your-email@example.com');

-- Helpers
create or replace function public.is_admin(uid uuid)
returns boolean language sql security definer stable as $$
  select coalesce((select role in ('admin', 'super_admin') from public.profiles where id = uid), false);
$$;

create or replace function public.is_super_admin(uid uuid)
returns boolean language sql security definer stable as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = uid), false);
$$;

-- Only super_admin can change roles via direct DB writes
drop policy if exists "profiles_super_admin_update_role" on public.profiles;
create policy "profiles_super_admin_update_role"
  on public.profiles for update
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

-- Admins can delete any review; users can still delete their own
drop policy if exists "game_ratings_admin_delete" on public.game_ratings;
create policy "game_ratings_admin_delete"
  on public.game_ratings for delete
  using (public.is_admin(auth.uid()) or auth.uid() = user_id);
```

After running this, the seeded super admin will see a **Dashboard de Admin** link in the user menu and can access `/admin` to manage users (promote/demote, ban, delete reviews).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy

The easiest way to deploy is with [Vercel](https://vercel.com).

1. Import the repository on Vercel
2. Go to **Build & Deployment Settings → Framework Settings** and select **Next.js** as the Framework Preset
3. Go to **Environment Variables → Add Environment Variable** and add the following — **Key** is the variable name, **Value** is the corresponding value:

| Key                             | Value                        |
| ------------------------------- | ---------------------------- |
| `NEXT_PUBLIC_RAWG_API_KEY`      | Your RAWG API key            |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key       |
| `SUPABASE_SERVICE_ROLE_KEY`     | Your Supabase service role key |
| `REVALIDATE_SECRET`             | Same random string as in `.env.local` |

4. Deploy

Make sure the Supabase project's **Auth → URL Configuration** includes your production URL in the allowed redirect URLs.

---

## Keeping game data fresh (scheduled cache refresh)

Game lists come from the RAWG API and are cached with Next.js ISR (`revalidate` —
30 min for game data). Since ISR only refreshes on an incoming request, a site with
little traffic can keep serving stale data. To guarantee freshness regardless of
traffic, a GitHub Actions workflow pings the site on a schedule and forces a refresh.

**How it works**

1. RAWG fetches in `src/lib/rawg.ts` are tagged with the `games` cache tag.
2. `POST /api/revalidate` (`src/app/api/revalidate/route.ts`) checks a bearer secret
   and calls `revalidateTag("games", { expire: 0 })`, so the next visitor re-fetches
   fresh data instead of being served stale.
3. `.github/workflows/refresh-games.yml` runs daily (06:00 UTC) — and on demand — and
   `curl`s that endpoint.

No `git push` or redeploy is involved; only the data cache is invalidated.

**Setup**

1. Set `REVALIDATE_SECRET` in Vercel (same value as your `.env.local`).
2. In the GitHub repo, go to **Settings → Secrets and variables → Actions** and add:

   | Secret              | Value                                                  |
   | ------------------- | ------------------------------------------------------ |
   | `SITE_URL`          | Your production URL, e.g. `https://gamerate.vercel.app` |
   | `REVALIDATE_SECRET` | The same secret you set in Vercel                      |

3. Trigger it once from the **Actions** tab (**Run workflow**) to verify — a
   successful run returns `{ "revalidated": true, "tag": "games" }`.

Test the endpoint locally too:

```bash
curl -i -X POST -H "Authorization: Bearer $REVALIDATE_SECRET" \
  http://localhost:3000/api/revalidate
```
