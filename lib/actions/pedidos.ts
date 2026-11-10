"use server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  pedidoOnlineSchema,
  cambioEstadoPedidoSchema,
  cancelarPedidoSchema,
  errorDesconocido,
  type ActionResult,
} from "@/lib/validations";
import { crearPedidoConItems } from "@/lib/tienda/checkout-core";

// ───────────────────────── PEDIDOS ONLINE (TIENDA WEB → POS) ─────────────────────────
// Detalle de contrato: specs/001-ventas-online-real/contracts/pedidos.md
// v1: el pedido NO descuenta stock ni genera Venta; el cobro ocurre en POS al
// entregar (supuesto aprobado en el spec).

const PEDIDO_PATHS = ["/ventas-online"];

export async function registrarPedidoOnline(
  input: unknown
): Promise<ActionResult<{ id: number; referencia: string }>> {
  try {
    const data = pedidoOnlineSchema.parse(input);

    const core = await crearPedidoConItems(data);
    if (!core.ok) return { ok: false, error: core.error };

    for (const path of PEDIDO_PATHS) revalidatePath(path);
    return {
      ok: true,
      data: { id: core.pedido.id, referencia: core.pedido.referencia },
    };
  } catch (e) {
    return { ok: false, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── LISTAR (solo lectura) ──────────────────────────

export interface PedidoOnlineListaItem {
  id: number;
  referencia: string;
  nombre: string;
  tallaValor: string;
  colorNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoOnlineLista {
  id: number;
  referencia: string;
  nombreContacto: string;
  telefonoContacto: string;
  ciudad: string | null;
  direccion: string | null;
  notas: string | null;
  total: number;
  estado: string;
  estadoPor: string | null;
  estadoEn: string | null; // ISO — serializable hacia el cliente
  createdAt: string; // ISO
  pago: { proveedor: string; estado: string } | null;
  items: PedidoOnlineListaItem[];
}

export async function listarPedidosOnline(
  estado?: string
): Promise<PedidoOnlineLista[]> {
  await requireAuth();
  const pedidos = await db.pedido.findMany({
    where: estado && estado !== "TODOS" ? { estado: estado as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          referencia: true,
          nombre: true,
          tallaValor: true,
          colorNombre: true,
          cantidad: true,
          precioUnitario: true,
          subtotal: true,
        },
      },
      pago: {
        select: { proveedor: true, estado: true },
      },
    },
  });

  // Fechas serializadas explícitas (ISO) para pasar limpio la frontera RSC.
  return pedidos.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    estadoEn: p.estadoEn ? p.estadoEn.toISOString() : null,
  }));
}

// ─────────────────────────── CAMBIOS DE ESTADO ──────────────────────────

const TRANSICIONES_VALIDAS: Record<string, string> = {
  PENDIENTE: "EMPACADO",
  EMPACADO: "EN_CAMINO",
  EN_CAMINO: "ENTREGADO",
};

export async function actualizarEstadoPedido(
  input: unknown
): Promise<ActionResult<{ estado: string }>> {
  try {
    await requireAuth();
    const { id, nuevoEstado } = cambioEstadoPedidoSchema.parse(input);

    const pedido = await db.pedido.findUnique({ where: { id }, select: { estado: true } });
    if (!pedido) return { ok: false, error: "El pedido no existe." };

    // Control de concurrencia por estado previo + ciclo válido (FR-004).
    if (TRANSICIONES_VALIDAS[pedido.estado] !== nuevoEstado) {
      return {
        ok: false,
        error: `No se puede pasar de ${pedido.estado} a ${nuevoEstado}. El ciclo es Pendiente → Empacado → En camino → Entregado.`,
      };
    }

    await db.pedido.update({
      where: { id },
      data: { estado: nuevoEstado as never, estadoPor: "Administrador", estadoEn: new Date() },
    });

    for (const path of PEDIDO_PATHS) revalidatePath(path);
    return { ok: true, data: { estado: nuevoEstado } };
  } catch (e) {
    return { ok: false, error: errorDesconocido(e) };
  }
}

export async function cancelarPedidoOnline(
  input: unknown
): Promise<ActionResult<{ estado: string }>> {
  try {
    await requireAuth();
    const { id } = cancelarPedidoSchema.parse(input);

    const pedido = await db.pedido.findUnique({ where: { id }, select: { estado: true } });
    if (!pedido) return { ok: false, error: "El pedido no existe." };

    if (pedido.estado === "ENTREGADO" || pedido.estado === "CANCELADO") {
      return {
        ok: false,
        error: `El pedido ya está ${pedido.estado === "ENTREGADO" ? "entregado" : "cancelado"}; no admite más cambios.`,
      };
    }

    await db.pedido.update({
      where: { id },
      data: { estado: "CANCELADO", estadoPor: "Administrador", estadoEn: new Date() },
    });

    for (const path of PEDIDO_PATHS) revalidatePath(path);
    return { ok: true, data: { estado: "CANCELADO" } };
  } catch (e) {
    return { ok: false, error: errorDesconocido(e) };
  }
}
