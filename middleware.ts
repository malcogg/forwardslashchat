import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/chat/demo", "/checkout", "/services", "/thank-you", "/sign-in(.*)", "/sign-up(.*)", "/api/webhooks(.*)", "/api/cron(.*)"]);

const MAIN_HOSTS = ["forwardslash.chat", "www.forwardslash.chat", "localhost", "127.0.0.1"];

export default clerkMiddleware(async (auth, req) => {
  // Host-based routing: chat.theirdomain.com → /chat/c/[customerId]
  const host = req.headers.get("host")?.toLowerCase().split(":")[0] ?? "";
  if (
    host &&
    !MAIN_HOSTS.includes(host) &&
    !host.endsWith(".vercel.app")
  ) {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      const res = await fetch(
        `${baseUrl}/api/chat/resolve-by-host?host=${encodeURIComponent(host)}`
      );
      const { customerId } = (await res.json()) as { customerId?: string };
      if (customerId) {
        const url = req.nextUrl.clone();
        url.pathname = `/chat/c/${customerId}`;
        return NextResponse.rewrite(url);
      }
    } catch {
      // Fall through to normal routing
    }
  }

  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
