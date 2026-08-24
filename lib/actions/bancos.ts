"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  cuentaBancariaSchema,
  movimientoBancarioSchema,
  transferenciaBancariaSchema,
  conciliacionBancariaSchema,
  errorDesconocido,
  type ActionResult,
} from "@/lib/validations";
import { registrarAuditoria } from "@/lib/actions/auditoria";

const BANCOS_PATHS = ["/bancos", "/bancos/movimientos", "/bancos/conciliaciones", "/gastos", "/informes"];

function revalidarBancos() {
  BANCOS_PATHS.forEach((p) => revalidatePath(p));
}

// ───────────────────────── CUENTAS BANCARIAS ─────────────────────────

export async function listarCuentasBancarias(opts?: { soloActivas?: boolean }) {
  try {
    return await db.cuentaBancaria.findMany({
      where: {
        ...(opts?.soloActivas ? { activa: true } : {}),
      },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            movimientos: true,
            conciliaciones: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error al listar cuentas bancarias:", error);
    return [];
  }
}

export type CuentaBancariaItem = Awaited<ReturnType<typeof listarCuentasBancarias>>[number];

export async function guardarCuentaBancaria(formData: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const parsed = cuentaBancariaSchema.safeParse(formData);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const { id, nombre, tipo, numeroCuenta, titular, saldoInicial, color, activa } = parsed.data;

    let cuentaId: number;

    if (id) {
      const actualizada = await db.cuentaBancaria.update({
        where: { id },
        data: {
          nombre,
          tipo,
          numeroCuenta: numeroCuenta || null,
          titular: titular || null,
          color: color || "#2563eb",
          activa: activa ?? true,
        },
      });
      cuentaId = actualizada.id;

      await registrarAuditoria({
        modulo: "BANCOS",
        accion: "MODIFICACION",
        entidad: `Cuenta Bancaria: ${nombre}`,
        entidadId: id,
        descripcion: `Edición de datos de la cuenta ${nombre}`,
      });
    } else {
      const creada = await db.cuentaBancaria.create({
        data: {
          nombre,
          tipo,
          numeroCuenta: numeroCuenta || null,
          titular: titular || null,
          saldoActual: saldoInicial,
          color: color || "#2563eb",
          activa: activa ?? true,
        },
      });
      cuentaId = creada.id;

      if (saldoInicial > 0) {
        await db.movimientoBancario.create({
          data: {
            cuentaBancariaId: creada.id,
            tipo: "INGRESO",
            monto: saldoInicial,
            saldoResultante: saldoInicial,
            concepto: "Saldo Inicial de Apertura",
            categoria: "AJUSTE",
            referencia: "SALDO-INI",
          },
        });
      }

      await registrarAuditoria({
        modulo: "BANCOS",
        accion: "CREACION",
        entidad: `Cuenta Bancaria: ${nombre}`,
        entidadId: creada.id,
        descripcion: `Creación de cuenta bancaria ${nombre} con saldo inicial de $${saldoInicial.toLocaleString("es-CO")}`,
      });
    }

    revalidarBancos();
    return { ok: true, data: { id: cuentaId } };
  } catch (e) {
    console.error("Error al guardar cuenta bancaria:", e);
    return { ok: false, error: errorDesconocido(e) };
  }
}

// ───────────────────────── MOVIMIENTOS BANCARIOS ─────────────────────────

export async function registrarMovimientoBancario(formData: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const parsed = movimientoBancarioSchema.safeParse(formData);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const { cuentaBancariaId, tipo, monto, concepto, referencia, categoria } = parsed.data;

    const res = await db.$transaction(async (tx) => {
      const cuenta = await tx.cuentaBancaria.findUnique({
        where: { id: cuentaBancariaId },
      });

      if (!cuenta) throw new Error("Cuenta bancaria no encontrada");

      const esIngreso = tipo === "INGRESO";
      if (!esIngreso && cuenta.saldoActual < monto) {
        throw new Error(`Saldo insuficiente en ${cuenta.nombre}. Saldo actual: $${cuenta.saldoActual.toLocaleString("es-CO")}`);
      }

      const nuevoSaldo = esIngreso ? cuenta.saldoActual + monto : cuenta.saldoActual - monto;

      await tx.cuentaBancaria.update({
        where: { id: cuentaBancariaId },
        data: { saldoActual: nuevoSaldo },
      });

      const mov = await tx.movimientoBancario.create({
        data: {
          cuentaBancariaId,
          tipo,
          monto,
          saldoResultante: nuevoSaldo,
          concepto,
          referencia: referencia || null,
          categoria,
        },
      });

      return { id: mov.id, cuentaNombre: cuenta.nombre };
    });

    await registrarAuditoria({
      modulo: "BANCOS",
      accion: "MOVIMIENTO",
      entidad: `Movimiento: ${res.cuentaNombre}`,
      entidadId: res.id,
      descripcion: `${parsed.data.tipo} de $${monto.toLocaleString("es-CO")} en ${res.cuentaNombre} - ${concepto}`,
    });

    revalidarBancos();
    return { ok: true, data: { id: res.id } };
  } catch (e) {
    console.error("Error al registrar movimiento bancario:", e);
    return { ok: false, error: errorDesconocido(e) };
  }
}

