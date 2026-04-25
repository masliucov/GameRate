import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");
  const type = searchParams.get("type"); // "followers" | "following"

  if (!profileId || (type !== "followers" && type !== "following")) {
    return NextResponse.json({ users: [] }, { status: 400 });
  }

  if (type === "followers") {
    const { data: follows } = await supabaseAdmin
      .from("follows")
      .select("follower_id")
      .eq("following_id", profileId);

    const ids = (follows ?? []).map((r) => r.follower_id);
    if (ids.length === 0) return NextResponse.json({ users: [] });

    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", ids);

    return NextResponse.json({ users: data ?? [] });
  } else {
    const { data: follows } = await supabaseAdmin
      .from("follows")
      .select("following_id")
      .eq("follower_id", profileId);

    const ids = (follows ?? []).map((r) => r.following_id);
    if (ids.length === 0) return NextResponse.json({ users: [] });

    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", ids);

    return NextResponse.json({ users: data ?? [] });
  }
}
