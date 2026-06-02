import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export type Role = "user" | "admin" | "super_admin";

export interface AdminUser {
  id: string;
  role: Role;
  bannedAt: string | null;
}

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("role, banned_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    role: (data?.role ?? "user") as Role,
    bannedAt: (data?.banned_at as string | null) ?? null,
  };
}

export function isAdmin(role: Role | undefined | null): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdmin(role: Role | undefined | null): boolean {
  return role === "super_admin";
}

export async function requireAdmin(): Promise<AdminUser> {
  const me = await getCurrentAdminUser();
  if (!me || !isAdmin(me.role) || me.bannedAt) redirect("/");
  return me;
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const me = await getCurrentAdminUser();
  if (!me || !isSuperAdmin(me.role) || me.bannedAt) redirect("/");
  return me;
}
