// ───────────────────────── PAGOS: ADAPTER BOLD ─────────────────────────
// Payment Links API: crea un enlace "CLOSE" (monto fijo) y redirige al cliente.
// La verificación del resultado NO depende de firmas de webhook: se consulta
// el estado del link con la llave de identidad (fuente autoritativa).
// Fuente oficial: https://developers.bold.co/pagos-en-linea/api-link-de-pagos

import {
  configBold,
  boldConfigurado,
  type CrearPagoInput,
  type EstadoPago,
  type ResultadoPago,
} from "./tipos";
import { mapearEstadoBold } from "./estados";

export interface LinkPagoBold {
  payment_link: string; // LNK_*
  url: string; // https://checkout.bold.co/LNK_*
}


/** Crea un enlace de pago Bold de monto cerrado y devuelve su URL. */
export async function crearLinkPagoBold(pago: CrearPagoInput): Promise<ResultadoPago> {
  if (!boldConfigurado()) {
    return { ok: false, error: "Bold no está configurado (llave de identidad)." };
  }

  const referencia = pago.referencia.slice(0, 60); // Máximo 60 caracteres (docs)
  try {
    const res = await fetch(`${configBold.baseUrl}/online/link/v1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `x-api-key ${configBold.apiKey()}`,
      },
      body: JSON.stringify({
        amount_type: "CLOSE",
        amount: { currency: "COP", total_amount: pago.monto, tip_amount: 0 },
        reference: referencia,
        description: pago.descripcion.slice(0, 100) || "Pedido tienda KAOB",
        ...(pago.emailCliente ? { payer_email: pago.emailCliente } : {}),
        callback_url: pago.callbackUrl,
      }),
      cache: "no-store",
    });

    const json = (await res.json().catch(() => null)) as
      | { payload?: LinkPagoBold; errors?: Array<{ message?: string; status_code?: string }> }
      | null;

    if (!res.ok || !json?.payload?.payment_link) {
      const msg = json?.errors?.map((x) => x.message).filter(Boolean).join("; ");
      return { ok: false, error: msg || `Bold devolvió ${res.status}` };
    }

    return {
      ok: true,
      urlRedireccion: json.payload.url,
      referenciaExterna: json.payload.payment_link,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error contactando Bold." };
  }
}

/** Consulta el estado de un link Bold (idempotente, fuente autoritativa). */
export async function consultarLinkBold(
  paymentLink: string
): Promise<{ ok: boolean; estado?: EstadoPago; referencia?: string; error?: string }> {
  if (!boldConfigurado()) return { ok: false, error: "Bold sin llave configurada." };
  try {
    const res = await fetch(
      `${configBold.baseUrl}/online/link/v1/${encodeURIComponent(paymentLink)}`,
      { headers: { Authorization: `x-api-key ${configBold.apiKey()}` }, cache: "no-store" }
    );
    if (!res.ok) return { ok: false, error: `Bold devolvió ${res.status}` };
    const json = (await res.json()) as { status?: string; reference?: string };
    if (!json.status) return { ok: false, error: "Respuesta de Bold sin estado." };
    return { ok: true, estado: mapearEstadoBold(json.status), referencia: json.reference };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error consultando Bold." };
  }
}
