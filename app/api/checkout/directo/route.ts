// ───────────────────────── CHECKOUT: MÉTODOS DIRECTOS ─────────────────────────
// Público. Addi / Sistecrédito se registran con documento (la validación de
// crédito ocurre offline; el desembolso se concilia en /bancos/plataformas con
// PagoVenta cuando el pedido se convierte en Venta). Fiado valida cupo vivo
// (AC3: cupo insuficiente → error legible, sin pedido). Contraentrega queda
// pendiente de cobro en la entrega.

import { NextResponse } from "next/server";
import { checkoutDirectoSchema, errorDesconocido } from "@/lib/validations";
import { crearPedidoConItems } from "@/lib/tienda/checkout-core";
import { db } from "@/lib/db";
import { registrarPagoDirecto, validarCupoFiado } from "@/lib/pagos/cobros";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Datos incompletos." }, { status: 400 });

    const data = checkoutDirectoSchema.parse(body);

    const core = await crearPedidoConItems(data);
    if (!core.ok) return NextResponse.json({ ok: false, error: core.error }, { status: 409 });

    // Fiado: validar el cupo contra el total real del pedido; si no alcanza,
    // el pedido recién creado no debe quedar huérfano en el panel (AC3).
    if (data.metodo === "FIADO") {
      const cupo = await validarCupoFiado(data.documento || "", core.pedido.total);
      if (!cupo.ok) {
        await db.pedido.delete({ where: { id: core.pedido.id } });
        return NextResponse.json({ ok: false, error: cupo.error }, { status: 409 });
      }
    }

    if ((data.metodo === "ADDI" || data.metodo === "SISTECREDITO" || data.metodo === "FIADO") && !data.documento) {
      return NextResponse.json({ ok: false, error: "Escribe el número de documento para continuar." }, { status: 400 });
    }

    await registrarPagoDirecto({
      pedidoId: core.pedido.id,
      monto: core.pedido.total,
      proveedor: data.metodo,
      emailCliente: data.email || undefined,
      documentoCliente: data.documento || undefined,
    });

    return NextResponse.json({
      ok: true,
      referencia: core.pedido.referencia,
      total: core.pedido.total,
    });
  } catch (e) {
    const error = errorDesconocido(e);
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
}
