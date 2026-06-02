import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, banned_at")
      .eq("id", user.id)
      .maybeSingle();

    // Banned users: force signOut + redirect home
    if (profile?.banned_at && !pathname.startsWith("/auth")) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "?error=banned";
      return NextResponse.redirect(url);
    }

    // /admin: require admin or super_admin
    if (pathname.startsWith("/admin")) {
      const role = profile?.role ?? "user";
      if (role !== "admin" && role !== "super_admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  } else if (pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
