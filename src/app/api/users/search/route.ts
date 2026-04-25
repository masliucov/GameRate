import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .ilike("username", `%${q}%`)
    .limit(4);

  return NextResponse.json(data ?? []);
}
