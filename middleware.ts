export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (static files)
     * - brand/, icon.svg, favicon.ico (assets)
     * - login, register (auth pages)
     * - tienda (public storefront)
     * - api/auth (NextAuth API)
     * - api/health (healthcheck)
     */
    "/((?!_next|brand|icon|favicon|login|register|tienda|api/auth|api/health).*)",
  ],
};
