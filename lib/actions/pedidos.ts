"use server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  pedidoOnlineSchema,
  cambioEstadoPedidoSchema,
  cancelarPedidoSchema,
  errorDesconocido,
  type ActionResult,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";

// ───────────────────────── PEDIDOS ONLINE (TIENDA WEB → POS) ─────────────────────────
// Detalle de contrato: specs/001-ventas-online-real/contracts/pedidos.md
// v1: el pedido NO descuenta stock ni genera Venta; el cobro ocurre en POS al
// entregar (supuesto aprobado en el spec).

const PEDIDO_PATHS = ["/ventas-online"];

function referenciaFecha(): string {
  // Fecha de Bogotá (zona horaria del negocio) en formato YYYYMMDD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/-/g, "");
}

export async function registrarPedidoOnline(
  input: unknown
): Promise<ActionResult<{ id: number; referencia: string }>> {
  try {
    const data = pedidoOnlineSchema.parse(input);

    // Consolidar cantidades por variante (la bolsa es única por variante, pero
    // evitamos duplicados por robustez).
    const cantidades = new Map<number, number>();
    for (const item of data.items) {
      cantidades.set(item.varianteId, (cantidades.get(item.varianteId) ?? 0) + item.cantidad);
    }

    const variantes = await db.variante.findMany({
      where: {
        id: { in: [...cantidades.keys()] },
        activa: true,
        producto: { activo: true },
      },
      select: {
        id: true,
        precioOverride: true,
        producto: { select: { referencia: true, nombre: true, precioBase: true } },
        talla: { select: { valor: true } },
        color: { select: { nombre: true } },
      },
    });

    if (variantes.length !== cantidades.size) {
      return {
        ok: false,
        error: "Una o más prendas de tu bolsa ya no están disponibles. Actualiza la página e intenta de nuevo.",
      };
    }

    type ItemData = {
      varianteId: number;
      referencia: string;
      nombre: string;
      tallaValor: string;
      colorNombre: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    };

    const itemsData: ItemData[] = [];
    let total = 0;
    for (const v of variantes) {
      const cantidad = cantidades.get(v.id)!;
      const precioUnitario = v.precioOverride ?? v.producto.precioBase;
      const subtotal = precioUnitario * cantidad;
      total += subtotal;
      itemsData.push({
        varianteId: v.id,
        referencia: v.producto.referencia,
        nombre: v.producto.nombre,
        tallaValor: v.talla.valor,
        colorNombre: v.color.nombre,
        cantidad,
        precioUnitario,
        subtotal,
      });
    }

    const resultado = await db.$transaction(async (tx) => {
      // Referencia provisional única (la final depende del id autoincrement
      // que aún no existe; D2 de research.md).
      const provisional = `PED-${referenciaFecha()}-P${Date.now().toString(36)}`;

      const pedido = await tx.pedido.create({
        data: {
          referencia: provisional,
          nombreContacto: data.nombre,
          telefonoContacto: data.celular,
          ciudad: data.ciudad || null,
          direccion: data.direccion || null,
          notas: data.notas || null,
          total,
          items: { create: itemsData },
        },
      });

      // Referencia definitiva: PED-<YYYYMMDD>-<id> — única por construcción.
      const referencia = `PED-${referenciaFecha()}-${pedido.id}`;
      await tx.pedido.update({ where: { id: pedido.id }, data: { referencia } });
      return { id: pedido.id, referencia };
    });

    for (const path of PEDIDO_PATHS) revalidatePath(path);
    return { ok: true, data: resultado };
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
