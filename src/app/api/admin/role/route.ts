import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentAdminUser, isSuperAdmin, type Role } from "@/lib/auth/role";

const VALID: Role[] = ["user", "admin", "super_admin"];

export async function POST(req: Request) {
  const me = await getCurrentAdminUser();
  if (!me || !isSuperAdmin(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = (await req.json()) as { userId?: string; role?: Role };
  if (!userId || !role || !VALID.includes(role)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (userId === me.id) {
    return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
