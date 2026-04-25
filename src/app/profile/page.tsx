import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Perfil — GameRate" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const [library, wishlist, ratings, playing, profile, { count: followersCount }, { count: followingCount }] = await Promise.all([
    supabase.from("game_library").select("*").eq("user_id", user.id).order("added_at", { ascending: false }),
    supabase.from("game_wishlist").select("*").eq("user_id", user.id).order("added_at", { ascending: false }),
    supabase.from("game_ratings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("game_playing").select("*").eq("user_id", user.id).order("added_at", { ascending: false }),
    supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle(),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
  ]);

  return (
    <ProfileClient
      user={{ id: user.id, email: user.email ?? "", username: user.user_metadata?.username ?? "" }}
      library={library.data ?? []}
      wishlist={wishlist.data ?? []}
      ratings={ratings.data ?? []}
      playing={playing.data ?? []}
      avatarUrl={profile.data?.avatar_url ?? null}
      followersCount={followersCount ?? 0}
      followingCount={followingCount ?? 0}
    />
  );
}
