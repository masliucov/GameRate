import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, from_user_id, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!notifications?.length) return NextResponse.json([]);

  const fromIds = [...new Set(notifications.map((n) => n.from_user_id).filter(Boolean))];
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", fromIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return NextResponse.json(
    notifications.map((n) => ({
      ...n,
      from_profile: profileMap.get(n.from_user_id) ?? null,
    }))
  );
}

export async function PATCH() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false });

  await supabase.from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return NextResponse.json({ ok: true });
}
