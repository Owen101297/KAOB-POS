"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  errorDesconocido,
  registrarAbonoCreditoSchema,
  type ActionResult,
} from "@/lib/validations";

const CREDITO_PATHS = ["/creditos", "/clientes", "/caja/ingreso", "/ventas"];

function revalidarCreditos() {
  CREDITO_PATHS.forEach((path) => revalidatePath(path));
}

// ─────────────────────────── CONSULTAS ──────────────────────────

export async function listarCreditos(opts?: {
  clienteId?: number;
  estado?: string;
  soloVencidos?: boolean;
  take?: number;
}) {
  const now = new Date();
  return db.creditoCliente.findMany({
    where: {
      ...(opts?.clienteId ? { clienteId: opts.clienteId } : {}),
      ...(opts?.estado && opts.estado !== "TODOS"
        ? { estado: opts.estado }
        : {}),
      ...(opts?.soloVencidos
        ? { estado: "PENDIENTE", fechaVencimiento: { lt: now } }
        : {}),
    },
    orderBy: [{ estado: "asc" }, { fechaVencimiento: "asc" }],
    take: opts?.take ?? 200,
    include: {
      cliente: true,
      venta: { select: { id: true, consecutivo: true, total: true, createdAt: true } },
      abonos: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type CreditoLista = Awaited<ReturnType<typeof listarCreditos>>[number];

export async function obtenerResumenCartera() {
  const now = new Date();
  const creditosPendientes = await db.creditoCliente.findMany({
    where: { estado: "PENDIENTE" },
    select: {
      id: true,
      clienteId: true,
      saldoPendiente: true,
      fechaVencimiento: true,
    },
  });

  const totalCartera = creditosPendientes.reduce((a, c) => a + c.saldoPendiente, 0);

  const morosos = creditosPendientes.filter((c) => new Date(c.fechaVencimiento) < now);
  const totalMoroso = morosos.reduce((a, c) => a + c.saldoPendiente, 0);

  const clientesEnMoraSet = new Set(morosos.map((c) => c.clienteId));

  return {
    totalCartera,
    totalMoroso,
    clientesEnMora: clientesEnMoraSet.size,
    creditosActivos: creditosPendientes.length,
  };
}

export async function obtenerEstadoCuentaCliente(clienteId: number) {
  const cliente = await db.cliente.findUnique({
    where: { id: clienteId },
  });
  if (!cliente) return null;

  const creditos = await db.creditoCliente.findMany({
    where: { clienteId },
    orderBy: { createdAt: "desc" },
    include: {
      venta: { select: { consecutivo: true, createdAt: true } },
      abonos: { orderBy: { createdAt: "desc" } },
    },
  });

  const saldoPendienteTotal = creditos
    .filter((c) => c.estado === "PENDIENTE")
    .reduce((a, c) => a + c.saldoPendiente, 0);

  const cupoDisponible = Math.max(0, cliente.cupoCredito - saldoPendienteTotal);

  return {
    cliente,
    saldoPendienteTotal,
    cupoDisponible,
    creditos,
  };
}

export async function obtenerConsecutivoCredito(): Promise<number> {
  const ultimo = await db.creditoCliente.findFirst({
    orderBy: { consecutivo: "desc" },
    select: { consecutivo: true },
  });
  return (ultimo?.consecutivo ?? 0) + 1;
}

// ─────────────────────────── REGISTRAR ABONO ──────────────────────────

export async function registrarAbono(
  input: unknown
): Promise<ActionResult<{ id: number; nuevoSaldo: number }>> {
  try {
    const data = registrarAbonoCreditoSchema.parse(input);

    const credito = await db.creditoCliente.findUnique({
      where: { id: data.creditoId },
      include: { cliente: true },
    });

    if (!credito) return { ok: false, error: "El crédito no existe." };
    if (credito.estado === "PAGADO")
      return { ok: false, error: "Este crédito ya se encuentra pagado en su totalidad." };
    if (data.monto > credito.saldoPendiente) {
      return {
        ok: false,
        error: `El monto del abono (${data.monto}) no puede exceder el saldo pendiente (${credito.saldoPendiente}).`,
      };
    }

    const nuevoSaldo = credito.saldoPendiente - data.monto;
    const nuevoEstado = nuevoSaldo === 0 ? "PAGADO" : "PENDIENTE";
    const codigoCredito = `CR-${String(credito.consecutivo).padStart(4, "0")}`;

    const abono = await db.$transaction(async (tx) => {
      // Registrar abono
      const a = await tx.abonoCredito.create({
        data: {
          creditoId: data.creditoId,
          monto: data.monto,
          metodo: data.metodo as any,
          referencia: data.referencia || null,
          nota: data.nota || null,
        },
      });

      // Actualizar crédito
      await tx.creditoCliente.update({
        where: { id: data.creditoId },
        data: {
          saldoPendiente: nuevoSaldo,
          estado: nuevoEstado,
        },
      });

      // Si el pago fue en efectivo, registrar ingreso en caja abierta de la bodega
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
              referencia: `Abono cartera ${credito.cliente.nombre} (${codigoCredito})`,
            },
          });
        }
      }

      return a;
    });

    revalidarCreditos();
    return { ok: true, data: { id: abono.id, nuevoSaldo } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}
