// ───────────────────────── PAGOS: ADAPTER WOMPI ─────────────────────────
// Web Checkout (redirect por formulario) + consulta de transacción + validación
// de eventos transaction.updated. Sin SDKs: REST + SHA256 nativo.
// Fuente oficial: https://docs.wompi.co/docs/colombia/transacciones y /eventos/

import {
  configWompi,
  type CrearPagoInput,
  type EstadoPago,
  type ResultadoPago,
} from "./tipos";
import { firmaIntegridadWompi, validarChecksumWompi } from "./firmas";
import { mapearEstadoWompi } from "./estados";

export interface CheckoutWompi {
  url: string; // POST target del Web Checkout
  campos: Record<string, string>; // Inputs hidden del formulario
}

/**
 * El cliente se redirige haciendo POST al Web Checkout con llave pública +
 * firma de integridad calculada en servidor. No se contacta la API al crear:
 * la creación efectiva ocurre en la página hospedada de Wompi.
 */
export function armarCheckoutWompi(pago: CrearPagoInput): CheckoutWompi {
  return { url: configWompi.checkoutUrl, campos: camposCheckoutWompi(pago) };
}

export function camposCheckoutWompi(pago: CrearPagoInput): Record<string, string> {
  const secreto = configWompi.integritySecret() || "";
  const firma = firmaIntegridadWompi({
    referencia: pago.referencia,
    montoCents: pago.monto,
    moneda: "COP",
    secreto,
  });

  const campos: Record<string, string> = {
    "public-key": configWompi.publicKey() || "",
    currency: "COP",
    "amount-in-cents": String(pago.monto),
    reference: pago.referencia,
    "signature:integrity": firma,
    "redirect-url": pago.callbackUrl,
  };
  if (pago.emailCliente) campos["customer-email"] = pago.emailCliente;
  return campos;
}

/**
 * Consulta una transacción Wompi con la llave privada (servidor). La consulta
 * pública con pub_* dejó de estar soportada (404) — docs 2025+.
 */
export async function consultarTransaccionWompi(
  transactionId: string
): Promise<{ ok: boolean; estado?: EstadoPago; montoCents?: number; referencia?: string; error?: string }> {
  const llave = configWompi.privateKey();
  if (!llave) return { ok: false, error: "Wompi sin llave privada configurada." };

  try {
    const res = await fetch(`${configWompi.baseUrl}/v1/transactions/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${llave}` },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: `Wompi devolvió ${res.status}` };
    const json = (await res.json()) as {
      data?: { id?: string; amount_in_cents?: number; status?: string; reference?: string };
    };
    const tx = json.data;
    if (!tx?.status) return { ok: false, error: "Respuesta de Wompi sin estado." };
    return {
      ok: true,
      estado: mapearEstadoWompi(tx.status),
      montoCents: tx.amount_in_cents,
      referencia: tx.reference,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error consultando Wompi." };
  }
}

export { validarChecksumWompi };
