import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentAdminUser, isAdmin, isSuperAdmin } from "@/lib/auth/role";

export async function POST(req: Request) {
  const me = await getCurrentAdminUser();
  if (!me || !isAdmin(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, banned, reason } = (await req.json()) as {
    userId?: string;
    banned?: boolean;
    reason?: string;
  };
  if (!userId || typeof banned !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (userId === me.id) {
    return NextResponse.json({ error: "You cannot ban yourself" }, { status: 400 });
  }

  // Protect super_admins from being banned by a regular admin
  const { data: target } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (target?.role === "super_admin" && !isSuperAdmin(me.role)) {
    return NextResponse.json({ error: "You cannot ban a super_admin" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      banned_at: banned ? new Date().toISOString() : null,
      banned_reason: banned ? reason ?? null : null,
    })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
