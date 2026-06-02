"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Role = "user" | "admin" | "super_admin";

interface AuthContextValue {
  user: User | null;
  role: Role;
}

const AuthContext = createContext<AuthContextValue>({ user: null, role: "user" });

export function useUser() {
  return useContext(AuthContext).user;
}

export function useRole(): Role {
  return useContext(AuthContext).role;
}

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("user");

  useEffect(() => {
    const supabase = createClient();

    async function loadRole(u: User | null) {
      if (!u) { setRole("user"); return; }
      const { data } = await supabase.from("profiles").select("role").eq("id", u.id).maybeSingle();
      setRole(((data?.role as Role) ?? "user"));
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      loadRole(data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null;
      setUser(u);
      loadRole(u);
    });
    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, role }}>{children}</AuthContext.Provider>;
}
