import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { resolveCustomerIdByHost } from "@/lib/resolve-customer-host";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/fs-ops(.*)",
  "/onboarding(.*)",
  "/user-profile(.*)",
]);
const isPublicRoute = createRouteMatcher([
  "/",
  "/chat/demo",
  "/checkout",
  "/services",
  "/thank-you",
  "/terms",
  "/privacy",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
]);

const MAIN_HOSTS = ["forwardslash.chat", "www.forwardslash.chat", "localhost", "127.0.0.1"];

export default clerkMiddleware(async (auth, req) => {
  // Host-based routing: chat.theirdomain.com → /chat/c/[customerId]
  const host = req.headers.get("host")?.toLowerCase().split(":")[0] ?? "";
  if (
    host &&
    !MAIN_HOSTS.includes(host) &&
    !host.endsWith(".vercel.app")
  ) {
    try {
      const customerId = await resolveCustomerIdByHost(host);
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
