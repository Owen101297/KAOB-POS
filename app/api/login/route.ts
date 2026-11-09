import { NextRequest, NextResponse } from "next/server";
import { isBasicAuthConfigured, isBasicAuthAuthorized } from "@/lib/auth-basic";
import { crearSesion, SESSION_COOKIE, MAX_AGE_SECONDS } from "@/lib/session";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  let usuario: string | null = null;
  let clave: string | null = null;

  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      usuario = body.usuario ?? body.username ?? null;
      clave = body.clave ?? body.password ?? null;
    } catch {
      usuario = null;
    }
  } else {
    const form = await request.formData().catch(() => null);
    if (form) {
      usuario = (form.get("usuario") as string) || null;
      clave = (form.get("clave") as string) || null;
    }
  }

  if (!isBasicAuthConfigured() || !usuario || !clave) {
    return NextResponse.json({ ok: false, error: "Credenciales incompletas." }, { status: 401 });
  }

  const header = "Basic " + Buffer.from(`${usuario}:${clave}`).toString("base64");
  if (!isBasicAuthAuthorized(header)) {
    return NextResponse.json({ ok: false, error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  const esSeguro = proto === "https" || request.nextUrl.protocol === "https:";
  const entornoProd = process.env.NODE_ENV === "production";

  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(SESSION_COOKIE, await crearSesion(usuario), {
    httpOnly: true,
    sameSite: "lax",
    // En producción siempre Secure; en dev HTTP queda en false (localhost).
    secure: entornoProd ? true : esSeguro,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return respuesta;
}
