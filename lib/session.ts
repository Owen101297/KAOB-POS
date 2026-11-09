import { createHmac, timingSafeEqual } from "crypto";

// Sesión firmada con HMAC-SHA256 para la pantalla de login.
// El secreto NO sale del servidor: se deriva de KAOB_POS_AUTH_PASSWORD (≥16
// caracteres por isBasicAuthConfigured), o de KAOB_SESSION_SECRET si se define.

export const SESSION_COOKIE = "kaob_session";
const MAX_AGE_SECONDS = 12 * 60 * 60; // 12 h

function secreto(): string {
  return process.env.KAOB_SESSION_SECRET || process.env.KAOB_POS_AUTH_PASSWORD || "";
}

function firmar(payload: string): string {
  return createHmac("sha256", secreto()).update(payload).digest("base64url");
}

export function crearSesion(usuario: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = Buffer.from(JSON.stringify({ u: usuario, exp })).toString("base64url");
  return `${payload}.${firmar(payload)}`;
}

export function verificarSesion(cookieValue: string | null | undefined): boolean {
  if (!cookieValue || !secreto()) return false;
  const [payloadB64, sig] = cookieValue.split(".");
  if (!payloadB64 || !sig) return false;

  const esperado = firmar(payloadB64);
  const a = Buffer.from(esperado);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as { u?: string; exp?: number };
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return false;
    return typeof payload.u === "string" && payload.u.length > 0;
  } catch {
    return false;
  }
}

export { MAX_AGE_SECONDS };
