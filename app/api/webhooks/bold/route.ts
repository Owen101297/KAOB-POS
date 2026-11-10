// ───────────────────────── WEBHOOK: BOLD ─────────────────────────
// Público. Bold no firma los eventos del link de pago con un esquema simple:
// la fuente autoritativa es la API de consulta (GET /online/link/v1/{link}).
// Al recibir cualquier evento, re-consultamos el estado determinado por Bold y
// lo aplicamos idempotentemente (FR-005).

import { NextResponse } from "next/server";
import { consultarLinkBold } from "@/lib/pagos/bold";
import { aplicarResultadoPasarela } from "@/lib/pagos/cobros";

interface EventoBold {
  id?: string;
  type?: string;
  data?: { payment_link?: string; id?: string; status?: string };
  payload?: { payment_link?: string; id?: string; status?: string };
}

export async function POST(request: Request) {
  const evento = (await request.json().catch(() => null)) as EventoBold | null;
  if (!evento) return NextResponse.json({ ok: false }, { status: 400 });

  const linkId = evento.data?.payment_link || evento.payload?.payment_link || evento.id;
  if (!linkId) return NextResponse.json({ ok: false, error: "Evento sin link." }, { status: 400 });

  const estado = await consultarLinkBold(linkId);
  if (!estado.ok) {
    return NextResponse.json({ ok: false, error: estado.error }, { status: 200 });
  }

  const aplicado = await aplicarResultadoPasarela({
    proveedor: "BOLD",
    referenciaExterna: estado.referencia && estado.referencia.startsWith("LNK_") ? estado.referencia : linkId,
    estado: estado.estado || "PENDIENTE",
  });

  // La llave de identidad de Bold nunca vive en el navegador; solo servidor.
  return NextResponse.json({ ok: aplicado.ok, duplicado: Boolean(aplicado.yaFinal) });
}

// Runtime Node (necesita acceso a BD).
export const runtime = "nodejs";
