"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { gastoSchema, errorDesconocido, type ActionResult } from "@/lib/validations";
import { registrarAuditoria } from "@/lib/actions/auditoria";

const GASTOS_PATHS = ["/gastos", "/caja/cerrar", "/caja/cierres", "/bancos", "/bancos/movimientos", "/informes"];

function revalidarGastos() {
  GASTOS_PATHS.forEach((p) => revalidatePath(p));
}

export interface FiltrosGastos {
  categoria?: string;
  metodoPago?: string;
  cuentaBancariaId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
  take?: number;
}

export async function listarGastos(filtros?: FiltrosGastos) {
  try {
    const where: Record<string, unknown> = {};

    if (filtros?.categoria && filtros.categoria !== "TODAS") {
      where.categoria = filtros.categoria;
    }

    if (filtros?.metodoPago && filtros.metodoPago !== "TODOS") {
      where.metodoPago = filtros.metodoPago;
    }

    if (filtros?.cuentaBancariaId) {
      where.cuentaBancariaId = filtros.cuentaBancariaId;
    }

    if (filtros?.estado && filtros.estado !== "TODOS") {
      where.estado = filtros.estado;
    }

    if (filtros?.fechaInicio || filtros?.fechaFin) {
      where.fecha = {
        ...(filtros.fechaInicio ? { gte: new Date(filtros.fechaInicio) } : {}),
        ...(filtros.fechaFin ? { lte: new Date(filtros.fechaFin + "T23:59:59.999Z") } : {}),
      };
    }

    return await db.gasto.findMany({
      where,
      orderBy: { fecha: "desc" },
      take: filtros?.take ?? 100,
      include: {
        cuentaBancaria: true,
      },
    });
  } catch (error) {
    console.error("Error al listar gastos:", error);
    return [];
  }
}

export type GastoItem = Awaited<ReturnType<typeof listarGastos>>[number];

export async function registrarGasto(formData: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const parsed = gastoSchema.safeParse(formData);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const {
      concepto,
      categoria,
      monto,
      metodoPago,
      cuentaBancariaId,
      bodegaId,
      comprobante,
      fecha,
      nota,
    } = parsed.data;

    const fechaGasto = fecha ? new Date(fecha) : new Date();

    const gastoCreado = await db.$transaction(async (tx) => {
      // 1. Si es con banco o transferencia, debitar la cuenta bancaria
      if ((metodoPago === "TRANSFERENCIA" || metodoPago === "TARJETA") && cuentaBancariaId) {
        const cuenta = await tx.cuentaBancaria.findUnique({
          where: { id: cuentaBancariaId },
        });

        if (!cuenta) throw new Error("Cuenta bancaria no encontrada");
        if (cuenta.saldoActual < monto) {
          throw new Error(
            `Saldo insuficiente en ${cuenta.nombre}. Saldo actual: $${cuenta.saldoActual.toLocaleString("es-CO")}`
          );
        }

        const nuevoSaldo = cuenta.saldoActual - monto;
        await tx.cuentaBancaria.update({
          where: { id: cuentaBancariaId },
          data: { saldoActual: nuevoSaldo },
        });

        await tx.movimientoBancario.create({
          data: {
            cuentaBancariaId,
            tipo: "EGRESO",
            monto,
            saldoResultante: nuevoSaldo,
            concepto: `Gasto: ${concepto} (${categoria})`,
            referencia: comprobante || "GASTO",
            categoria: "GASTO",
            fecha: fechaGasto,
          },
        });
      }

      // 2. Si es en efectivo y hay caja abierta en la bodega, registrar retiro de caja
      if (metodoPago === "EFECTIVO" && bodegaId) {
        const sesionAbierta = await tx.sesionCaja.findFirst({
          where: { bodegaId, estado: "ABIERTA" },
          orderBy: { openedAt: "desc" },
        });

        if (sesionAbierta) {
          await tx.movimientoCaja.create({
            data: {
              sesionId: sesionAbierta.id,
              tipo: "RETIRO",
              monto,
              referencia: `Gasto operativo: ${concepto} (${categoria})`,
            },
          });
        }
      }

      // 3. Crear registro de gasto
      const gasto = await tx.gasto.create({
        data: {
          concepto,
          categoria,
          monto,
          metodoPago,
          cuentaBancariaId: cuentaBancariaId || null,
          comprobante: comprobante || null,
          fecha: fechaGasto,
          nota: nota || null,
          estado: "REGISTRADO",
        },
      });

      return gasto;
    });

    await registrarAuditoria({
      modulo: "GASTOS",
      accion: "CREACION",
      entidad: `Gasto: ${concepto}`,
      entidadId: gastoCreado.id,
      descripcion: `Registro de gasto por $${monto.toLocaleString("es-CO")} (${categoria}) - Pago: ${metodoPago}`,
    });

    revalidarGastos();
    return { ok: true, data: { id: gastoCreado.id } };
  } catch (e) {
    console.error("Error al registrar gasto:", e);
    return { ok: false, error: errorDesconocido(e) };
  }
}

export async function anularGasto(gastoId: number): Promise<ActionResult> {
  try {
    const gasto = await db.gasto.findUnique({
      where: { id: gastoId },
      include: { cuentaBancaria: true },
    });

    if (!gasto) return { ok: false, error: "Gasto no encontrado" };
    if (gasto.estado === "ANULADO") return { ok: false, error: "El gasto ya se encuentra anulado" };

    await db.$transaction(async (tx) => {
      // Revertir si fue banco
      if (gasto.cuentaBancariaId && (gasto.metodoPago === "TRANSFERENCIA" || gasto.metodoPago === "TARJETA")) {
        const cuenta = await tx.cuentaBancaria.findUnique({
          where: { id: gasto.cuentaBancariaId },
        });

        if (cuenta) {
          const nuevoSaldo = cuenta.saldoActual + gasto.monto;
          await tx.cuentaBancaria.update({
            where: { id: gasto.cuentaBancariaId },
            data: { saldoActual: nuevoSaldo },
          });

          await tx.movimientoBancario.create({
            data: {
              cuentaBancariaId: gasto.cuentaBancariaId,
              tipo: "INGRESO",
              monto: gasto.monto,
              saldoResultante: nuevoSaldo,
              concepto: `Reversión por anulación de gasto #${gasto.id}: ${gasto.concepto}`,
              referencia: `REV-GST-${gasto.id}`,
              categoria: "AJUSTE",
            },
          });
        }
      }

      await tx.gasto.update({
        where: { id: gastoId },
        data: { estado: "ANULADO" },
      });
    });

    await registrarAuditoria({
      modulo: "GASTOS",
      accion: "ANULACION",
      entidad: `Gasto #${gastoId}`,
      entidadId: gastoId,
      descripcion: `Anulación de gasto por $${gasto.monto.toLocaleString("es-CO")} (${gasto.concepto})`,
    });

    revalidarGastos();
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("Error al anular gasto:", e);
    return { ok: false, error: errorDesconocido(e) };
  }
}
