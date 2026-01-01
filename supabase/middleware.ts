import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const isProtectedRoute = (pathname: string): boolean => {
  const protectedPaths = [
    "/dashboard",
    "/admin-hunnu",
    "/worker-dashboard",
    "/worker-requests",
    "/building",
    "/health-stats",
    "/visit",
  ];
  return protectedPaths.some(path => pathname.startsWith(path));
};

const isAuthPage = (pathname: string): boolean => {
  return pathname.startsWith("/sign-in") ||
         pathname.startsWith("/sign-up") ||
         pathname.startsWith("/forgot-password");
};

export const updateSession = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

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

    // Redirect authenticated users away from auth pages
    if (user && isAuthPage(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Redirect unauthenticated users to sign-in for protected routes
    if (!user && isProtectedRoute(pathname)) {
      const redirectUrl = new URL("/sign-in", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect root to dashboard if authenticated
    if (user && pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (e) {
    console.error("Middleware error:", e);

    // On error, redirect to sign-in for protected routes (fail secure)
    if (isProtectedRoute(pathname)) {
      const redirectUrl = new URL("/sign-in", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};