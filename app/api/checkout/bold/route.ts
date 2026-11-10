// ───────────────────────── CHECKOUT: BOLD (Link de pago) ─────────────────────────
// Público (checkout de tienda). Crea el pedido, genera el link de pago de monto
// cerrado vía API de Bold y registra PagoOnline PENDIENTE con el LNK_*. El
// resultado se confirma por webhook (T012, que re-consulta el link).

import { NextResponse } from "next/server";
import { pedidoOnlineSchema, errorDesconocido } from "@/lib/validations";
import { crearPedidoConItems } from "@/lib/tienda/checkout-core";
import { db } from "@/lib/db";
import { configTienda, boldConfigurado } from "@/lib/pagos/tipos";
import { crearLinkPagoBold } from "@/lib/pagos/bold";

export async function POST(request: Request) {
  try {
    if (!boldConfigurado()) {
      return NextResponse.json({ ok: false, error: "El pago con Bold no está disponible por ahora." }, { status: 503 });
    }

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Datos incompletos." }, { status: 400 });

    const data = pedidoOnlineSchema.parse({ ...body, items: body?.items });

    const core = await crearPedidoConItems(data);
    if (!core.ok) return NextResponse.json({ ok: false, error: core.error }, { status: 409 });

    const { pedido } = core;
    const email = typeof body?.email === "string" ? body.email : undefined;

    const link = await crearLinkPagoBold({
      referencia: pedido.referencia,
      monto: pedido.total,
      descripcion: "Pedido tienda KΛOB",
      emailCliente: email,
      callbackUrl: `${configTienda.baseUrl()}/tienda/pago/${pedido.referencia}`,
    });

    if (!link.ok) {
      return NextResponse.json({ ok: false, error: link.error || "Bold no pudo crear el enlace de pago." }, { status: 502 });
    }

    await db.pagoOnline.create({
      data: {
        pedidoId: pedido.id,
        proveedor: "BOLD",
        estado: "PENDIENTE",
        referenciaExterna: link.referenciaExterna,
        monto: pedido.total,
        emailCliente: email ? String(email).slice(0, 200) : null,
      },
    });

    return NextResponse.json({
      ok: true,
      referencia: pedido.referencia,
      total: pedido.total,
      url: link.urlRedireccion,
    });
  } catch (e) {
    const error = errorDesconocido(e);
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
}