export async function transferirEntreCuentas(formData: unknown): Promise<ActionResult> {
  try {
    const parsed = transferenciaBancariaSchema.safeParse(formData);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const { cuentaOrigenId, cuentaDestinoId, monto, referencia, nota } = parsed.data;

    if (cuentaOrigenId === cuentaDestinoId) {
      return { ok: false, error: "La cuenta de origen y destino deben ser diferentes." };
    }

    await db.$transaction(async (tx) => {
      const [origen, destino] = await Promise.all([
        tx.cuentaBancaria.findUnique({ where: { id: cuentaOrigenId } }),
        tx.cuentaBancaria.findUnique({ where: { id: cuentaDestinoId } }),
      ]);

      if (!origen) throw new Error("Cuenta de origen no encontrada");
      if (!destino) throw new Error("Cuenta de destino no encontrada");

      if (origen.saldoActual < monto) {
        throw new Error(`Saldo insuficiente en ${origen.nombre}. Disponible: $${origen.saldoActual.toLocaleString("es-CO")}`);
      }

      const nuevoSaldoOrigen = origen.saldoActual - monto;
      const nuevoSaldoDestino = destino.saldoActual + monto;

      await tx.cuentaBancaria.update({
        where: { id: cuentaOrigenId },
        data: { saldoActual: nuevoSaldoOrigen },
      });

      await tx.cuentaBancaria.update({
        where: { id: cuentaDestinoId },
        data: { saldoActual: nuevoSaldoDestino },
      });

      const refStr = referencia || `TRF-${Date.now().toString().slice(-6)}`;

      // Egreso origen
      await tx.movimientoBancario.create({
        data: {
          cuentaBancariaId: cuentaOrigenId,
          tipo: "TRANSFERENCIA_SALIDA",
          monto,
          saldoResultante: nuevoSaldoOrigen,
          concepto: `Transferencia enviada a ${destino.nombre}${nota ? ` (${nota})` : ""}`,
          referencia: refStr,
          categoria: "TRASLADO",
        },
      });

      // Ingreso destino
      await tx.movimientoBancario.create({
        data: {
          cuentaBancariaId: cuentaDestinoId,
          tipo: "TRANSFERENCIA_ENTRADA",
          monto,
          saldoResultante: nuevoSaldoDestino,
          concepto: `Transferencia recibida de ${origen.nombre}${nota ? ` (${nota})` : ""}`,
          referencia: refStr,
          categoria: "TRASLADO",
        },
      });
    });

    await registrarAuditoria({
      modulo: "BANCOS",
      accion: "TRANSFERENCIA",
      entidad: `Transferencia Interbancaria`,
      descripcion: `Transferencia de $${monto.toLocaleString("es-CO")} entre cuentas`,
    });

    revalidarBancos();
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("Error en transferencia entre cuentas:", e);
    return { ok: false, error: errorDesconocido(e) };
  }
}

export interface FiltrosMovimientosBancarios {
  cuentaBancariaId?: number;
  tipo?: string;
  categoria?: string;
  fechaInicio?: string;
  fechaFin?: string;
  conciliado?: boolean;
  take?: number;
}

