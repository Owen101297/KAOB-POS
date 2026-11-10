import { NextRequest, NextResponse } from "next/server";
import {
  isBasicAuthAuthorized,
  isBasicAuthConfigured,
  isDevelopmentAuthBypassAllowed,
} from "@/lib/auth-basic";

function matchesPath(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

import { verificarSesion, SESSION_COOKIE } from "@/lib/session";

async function tieneSesionValida(request: NextRequest): Promise<boolean> {
  return verificarSesion(request.cookies.get(SESSION_COOKIE)?.value);
}

function isPublicRequest(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  const isServerAction = request.headers.has("next-action");

  // La pantalla de acceso y su API son públicas por diseño.
  if (matchesPath(pathname, "/login") || matchesPath(pathname, "/api/login") || matchesPath(pathname, "/api/logout")) {
    return true;
  }

  if (!isServerAction && (matchesPath(pathname, "/tienda") || pathname === "/api/health")) {
    return true;
  }

  // El checkout de la tienda pública y los webhooks de pasarelas son públicos
  // por diseño (spec 002): los webhooks llevan firma/consulta autoritativa.
  if (
    !isServerAction &&
    (matchesPath(pathname, "/tienda/pago") ||
      matchesPath(pathname, "/api/checkout") ||
      matchesPath(pathname, "/api/webhooks"))
  ) {
    return true;
  }

  // Los archivos servidos desde /public son públicos por diseño; no proteger rutas API por extensión.
  if (!pathname.startsWith("/api/") && /\.(?:avif|css|eot|gif|ico|jpe?g|js|json|map|otf|png|svg|ttf|txt|webp|woff2?)$/i.test(pathname)) {
    return true;
  }

  return false;
}

function isSecureRequest(request: NextRequest): boolean {
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim()
    .toLowerCase();

  if (forwardedProtocol) return forwardedProtocol === "https";
  return request.nextUrl.protocol === "https:";
}

function insecureTransport(): NextResponse {
  return new NextResponse("HTTPS es obligatorio para acceder a KAOB-POS.", {
    status: 426,
    headers: { "Cache-Control": "no-store" },
  });
}

function unavailable(): NextResponse {
  return new NextResponse("El acceso a KAOB-POS aún no está configurado.", {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });
}

function unauthorized(): NextResponse {
  return new NextResponse("Autenticación requerida.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="KAOB POS", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export async function middleware(request: NextRequest) {
  if (isPublicRequest(request)) return NextResponse.next();

  if (process.env.NODE_ENV !== "development" && !isSecureRequest(request)) {
    return insecureTransport();
  }

  if (isDevelopmentAuthBypassAllowed()) return NextResponse.next();
  if (!isBasicAuthConfigured()) return unavailable();

  // Sesión de la pantalla /login (cookie firmada) o cabecera Basic (respaldo).
  if (await tieneSesionValida(request)) return NextResponse.next();
  if (isBasicAuthAuthorized(request.headers.get("authorization"))) return NextResponse.next();

  // Navegadores: pantalla de login con retorno a la ruta pedida.
  if (!request.headers.get("authorization")) {
    const destino = request.nextUrl.pathname + request.nextUrl.search;
    const url = new URL("/login", request.url);
    url.searchParams.set("retorno", destino);
    return NextResponse.redirect(url);
  }

  return unauthorized();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
