"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  ajustarPuntosSchema,
  crearPlanSepareSchema,
  emitirGiftCardSchema,
  errorDesconocido,
  promocionSchema,
  registrarAbonoSepareSchema,
  type ActionResult,
} from "@/lib/validations";

const FIDELIZACION_PATHS = [
  "/plan-separe",
  "/puntos",
  "/promociones",
  "/gift-cards",
  "/clientes",
  "/inventario",
  "/ventas/nueva",
];

function revalidarFidelizacion() {
  FIDELIZACION_PATHS.forEach((p) => revalidatePath(p));
}

const varianteInclude = {
  include: {
    color: true,
    talla: true,
    producto: { select: { nombre: true, referencia: true } },
  },
} as const;

// ───────────────────────── PLAN SEPARE ─────────────────────────

export async function listarPlanesSepare(opts?: {
  clienteId?: number;
  estado?: string;
  take?: number;
}) {
  return db.planSepare.findMany({
    where: {
      ...(opts?.clienteId ? { clienteId: opts.clienteId } : {}),
      ...(opts?.estado && opts.estado !== "TODOS" ? { estado: opts.estado } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 100,
    include: {
      cliente: true,
      bodega: true,
      items: { include: { variante: varianteInclude } },
      abonos: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type PlanSepareLista = Awaited<ReturnType<typeof listarPlanesSepare>>[number];

export async function obtenerConsecutivoSepare(): Promise<number> {
  const ultimo = await db.planSepare.findFirst({
    orderBy: { consecutivo: "desc" },
    select: { consecutivo: true },
  });
  return (ultimo?.consecutivo ?? 0) + 1;
}

export async function crearPlanSepare(
  input: unknown
): Promise<ActionResult<{ id: number; consecutivo: number; codigo: string }>> {
  try {
    const data = crearPlanSepareSchema.parse(input);

    // Verificar stock disponible para reservar
    for (const item of data.items) {
      const stock = await db.stockBodega.findUnique({
        where: {
          varianteId_bodegaId: {
            varianteId: item.varianteId,
            bodegaId: data.bodegaId,
          },
        },
      });
      if (!stock || stock.cantidad < item.cantidad) {
        const v = await db.variante.findUnique({
          where: { id: item.varianteId },
          select: { sku: true },
        });
        return {
          ok: false,
          error: `Stock insuficiente para apartar ${v?.sku ?? "artículo"}.`,
        };
      }
    }

    const consecutivo = await obtenerConsecutivoSepare();
    const codigo = `PS-${String(consecutivo).padStart(4, "0")}`;

    const total = data.items.reduce(
      (a, i) => a + i.cantidad * i.precioUnitario,
      0
    );
    const saldoPendiente = Math.max(0, total - data.abonoInicial);

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + data.diasLimite);

    const plan = await db.$transaction(async (tx) => {
      const ps = await tx.planSepare.create({
        data: {
          consecutivo,
          clienteId: data.clienteId,
          bodegaId: data.bodegaId,
          total,
          saldoPendiente,
          fechaLimite,
          estado: saldoPendiente === 0 ? "ENTREGADO" : "ACTIVO",
          nota: data.nota || null,
        },
      });

      for (const item of data.items) {
        await tx.planSepareItem.create({
          data: {
            planSepareId: ps.id,
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.cantidad * item.precioUnitario,
          },
        });

        // Descontar inventario disponible (reserva física de la prenda)
        await tx.stockBodega.update({
          where: {
            varianteId_bodegaId: {
              varianteId: item.varianteId,
              bodegaId: data.bodegaId,
            },
          },
          data: { cantidad: { decrement: item.cantidad } },
        });

        await tx.movimientoInventario.create({
          data: {
            varianteId: item.varianteId,
            tipo: "AJUSTE_SALIDA",
            cantidad: item.cantidad,
            bodegaOrigenId: data.bodegaId,
            nota: `Reserva por Plan Separe ${codigo}`,
            refDocumento: codigo,
          },
        });
      }

      // Si hubo abono inicial, registrarlo
      if (data.abonoInicial > 0) {
        await tx.abonoPlanSepare.create({
          data: {
            planSepareId: ps.id,
            monto: data.abonoInicial,
            metodo: (data.metodoAbono as any) ?? "EFECTIVO",
            referencia: data.referenciaAbono || null,
            nota: "Cuota inicial",
          },
        });

        if (data.metodoAbono === "EFECTIVO" || !data.metodoAbono) {
          const sesion = await tx.sesionCaja.findFirst({
            where: { estado: "ABIERTA", bodegaId: data.bodegaId },
            orderBy: { openedAt: "desc" },
          });
          if (sesion) {
            await tx.movimientoCaja.create({
              data: {
                sesionId: sesion.id,
                tipo: "VENTA_EFECTIVO",
                monto: data.abonoInicial,
                referencia: `Abono inicial ${codigo}`,
              },
            });
          }
        }
      }

      return ps;
    });

    revalidarFidelizacion();
    return { ok: true, data: { id: plan.id, consecutivo, codigo } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function registrarAbonoSepare(
  input: unknown
): Promise<ActionResult<{ nuevoSaldo: number }>> {
  try {
    const data = registrarAbonoSepareSchema.parse(input);

    const plan = await db.planSepare.findUnique({
      where: { id: data.planSepareId },
      include: { cliente: true },
    });

    if (!plan) return { ok: false, error: "El plan separe no existe." };
    if (plan.estado !== "ACTIVO")
      return { ok: false, error: "Este plan separe no se encuentra activo." };
    if (data.monto > plan.saldoPendiente) {
      return {
        ok: false,
        error: `El abono (${data.monto}) no puede superar el saldo pendiente (${plan.saldoPendiente}).`,
      };
    }

    const nuevoSaldo = plan.saldoPendiente - data.monto;
    const nuevoEstado = nuevoSaldo === 0 ? "ENTREGADO" : "ACTIVO";
    const codigo = `PS-${String(plan.consecutivo).padStart(4, "0")}`;

    await db.$transaction(async (tx) => {
      await tx.abonoPlanSepare.create({
        data: {
          planSepareId: data.planSepareId,
          monto: data.monto,
          metodo: data.metodo as any,
          referencia: data.referencia || null,
          nota: data.nota || null,
        },
      });

      await tx.planSepare.update({
        where: { id: data.planSepareId },
        data: {
          saldoPendiente: nuevoSaldo,
          estado: nuevoEstado,
        },
      });

      if (data.metodo === "EFECTIVO" && data.bodegaId) {
        const sesion = await tx.sesionCaja.findFirst({
          where: { estado: "ABIERTA", bodegaId: data.bodegaId },
          orderBy: { openedAt: "desc" },
        });
        if (sesion) {
          await tx.movimientoCaja.create({
            data: {
              sesionId: sesion.id,
              tipo: "VENTA_EFECTIVO",
              monto: data.monto,
              referencia: `Abono Plan Separe ${codigo}`,
            },
          });
        }
      }
    });

    revalidarFidelizacion();
    return { ok: true, data: { nuevoSaldo } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function cancelarPlanSepare(
  id: number,
  motivo: string
): Promise<ActionResult> {
  try {
    const plan = await db.planSepare.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!plan) return { ok: false, error: "El plan separe no existe." };
    if (plan.estado === "CANCELADO")
      return { ok: false, error: "El plan ya se encuentra cancelado." };

    await db.$transaction(async (tx) => {
      // Revertir inventario reservado
      for (const item of plan.items) {
        await tx.stockBodega.update({
          where: {
            varianteId_bodegaId: {
              varianteId: item.varianteId,
              bodegaId: plan.bodegaId,
            },
          },
          data: { cantidad: { increment: item.cantidad } },
        });

        await tx.movimientoInventario.create({
          data: {
            varianteId: item.varianteId,
            tipo: "AJUSTE_ENTRADA",
            cantidad: item.cantidad,
            bodegaDestinoId: plan.bodegaId,
            nota: `Devolución por cancelación Plan Separe PS-${String(plan.consecutivo).padStart(4, "0")}: ${motivo}`,
            refDocumento: `PS-${String(plan.consecutivo).padStart(4, "0")}`,
          },
        });
      }

      await tx.planSepare.update({
        where: { id },
        data: {
          estado: "CANCELADO",
          nota: (plan.nota ? plan.nota + "\n" : "") + `CANCELADO: ${motivo}`,
        },
      });
    });

    revalidarFidelizacion();
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ───────────────────────── PUNTOS Y FIDELIZACIÓN ─────────────────────────

export async function listarMovimientosPuntos(clienteId?: number) {
  return db.movimientoPuntos.findMany({
    where: clienteId ? { clienteId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { cliente: true },
  });
}

export type MovimientoPuntosLista = Awaited<ReturnType<typeof listarMovimientosPuntos>>[number];

export async function obtenerPuntosCliente(clienteId: number): Promise<number> {
  const ultimo = await db.movimientoPuntos.findFirst({
    where: { clienteId },
    orderBy: { createdAt: "desc" },
    select: { saldoResultante: true },
  });
  return ultimo?.saldoResultante ?? 0;
}

export async function ajustarPuntos(input: unknown): Promise<ActionResult> {
  try {
    const data = ajustarPuntosSchema.parse(input);

    const saldoActual = await obtenerPuntosCliente(data.clienteId);
    let delta = data.puntos;
    if (data.tipo === "REDENCION") delta = -data.puntos;

    const saldoResultante = Math.max(0, saldoActual + delta);

    await db.movimientoPuntos.create({
      data: {
        clienteId: data.clienteId,
        tipo: data.tipo,
        puntos: data.puntos,
        saldoResultante,
        nota: data.nota || null,
      },
    });

    revalidarFidelizacion();
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ───────────────────────── PROMOCIONES Y DESCUENTOS ─────────────────────────

export async function listarPromociones() {
  return db.promocion.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export type PromocionLista = Awaited<ReturnType<typeof listarPromociones>>[number];

export async function guardarPromocion(input: unknown): Promise<ActionResult> {
  try {
    const data = promocionSchema.parse(input);

    const fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : null;
    const fechaFin = data.fechaFin ? new Date(data.fechaFin) : null;

    if (data.id) {
      await db.promocion.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          tipo: data.tipo,
          valor: data.valor,
          montoMinimo: data.montoMinimo,
          activa: data.activa,
          fechaInicio,
          fechaFin,
        },
      });
    } else {
      await db.promocion.create({
        data: {
          nombre: data.nombre,
          tipo: data.tipo,
          valor: data.valor,
          montoMinimo: data.montoMinimo,
          activa: data.activa,
          fechaInicio,
          fechaFin,
        },
      });
    }

    revalidarFidelizacion();
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function togglePromocion(id: number): Promise<ActionResult> {
  try {
    const promo = await db.promocion.findUniqueOrThrow({ where: { id } });
    await db.promocion.update({
      where: { id },
      data: { activa: !promo.activa },
    });
    revalidarFidelizacion();
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ───────────────────────── TARJETAS DE REGALO ─────────────────────────

export async function listarGiftCards() {
  return db.giftCard.findMany({
    orderBy: { createdAt: "desc" },
    include: { cliente: true },
  });
}

export type GiftCardLista = Awaited<ReturnType<typeof listarGiftCards>>[number];

export async function emitirGiftCard(input: unknown): Promise<ActionResult> {
  try {
    const data = emitirGiftCardSchema.parse(input);
    const fechaVencimiento = data.fechaVencimiento
      ? new Date(data.fechaVencimiento)
      : null;

    await db.giftCard.create({
      data: {
        codigo: data.codigo.toUpperCase(),
        montoInicial: data.montoInicial,
        saldoActual: data.montoInicial,
        clienteId: data.clienteId ?? null,
        estado: "ACTIVA",
        fechaVencimiento,
      },
    });

    revalidarFidelizacion();
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}
