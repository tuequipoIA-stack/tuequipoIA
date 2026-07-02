import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback"];
// El usuario tiene que poder llegar a /suscripcion (y pagar) aunque su
// suscripción esté vencida — si no, quedaría trabado sin forma de pagar.
const SUBSCRIPTION_EXEMPT_PATHS = ["/suscripcion"];

export async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const isApi = path.startsWith("/api/");

  if (!user && !isPublic && !isApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Gating por suscripción: solo para páginas de la app, no para /api/*
  // (esas rutas ya validan sesión por su cuenta) ni para el propio /suscripcion.
  const isSubscriptionExempt = SUBSCRIPTION_EXEMPT_PATHS.some((p) => path.startsWith(p));
  if (user && !isPublic && !isApi && !isSubscriptionExempt) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    const enTrial = profile?.subscription_status === "trial" && profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
    const activa = profile?.subscription_status === "active";

    if (!activa && !enTrial && !profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/suscripcion";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
