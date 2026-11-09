// Sesión firmada HMAC-SHA256 para la pantalla de login.
// Web Crypto (crypto.subtle): funciona en Edge runtime (middleware) y en Node.
// El secreto NO sale del servidor: se deriva de KAOB_POS_AUTH_PASSWORD
// (≥16 caracteres por isBasicAuthConfigured), o de KAOB_SESSION_SECRET.

export const SESSION_COOKIE = "kaob_session";
const MAX_AGE_SECONDS = 12 * 60 * 60; // 12 h

function secreto(): string {
  return process.env.KAOB_SESSION_SECRET || process.env.KAOB_POS_AUTH_PASSWORD || "";
}

const encoder = new TextEncoder();

async function firmar(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secreto()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Buffer.from(new Uint8Array(sig)).toString("base64url");
}

export async function crearSesion(usuario: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = Buffer.from(JSON.stringify({ u: usuario, exp })).toString("base64url");
  return `${payload}.${await firmar(payload)}`;
}

function tiemposIguales(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

export async function verificarSesion(cookieValue: string | null | undefined): Promise<boolean> {
  if (!cookieValue || !secreto()) return false;
  const [payloadB64, sig] = cookieValue.split(".");
  if (!payloadB64 || !sig) return false;

  if (!tiemposIguales(await firmar(payloadB64), sig)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as { u?: string; exp?: number };
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return false;
    return typeof payload.u === "string" && payload.u.length > 0;
  } catch {
    return false;
  }
}

export { MAX_AGE_SECONDS };
