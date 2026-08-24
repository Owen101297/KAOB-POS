"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  desembolsoPlataformaSchema,
  errorDesconocido,
  type ActionResult,
} from "@/lib/validations";
import { registrarAuditoria } from "@/lib/actions/auditoria";

const PLATAFORMAS_PATHS = [
  "/bancos",
  "/bancos/plataformas",
  "/bancos/movimientos",
  "/bancos/conciliaciones",
  "/gastos",
  "/informes",
  "/ventas",
];

function revalidarPlataformas() {
  PLATAFORMAS_PATHS.forEach((p) => revalidatePath(p));
}

// ───────────────────────── CONSULTAS DE PLATAFORMAS ─────────────────────────

export async function obtenerResumenPlataformas() {
  try {
    // 1. Pagos pendientes de desembolso por plataforma
    const pagosPendientes = await db.pagoVenta.findMany({
      where: {
        metodo: { in: ["ADDI", "SISTECREDITO"] },
        desembolsado: false,
        venta: { estado: { not: "ANULADA" } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        venta: {
          select: {
            id: true,
            consecutivo: true,
            tipo: true,
            createdAt: true,
            cliente: {
              select: {
                id: true,
                nombre: true,
                documento: true,
                telefono: true,
              },
            },
          },
        },
      },
    });

    const saldoAddi = pagosPendientes
      .filter((p) => p.metodo === "ADDI")
      .reduce((a, p) => a + p.monto, 0);

    const saldoSistecredito = pagosPendientes
      .filter((p) => p.metodo === "SISTECREDITO")
      .reduce((a, p) => a + p.monto, 0);

    const totalEnTransito = saldoAddi + saldoSistecredito;

    // 2. Historial de desembolsos liquidados
    const desembolsos = await db.desembolsoPlataforma.findMany({
      orderBy: { fecha: "desc" },
      take: 50,
      include: {
        cuentaBancaria: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            numeroCuenta: true,
          },
        },
        pagos: {
          select: {
            id: true,
            monto: true,
            referencia: true,
            venta: {
              select: {
                consecutivo: true,
                tipo: true,
                cliente: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });

    return {
      saldoAddi,
      saldoSistecredito,
      totalEnTransito,
      conteoAddi: pagosPendientes.filter((p) => p.metodo === "ADDI").length,
      conteoSistecredito: pagosPendientes.filter((p) => p.metodo === "SISTECREDITO").length,
      pagosPendientes,
      desembolsos,
    };
  } catch (error) {
    console.error("Error al obtener resumen de plataformas:", error);
    return {
      saldoAddi: 0,
      saldoSistecredito: 0,
      totalEnTransito: 0,
      conteoAddi: 0,
      conteoSistecredito: 0,
      pagosPendientes: [],
      desembolsos: [],
    };
  }
}

export type ResumenPlataformas = Awaited<ReturnType<typeof obtenerResumenPlataformas>>;

// ───────────────────────── REGISTRAR DESEMBOLSO ─────────────────────────

export async function registrarDesembolsoPlataforma(input: unknown): Promise<ActionResult<{ id: number; consecutivo: number }>> {
  try {
    const data = desembolsoPlataformaSchema.parse(input);

    // Validar cuenta bancaria
    const cuenta = await db.cuentaBancaria.findUnique({
      where: { id: data.cuentaBancariaId },
    });
    if (!cuenta) {
      return { ok: false, error: "La cuenta bancaria seleccionada no existe." };
    }

    // Validar pagos
    const pagos = await db.pagoVenta.findMany({
      where: {
        id: { in: data.pagosIds },
        desembolsado: false,
      },
    });

    if (pagos.length === 0) {
      return { ok: false, error: "No se encontraron ventas válidas pendientes de desembolso para liquidar." };
    }

    const montoBrutoReal = pagos.reduce((a, p) => a + p.monto, 0);

    const resultado = await db.$transaction(async (tx) => {
      // 1. Obtener consecutivo
      const ultimo = await tx.desembolsoPlataforma.findFirst({
        orderBy: { consecutivo: "desc" },
        select: { consecutivo: true },
      });
      const consecutivo = (ultimo?.consecutivo ?? 0) + 1;

      // 2. Crear Desembolso
      const desembolso = await tx.desembolsoPlataforma.create({
        data: {
          consecutivo,
          plataforma: data.plataforma,
          fecha: data.fecha || new Date(),
          montoBruto: montoBrutoReal,
          comision: data.comision,
          retenciones: data.retenciones,
          montoNeto: data.montoNeto,
          cuentaBancariaId: data.cuentaBancariaId,
          referenciaBancaria: data.referenciaBancaria || null,
          estado: "LIQUIDADO",
          nota: data.nota || null,
        },
      });

      // 3. Marcar pagos como liquidados y asociar al desembolso
      await tx.pagoVenta.updateMany({
        where: { id: { in: data.pagosIds } },
        data: {
          desembolsado: true,
          desembolsoId: desembolso.id,
        },
      });

      // 4. Ingresar dinero neto a la cuenta bancaria
      const nuevoSaldo = cuenta.saldoActual + data.montoNeto;
      await tx.cuentaBancaria.update({
        where: { id: cuenta.id },
        data: { saldoActual: nuevoSaldo },
      });

      await tx.movimientoBancario.create({
        data: {
          cuentaBancariaId: cuenta.id,
          tipo: "INGRESO",
          monto: data.montoNeto,
          saldoResultante: nuevoSaldo,
          fecha: data.fecha || new Date(),
          concepto: `Desembolso ${data.plataforma} #${consecutivo} (${pagos.length} ventas)`,
          referencia: data.referenciaBancaria || `DES-${data.plataforma}-${consecutivo}`,
          categoria: "VENTA",
          conciliado: true,
        },
      });

      // 5. Si hubo comisión retenida, registrar en Gastos Operativos
      if (data.comision > 0) {
        await tx.gasto.create({
          data: {
            concepto: `Comisión Pasarela ${data.plataforma} (Desembolso #${consecutivo})`,
            categoria: "Comisiones y Pasarelas",
            monto: data.comision,
            fecha: data.fecha || new Date(),
            cuentaBancariaId: cuenta.id,
            comprobante: data.referenciaBancaria || null,
            nota: `Descontado automáticamente en liquidación de ${pagos.length} ventas`,
          },
        });
      }

      return { id: desembolso.id, consecutivo };
    });

    await registrarAuditoria({
      modulo: "BANCOS",
      accion: "CREAR",
      entidad: `Desembolso ${data.plataforma} #${resultado.consecutivo}`,
      entidadId: String(resultado.id),
      descripcion: `Liquidado lote de ${data.pagosIds.length} ventas por $${data.montoNeto.toLocaleString("es-CO")} en ${cuenta.nombre}`,
    });

    revalidarPlataformas();
    return { ok: true, data: resultado };
  } catch (e) {
    return { ok: false, error: errorDesconocido(e) };
  }
}

// ───────────────────────── ANULAR DESEMBOLSO ─────────────────────────

export async function anularDesembolsoPlataforma(id: number, motivo: string): Promise<ActionResult<{ id: number }>> {
  try {
    const desembolso = await db.desembolsoPlataforma.findUnique({
      where: { id },
      include: { cuentaBancaria: true, pagos: true },
    });

    if (!desembolso) {
      return { ok: false, error: "El desembolso no existe." };
    }

    if (desembolso.estado === "ANULADO") {
      return { ok: false, error: "El desembolso ya se encuentra anulado." };
    }

    await db.$transaction(async (tx) => {
      // 1. Marcar desembolso como anulado
      await tx.desembolsoPlataforma.update({
        where: { id },
        data: {
          estado: "ANULADO",
          nota: `${desembolso.nota ? desembolso.nota + " | " : ""}Anulado: ${motivo}`,
        },
      });

      // 2. Liberar pagos para que vuelvan a estar pendientes
      await tx.pagoVenta.updateMany({
        where: { desembolsoId: id },
        data: {
          desembolsado: false,
          desembolsoId: null,
        },
      });

      // 3. Reversar saldo en cuenta bancaria si existía
      if (desembolso.cuentaBancariaId && desembolso.cuentaBancaria) {
        const nuevoSaldo = Math.max(0, desembolso.cuentaBancaria.saldoActual - desembolso.montoNeto);
        await tx.cuentaBancaria.update({
          where: { id: desembolso.cuentaBancariaId },
          data: { saldoActual: nuevoSaldo },
        });

        await tx.movimientoBancario.create({
          data: {
            cuentaBancariaId: desembolso.cuentaBancariaId,
            tipo: "EGRESO",
            monto: desembolso.montoNeto,
            saldoResultante: nuevoSaldo,
            fecha: new Date(),
            concepto: `Anulación Desembolso ${desembolso.plataforma} #${desembolso.consecutivo}`,
            referencia: `REV-${desembolso.consecutivo}`,
            categoria: "AJUSTE",
            conciliado: true,
          },
        });
      }
    });

    await registrarAuditoria({
      modulo: "BANCOS",
      accion: "ANULAR",
      entidad: `Desembolso ${desembolso.plataforma} #${desembolso.consecutivo}`,
      entidadId: String(id),
      descripcion: `Anulado por: ${motivo}`,
    });

    revalidarPlataformas();
    return { ok: true, data: { id } };
  } catch (e) {
    return { ok: false, error: errorDesconocido(e) };
  }
}
