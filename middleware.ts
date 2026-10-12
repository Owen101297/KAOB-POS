import { NextRequest, NextResponse } from "next/server";
import {
  isBasicAuthAuthorized,
  isBasicAuthConfigured,
  isDevelopmentAuthBypassAllowed,
} from "@/lib/auth-basic";

function matchesPath(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function isPublicRequest(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  const isServerAction = request.headers.has("next-action");

  if (!isServerAction && (matchesPath(pathname, "/tienda") || pathname === "/api/health")) {
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

export function middleware(request: NextRequest) {
  if (isPublicRequest(request)) return NextResponse.next();

  if (process.env.NODE_ENV !== "development" && !isSecureRequest(request)) {
    return insecureTransport();
  }

  if (isDevelopmentAuthBypassAllowed()) return NextResponse.next();
  if (!isBasicAuthConfigured()) return unavailable();
  if (!isBasicAuthAuthorized(request.headers.get("authorization"))) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
