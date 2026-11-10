// ───────────────────────── PAGOS: ORQUESTADOR DE COBROS ─────────────────────────
// Registro de pagos directos (sin pasarela) y aplicación idempotente de
// resultados de pasarela (webhook o consulta). Contrato: specs/002-tienda-venta/
// contracts/pagos.md. Nota v1: PagoVenta (conciliation con /bancos/plataformas)
// se crea cuando el pedido se convierte en Venta en POS, no al aprobar el pago
// online (PagoVenta exige ventaId en el esquema actual).

import { db } from "@/lib/db";
import type { EstadoPago, ProveedorDirecto, ProveedorPago } from "./tipos";
import type { PagoOnline } from "@prisma/client";

// ─────────────────────── REGISTRO DE PAGOS DIRECTOS ───────────────────────

export interface RegistroDirectoInput {
  pedidoId: number;
  monto: number;
  proveedor: ProveedorDirecto;
  emailCliente?: string;
  documentoCliente?: string;
}

function validarDocumento(documento?: string): string | undefined {
  if (!documento) return undefined;
  const limpio = documento.replace(/\s/g, "");
  if (limpio.length < 6 || limpio.length > 12 || !/^\d+$/.test(limpio)) {
    throw new Error("Documento inválido: debe tener entre 6 y 12 dígitos.");
  }
  return limpio;
}

/**
 * Fiado: el cliente debe existir por su documento y tener cupo disponible
 * (cupo − saldo de créditos PENDIENTE ≥ total del pedido, AC3 del spec).
 * Devuelve error legible sin crear pedido ni pago.
 */
export async function validarCupoFiado(
  documento: string,
  monto: number
): Promise<{ ok: true; clienteId: number } | { ok: false; error: string }> {
  const cliente = await db.cliente.findFirst({
    where: { documento, activo: true },
    select: { id: true, nombre: true, cupoCredito: true },
  });
  if (!cliente || cliente.cupoCredito <= 0) {
    return {
      ok: false,
      error: "No encontramos crédito activo para ese documento. Elige otro método de pago.",
    };
  }

  const pendiente = await db.creditoCliente.aggregate({
    where: { clienteId: cliente.id, estado: "PENDIENTE" },
    _sum: { saldoPendiente: true },
  });

  const saldoUsado = pendiente._sum.saldoPendiente ?? 0;
  if (saldoUsado + monto > cliente.cupoCredito) {
    return {
      ok: false,
      error: `Tu cupo disponible ($${Math.max(cliente.cupoCredito - saldoUsado, 0).toLocaleString("es-CO")}) no cubre el total del pedido.`,
    };
  }

  return { ok: true, clienteId: cliente.id };
}

/** Registra el PagoOnline de un método directo sobre un pedido ya creado. */
export async function registrarPagoDirecto(
  input: RegistroDirectoInput
): Promise<PagoOnline> {
  const documento = validarDocumento(input.documentoCliente);

  return db.pagoOnline.create({
    data: {
      pedidoId: input.pedidoId,
      proveedor: input.proveedor,
      estado: "EN_TRANSITO", // Se cobra en la entrega (o se gestiona con el cliente) — estado v1
      monto: input.monto,
      documentoCliente: documento,
      emailCliente: input.emailCliente || null,
    },
  });
}

// ─────────────────────── RESULTADOS DE PASARELA ───────────────────────

const ESTADOS_FINALES: EstadoPago[] = ["APROBADO", "RECHAZADO", "CANCELADO"];

/**
 * Aplica un resultado de pasarela de forma idempotente (FR-005):
 * - Pago ya final → se ignora y se cuenta como evento duplicado.
 * - APROBADO → marca pedido EMPACADO? No: el despacho sigue en manos del POS.
 *   Solo queda constancia del pago en PagoOnline; /ventas-online lo muestra.
 * - RECHAZADO/CANCELADO → el pedido queda pendiente de un reintento.
 */
export async function aplicarResultadoPasarela(params: {
  proveedor: "WOMPI" | "BOLD";
  referenciaExterna: string;
  estado: EstadoPago;
  montoCents?: number;
}): Promise<{ ok: boolean; yaFinal?: boolean; error?: string }> {
  const pago = await db.pagoOnline.findUnique({
    where: { referenciaExterna: params.referenciaExterna },
  });
  if (!pago) return { ok: false, error: "Pago no encontrado para la referencia de la pasarela." };

  if (ESTADOS_FINALES.includes(pago.estado)) {
    await db.pagoOnline.update({
      where: { id: pago.id },
      data: { webhookEventos: { increment: 1 } },
    });
    return { ok: true, yaFinal: true };
  }

  await db.$transaction([
    db.pagoOnline.update({
      where: { id: pago.id },
      data: {
        estado: params.estado,
        webhookEventos: { increment: 1 },
      },
    }),
    ...(params.estado === "APROBADO"
      ? [
          db.pedido.update({
            where: { id: pago.pedidoId },
            data: { estadoEn: new Date() },
          }),
        ]
      : []),
  ]);

  return { ok: true };
}

/**
 * Localiza el pago de una referencia de pedido (para la página de retorno y
 * polling suave del cliente). No toca pasarelas: solo lectura local.
 */
export async function consultarPagoDePedido(referencia: string) {
  const pedido = await db.pedido.findUnique({
    where: { referencia },
    select: {
      id: true,
      referencia: true,
      total: true,
      estado: true,
      pago: {
        select: {
          proveedor: true,
          estado: true,
          referenciaExterna: true,
          updatedAt: true,
        },
      },
    },
  });
  if (!pedido) return null;
  return {
    id: pedido.id,
    referencia: pedido.referencia,
    total: pedido.total,
    estadoPedido: pedido.estado,
    pago: pedido.pago
      ? {
          proveedor: pedido.pago.proveedor,
          estado: pedido.pago.estado,
          referenciaExterna: pedido.pago.referenciaExterna,
          updatedAt: pedido.pago.updatedAt.toISOString(),
        }
      : null,
  };
}
