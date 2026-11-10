// ───────────────────────── WEBHOOK: WOMPI ─────────────────────────
// Público y firmado. Valida el checksum SHA256 (properties + timestamp +
// eventsSecret) y aplica el resultado de forma idempotente (FR-005).
// Responde 200 salvo cuerpo/fecha inválidos; 401 si la firma no coincide.
// Fuente: https://docs.wompi.co/docs/colombia/eventos/

import { NextResponse } from "next/server";
import { configWompi } from "@/lib/pagos/tipos";
import { mapearEstadoWompi } from "@/lib/pagos/estados";
import { validarChecksumWompi } from "@/lib/pagos/firmas";
import { aplicarResultadoPasarela } from "@/lib/pagos/cobros";

export async function POST(request: Request) {
  const evento = await request.json().catch(() => null);
  if (!evento) return NextResponse.json({ ok: false }, { status: 400 });

  const secreto = configWompi.eventsSecret();
  if (!secreto) return NextResponse.json({ ok: false, error: "Webhook sin secreto configurado." }, { status: 503 });

  const { valido, data } = validarChecksumWompi(evento, secreto);
  if (!valido || !data?.transaction) {
    return NextResponse.json({ ok: false, error: "Firma inválida." }, { status: 401 });
  }

  const tx = data.transaction as {
    reference?: string;
    status?: string;
    amount_in_cents?: number;
    amountInCents?: number;
  };

  if (!tx.reference) return NextResponse.json({ ok: false, error: "Evento sin referencia." }, { status: 400 });

  const resultado = await aplicarResultadoPasarela({
    proveedor: "WOMPI",
    referenciaExterna: `WOMPI-${tx.reference}`,
    estado: mapearEstadoWompi(tx.status),
    montoCents: tx.amount_in_cents ?? tx.amountInCents,
  });

  if (!resultado.ok) {
    // Referencia desconocida: seguimos respondiendo 200 para evitar reintentos
    // infinitos con eventos que no corresponden a pedidos de este sitio.
    return NextResponse.json({ ok: false, error: resultado.error }, { status: 200 });
  }

  return NextResponse.json({ ok: true, duplicado: Boolean(resultado.yaFinal) });
}

// Runtime Node (necesita node:crypto y acceso a BD).
export const runtime = "nodejs";
