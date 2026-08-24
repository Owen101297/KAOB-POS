"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  abrirCajaSchema,
  errorDesconocido,
  movimientoCajaSchema,
  type ActionResult,
} from "@/lib/validations";
import { registrarAuditoria } from "@/lib/actions/auditoria";

const CAJA_PATHS = ["/caja/apertura", "/caja/cerrar", "/caja/cierres", "/ventas/nueva", "/auditoria"];

function revalidarCaja() {
  CAJA_PATHS.forEach((p) => revalidatePath(p));
}

// ─────────────────────────── SESIONES ──────────────────────────

export type SesionCajaAbierta = Awaited<ReturnType<typeof obtenerSesionAbierta>>;

export async function obtenerSesionAbierta(bodegaId?: number) {
  return db.sesionCaja.findFirst({
    where: {
      estado: "ABIERTA",
      ...(bodegaId ? { bodegaId } : {}),
    },
    orderBy: { openedAt: "desc" },
    include: { bodega: true, movimientos: true },
  });
}

export async function listarSesionesCaja(opts?: { estado?: string; take?: number }) {
  return db.sesionCaja.findMany({
    where: opts?.estado ? { estado: opts.estado } : undefined,
    orderBy: { openedAt: "desc" },
    take: opts?.take ?? 50,
    include: { bodega: true, movimientos: true },
  });
}

export async function obtenerSesionCaja(id: number) {
  return db.sesionCaja.findUnique({
    where: { id },
    include: { bodega: true, movimientos: { orderBy: { createdAt: "asc" } } },
  });
}

export async function abrirCaja(input: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const data = abrirCajaSchema.parse(input);

    // Verificar que no haya otra caja abierta (global o misma bodega)
    const existe = await db.sesionCaja.findFirst({
      where: { estado: "ABIERTA", ...(data.bodegaId ? { bodegaId: data.bodegaId } : {}) },
    });
    if (existe) return { ok: false, error: "Ya hay una caja abierta." };

    const sesion = await db.sesionCaja.create({
      data: {
        baseInicial: data.baseInicial,
        bodegaId: data.bodegaId ?? null,
        estado: "ABIERTA",
      },
    });

    if (data.baseInicial > 0) {
      await db.movimientoCaja.create({
        data: {
          sesionId: sesion.id,
          tipo: "INGRESO_BASE",
          monto: data.baseInicial,
          referencia: "Base inicial de caja",
        },
      });
    }

    await registrarAuditoria({
      modulo: "CAJA",
      accion: "CREACION",
      entidad: `Sesión de Caja #${sesion.id}`,
      entidadId: sesion.id,
      descripcion: `Apertura de caja con base inicial de $${data.baseInicial.toLocaleString("es-CO")}`,
    });

    revalidarCaja();
    return { ok: true, data: { id: sesion.id } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function cerrarCaja(
  sesionId: number,
  totalesContados: Record<string, number>
): Promise<ActionResult<{ id: number }>> {
  try {
    const sesion = await db.sesionCaja.findUnique({
      where: { id: sesionId },
      include: { movimientos: true, bodega: true },
    });
    if (!sesion) return { ok: false, error: "La sesión no existe." };
    if (sesion.estado !== "ABIERTA") return { ok: false, error: "La caja ya está cerrada." };

    const esperadoEfectivo = (await resumenCajaActual(sesion.bodegaId ?? undefined))?.esperadoEfectivo ?? 0;
    const contadoEfectivo = totalesContados.EFECTIVO ?? 0;
    const diffEfectivo = contadoEfectivo - esperadoEfectivo;

    await db.$transaction(async (tx) => {
      // Registrar diferencias como movimientos de ajuste
      if (diffEfectivo !== 0) {
        await tx.movimientoCaja.create({
          data: {
            sesionId,
            tipo: "OTRO",
            monto: diffEfectivo,
            referencia: `Diferencia arqueo efectivo (esperado ${esperadoEfectivo}, contado ${contadoEfectivo})`,
          },
        });
      }

      await tx.sesionCaja.update({
        where: { id: sesionId },
        data: { estado: "CERRADA", closedAt: new Date() },
      });
    });

    await registrarAuditoria({
      modulo: "CAJA",
      accion: "CIERRE",
      entidad: `Sesión de Caja #${sesionId}`,
      entidadId: sesionId,
      descripcion: `Cierre de caja. Efectivo contado: $${contadoEfectivo.toLocaleString("es-CO")}, Esperado: $${esperadoEfectivo.toLocaleString("es-CO")}, Diferencia: $${diffEfectivo.toLocaleString("es-CO")}`,
      detalles: {
        contado: contadoEfectivo,
        esperado: esperadoEfectivo,
        diferencia: diffEfectivo,
      },
    });

    revalidarCaja();
    return { ok: true, data: { id: sesionId } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function agregarMovimientoCaja(input: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const data = movimientoCajaSchema.parse(input);

    const sesion = await db.sesionCaja.findUniqueOrThrow({ where: { id: data.sesionId } });
    if (sesion.estado !== "ABIERTA") return { ok: false, error: "La caja está cerrada." };

    const mov = await db.movimientoCaja.create({
      data: {
        sesionId: data.sesionId,
        tipo: data.tipo,
        monto: data.monto,
        referencia: data.referencia || null,
        ventaId: data.ventaId ?? null,
      },
    });

    revalidarCaja();
    return { ok: true, data: { id: mov.id } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── RESUMEN CAJA ──────────────────────────

export async function resumenCajaActual(bodegaId?: number) {
  const sesion = await obtenerSesionAbierta(bodegaId);
  if (!sesion) return null;

  const movimientos = sesion.movimientos;
  const ingresoBase = movimientos.filter((m) => m.tipo === "INGRESO_BASE").reduce((a, m) => a + m.monto, 0);
  const retiros = movimientos.filter((m) => m.tipo === "RETIRO").reduce((a, m) => a + m.monto, 0);
  const suplidos = movimientos.filter((m) => m.tipo === "SUPLIDO").reduce((a, m) => a + m.monto, 0);
  const ventasEfectivo = movimientos.filter((m) => m.tipo === "VENTA_EFECTIVO").reduce((a, m) => a + m.monto, 0);
  const otros = movimientos.filter((m) => m.tipo === "OTRO").reduce((a, m) => a + m.monto, 0);

  return {
    sesion,
    ingresoBase,
    retiros,
    suplidos,
    ventasEfectivo,
    otros,
    esperadoEfectivo: ingresoBase + ventasEfectivo - retiros - suplidos + otros,
  };
}