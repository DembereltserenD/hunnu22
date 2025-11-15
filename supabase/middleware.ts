import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(({ name, value }) => ({
              name,
              value,
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Refresh session if expired
    const { data: { user }, error } = await supabase.auth.getUser();

    const isAuthPage = request.nextUrl.pathname.startsWith("/sign-in") || 
                       request.nextUrl.pathname.startsWith("/sign-up") || 
                       request.nextUrl.pathname.startsWith("/forgot-password");

    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
                             request.nextUrl.pathname.startsWith("/admin-hunnu") ||
                             request.nextUrl.pathname.startsWith("/worker-dashboard") ||
                             request.nextUrl.pathname.startsWith("/worker-requests");

    // Redirect authenticated users away from auth pages
    if (user && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Redirect unauthenticated users to sign-in for protected routes
    if (!user && isProtectedRoute) {
      const redirectUrl = new URL("/sign-in", request.url);
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect root to dashboard if authenticated
    if (user && request.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (e) {
    console.error("Middleware error:", e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};