import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentAdminUser, isAdmin } from "@/lib/auth/role";

export async function DELETE(req: Request) {
  const me = await getCurrentAdminUser();
  if (!me || !isAdmin(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { ratingId } = (await req.json()) as { ratingId?: number };
  if (!ratingId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("game_ratings")
    .delete()
    .eq("id", ratingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