export async function listarMovimientosBancarios(filtros?: FiltrosMovimientosBancarios) {
  try {
    const where: Record<string, unknown> = {};

    if (filtros?.cuentaBancariaId) {
      where.cuentaBancariaId = filtros.cuentaBancariaId;
    }

    if (filtros?.tipo && filtros.tipo !== "TODOS") {
      where.tipo = filtros.tipo;
    }

    if (filtros?.categoria && filtros.categoria !== "TODAS") {
      where.categoria = filtros.categoria;
    }

    if (filtros?.conciliado !== undefined) {
      where.conciliado = filtros.conciliado;
    }

    if (filtros?.fechaInicio || filtros?.fechaFin) {
      where.fecha = {
        ...(filtros.fechaInicio ? { gte: new Date(filtros.fechaInicio) } : {}),
        ...(filtros.fechaFin ? { lte: new Date(filtros.fechaFin + "T23:59:59.999Z") } : {}),
      };
    }

    return await db.movimientoBancario.findMany({
      where,
      orderBy: { fecha: "desc" },
      take: filtros?.take ?? 150,
      include: {
        cuentaBancaria: true,
      },
    });
  } catch (error) {
    console.error("Error al listar movimientos bancarios:", error);
    return [];
  }
}

export type MovimientoBancarioItem = Awaited<ReturnType<typeof listarMovimientosBancarios>>[number];

// ───────────────────────── CONCILIACIONES BANCARIAS ─────────────────────────

export async function listarConciliaciones(cuentaBancariaId?: number) {
  try {
    return await db.conciliacionBancaria.findMany({
      where: {
        ...(cuentaBancariaId ? { cuentaBancariaId } : {}),
      },
      orderBy: { fechaCorte: "desc" },
      include: {
        cuentaBancaria: true,
        _count: { select: { movimientos: true } },
      },
    });
  } catch (error) {
    console.error("Error al listar conciliaciones:", error);
    return [];
  }
}

export type ConciliacionItem = Awaited<ReturnType<typeof listarConciliaciones>>[number];

export async function crearConciliacion(formData: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const parsed = conciliacionBancariaSchema.safeParse(formData);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const { cuentaBancariaId, fechaCorte, saldoExtracto, movimientoIds = [], notas } = parsed.data;

    const cuenta = await db.cuentaBancaria.findUnique({
      where: { id: cuentaBancariaId },
    });

    if (!cuenta) return { ok: false, error: "Cuenta bancaria no encontrada" };

    const saldoLibros = cuenta.saldoActual;
    const diferencia = saldoLibros - saldoExtracto;
    const estado = diferencia === 0 ? "CUADRADA" : "CON_DIFERENCIA";

    const conciliacion = await db.$transaction(async (tx) => {
      const conc = await tx.conciliacionBancaria.create({
        data: {
          cuentaBancariaId,
          fechaCorte: new Date(fechaCorte),
          saldoExtracto,
          saldoLibros,
          diferencia,
          estado,
          notas: notas || null,
          cerradaEn: new Date(),
        },
      });

      if (movimientoIds.length > 0) {
        await tx.movimientoBancario.updateMany({
          where: { id: { in: movimientoIds }, cuentaBancariaId },
          data: {
            conciliado: true,
            conciliacionId: conc.id,
          },
        });
      }

      return conc;
    });

    await registrarAuditoria({
      modulo: "BANCOS",
      accion: "CONCILIACION",
      entidad: `Conciliación: ${cuenta.nombre}`,
      entidadId: conciliacion.id,
      descripcion: `Conciliación bancaria ${estado} al ${fechaCorte}. Saldo Extracto: $${saldoExtracto.toLocaleString("es-CO")} vs Saldo Libros: $${saldoLibros.toLocaleString("es-CO")} (Dif: $${diferencia.toLocaleString("es-CO")})`,
    });

    revalidarBancos();
    return { ok: true, data: { id: conciliacion.id } };
  } catch (e) {
    console.error("Error al crear conciliación bancaria:", e);
    return { ok: false, error: errorDesconocido(e) };
  }
}
