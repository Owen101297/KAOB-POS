// ───────────────────────── CHECKOUT: WOMPI (Web Checkout) ─────────────────────────
// Público (checkout de tienda). Crea el pedido, registra PagoOnline PENDIENTE y
// devuelve el formulario del Web Checkout con la firma de integridad calculada
// en servidor. La creación de la transacción ocurre en la página de Wompi; el
// resultado se confirma por webhook (T011) o consulta en la página de retorno.

import { NextResponse } from "next/server";
import { pedidoOnlineSchema, errorDesconocido } from "@/lib/validations";
import { crearPedidoConItems } from "@/lib/tienda/checkout-core";
import { db } from "@/lib/db";
import { configTienda, wompiConfigurado } from "@/lib/pagos/tipos";
import { armarCheckoutWompi } from "@/lib/pagos/wompi";

export async function POST(request: Request) {
  try {
    if (!wompiConfigurado()) {
      return NextResponse.json({ ok: false, error: "El pago con tarjeta no está disponible por ahora." }, { status: 503 });
    }

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Datos incompletos." }, { status: 400 });

    const data = pedidoOnlineSchema.parse({ ...body, items: body?.items });

    const core = await crearPedidoConItems(data);
    if (!core.ok) return NextResponse.json({ ok: false, error: core.error }, { status: 409 });

    const { pedido } = core;
    const checkout = armarCheckoutWompi({
      referencia: pedido.referencia,
      monto: pedido.total,
      descripcion: "Pedido tienda KΛOB",
      emailCliente: typeof body?.email === "string" ? body.email : undefined,
      callbackUrl: `${configTienda.baseUrl()}/tienda/pago/${pedido.referencia}`,
    });

    // Un pago por pedido (schema pagos_online.pedidoId unique).
    await db.pagoOnline.create({
      data: {
        pedidoId: pedido.id,
        proveedor: "WOMPI",
        estado: "PENDIENTE",
        referenciaExterna: `WOMPI-${pedido.referencia}`,
        monto: pedido.total,
        emailCliente: typeof body?.email === "string" ? String(body.email).slice(0, 200) : null,
      },
    });

    return NextResponse.json({
      ok: true,
      referencia: pedido.referencia,
      total: pedido.total,
      url: checkout.url,
      campos: checkout.campos,
    });
  } catch (e) {
    const error = errorDesconocido(e);
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
}
