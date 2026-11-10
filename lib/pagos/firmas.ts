// ───────────────────────── PAGOS: FIRMAS Y CHECKSUMS ─────────────────────────
// SHA256 nativo (node:crypto) con comparación en tiempo constante.
// Solo servidor; ningún llamador debe importar esto desde el cliente.

import { createHash, timingSafeEqual } from "node:crypto";

export function sha256Hex(cadena: string): string {
  return createHash("sha256").update(cadena, "utf8").digest("hex");
}

export function comparacionSegura(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// ── Wompi: firma de integridad del Web Checkout ──
// SHA256 de: <referencia><amountInCents><currency><integritySecret>
// Fuente: https://docs.wompi.co/en/docs/colombia/widget-checkout-web
export function firmaIntegridadWompi(params: {
  referencia: string;
  montoCents: number;
  moneda: string;
  secreto: string;
}): string {
  return sha256Hex(
    `${params.referencia}${params.montoCents}${params.moneda}${params.secreto}`
  );
}

// ── Wompi: validación del evento transaction.updated ──
// Concatena los valores de signature.properties (en orden), el timestamp y el
// secreto de eventos; compara con checksum en tiempo constante.
// Fuente: https://docs.wompi.co/docs/colombia/eventos/
interface EventoWompi {
  event?: string;
  data?: { transaction?: Record<string, unknown> };
  signature?: { properties?: string[]; checksum?: string };
  timestamp?: number;
}

function valorPropiedadWompi(tx: Record<string, unknown>, propiedad: string): string {
  // Las propiedades son rutas tipo "transaction.id": tomamos la clave final y
  // aceptamos tanto snake_case (amount_in_cents, API histórica) como camelCase
  // (API de eventos moderna).
  const campo = propiedad.includes(".")
    ? propiedad.slice(propiedad.lastIndexOf(".") + 1)
    : propiedad;
  const valor =
    tx[campo] ?? tx[campo.replace(/_([a-z])/g, (_, c) => c.toUpperCase())];
  if (valor === undefined || valor === null) return "";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

export function validarChecksumWompi(
  evento: unknown,
  secreto: string
): { valido: boolean; data?: { transaction: Record<string, unknown> } } {
  const e = (evento ?? {}) as EventoWompi;
  if (!e.data?.transaction || !e.signature?.properties || !e.signature.checksum || !e.timestamp) {
    return { valido: false };
  }
  const concatenado =
    e.signature.properties.map((p) => valorPropiedadWompi(e.data!.transaction!, p)).join("") +
    String(e.timestamp) +
    secreto;
  const checksum = sha256Hex(concatenado).toUpperCase();
  const recibido = e.signature.checksum.toUpperCase();
  return {
    valido: comparacionSegura(checksum, recibido),
    data: { transaction: e.data.transaction },
  };
}
