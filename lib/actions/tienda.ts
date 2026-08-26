"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { errorDesconocido, type ActionResult } from "@/lib/validations";

// ─────────────────────────── PEDIDOS ONLINE (Checkout Tienda) ───────────────────────────

const itemPedidoSchema = z.object({
  varianteId: z.number().int().positive(),
  nombreProducto: z.string().trim().min(1),
  referencia: z.string().trim().optional(),
  tallaValor: z.string().trim().min(1),
  colorNombre: z.string().trim().min(1),
  cantidad: z.number().int().positive(),
  precioUnitario: z.number().int().nonnegative(),
  subtotal: z.number().int().nonnegative(),
});

const crearPedidoOnlineSchema = z.object({
  clienteNombre: z.string().trim().min(2).max(120),
  clienteTelefono: z.string().trim().min(6).max(20),
  ciudad: z.string().trim().min(2).max(80),
  direccion: z.string().trim().min(3).max(200),
  notas: z.string().trim().max(300).optional().or(z.literal("")),
  metodoFinanciacion: z.enum(["CONTADO", "PLAN_SEPARE", "ADDI", "SISTECREDITO"]).default("CONTADO"),
  subtotal: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  items: z.array(itemPedidoSchema).min(1),
});

async function obtenerConsecutivoPedidoOnline(): Promise<number> {
  const ultimo = await db.pedidoOnline.findFirst({
    orderBy: { consecutivo: "desc" },
    select: { consecutivo: true },
  });
  return (ultimo?.consecutivo ?? 0) + 1;
}

/** Registra el pedido tomado desde la vitrina web antes de abrir WhatsApp, para que quede visible en /ventas-online */
export async function crearPedidoOnline(
  input: unknown
): Promise<ActionResult<{ id: number; consecutivo: number; codigo: string }>> {
  try {
    const data = crearPedidoOnlineSchema.parse(input);
    const consecutivo = await obtenerConsecutivoPedidoOnline();

    const pedido = await db.pedidoOnline.create({
      data: {
        consecutivo,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono,
        ciudad: data.ciudad,
        direccion: data.direccion,
        notas: data.notas || null,
        metodoFinanciacion: data.metodoFinanciacion,
        subtotal: data.subtotal,
        total: data.total,
        items: {
          create: data.items.map((it) => ({
            varianteId: it.varianteId,
            nombreProducto: it.nombreProducto,
            referencia: it.referencia || null,
            tallaValor: it.tallaValor,
            colorNombre: it.colorNombre,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            subtotal: it.subtotal,
          })),
        },
      },
    });

    revalidatePath("/ventas-online");
    return {
      ok: true,
      data: { id: pedido.id, consecutivo, codigo: `PED-${String(consecutivo).padStart(4, "0")}` },
    };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export type PedidoOnlineLista = Awaited<ReturnType<typeof listarPedidosOnline>>[number];

export async function listarPedidosOnline() {
  return db.pedidoOnline.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });
}

const ESTADOS_PEDIDO_ONLINE = ["PENDIENTE", "EMPACADO", "DESPACHADO", "ENTREGADO", "CANCELADO"] as const;

export async function actualizarEstadoPedidoOnline(
  id: number,
  estado: (typeof ESTADOS_PEDIDO_ONLINE)[number]
): Promise<ActionResult> {
  try {
    if (!ESTADOS_PEDIDO_ONLINE.includes(estado)) {
      return { ok: false, error: "Estado inválido." };
    }
    await db.pedidoOnline.update({ where: { id }, data: { estado } });
    revalidatePath("/ventas-online");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── LEADS (Exit-Intent / Recuperación) ───────────────────────────

const registrarLeadSchema = z.object({
  nombre: z.string().trim().max(120).optional().or(z.literal("")),
  telefono: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  origen: z.enum(["EXIT_INTENT", "CARRITO_ABANDONADO", "NEWSLETTER"]),
  cuponOfrecido: z.string().trim().max(30).optional(),
  descuentoPct: z.number().int().min(0).max(100).optional(),
  carritoResumen: z.string().trim().max(2000).optional(),
});

export async function registrarLeadTienda(input: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const data = registrarLeadSchema.parse(input);
    if (!data.telefono && !data.email) {
      return { ok: false, error: "Debes indicar al menos un teléfono o correo de contacto." };
    }
    const lead = await db.leadTienda.create({
      data: {
        nombre: data.nombre || null,
        telefono: data.telefono || null,
        email: data.email || null,
        origen: data.origen,
        cuponOfrecido: data.cuponOfrecido || null,
        descuentoPct: data.descuentoPct ?? null,
        carritoResumen: data.carritoResumen || null,
      },
    });
    revalidatePath("/ventas-online");
    return { ok: true, data: { id: lead.id } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export type LeadTiendaLista = Awaited<ReturnType<typeof listarLeadsTienda>>[number];

export async function listarLeadsTienda() {
  return db.leadTienda.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function marcarLeadContactado(id: number, contactado: boolean): Promise<ActionResult> {
  try {
    await db.leadTienda.update({ where: { id }, data: { contactado } });
    revalidatePath("/ventas-online");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── CRO: DATOS REALES PARA URGENCIA / PRUEBA SOCIAL ───────────────────────────

/** Unidades vendidas por producto (ventas completadas en POS) en los últimos N días, para el badge "vendidos" */
export async function obtenerVentasPorProducto(dias = 30): Promise<Record<number, number>> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const items = await db.ventaItem.findMany({
    where: { venta: { estado: "COMPLETADA", createdAt: { gte: desde } } },
    select: { cantidad: true, variante: { select: { productoId: true } } },
  });

  const mapa: Record<number, number> = {};
  for (const it of items) {
    const pid = it.variante.productoId;
    mapa[pid] = (mapa[pid] ?? 0) + it.cantidad;
  }
  return mapa;
}

/** Actividad reciente real (pedidos web) para el toast de prueba social — nunca inventa datos */
export async function obtenerActividadRecienteVitrina(): Promise<
  { nombre: string; producto: string; minutosAtras: number; ciudad: string }[]
> {
  const desde = new Date();
  desde.setDate(desde.getDate() - 4);

  const pedidos = await db.pedidoOnline.findMany({
    where: { createdAt: { gte: desde } },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { items: { take: 1 } },
  });

  return pedidos
    .filter((p) => p.items.length > 0)
    .map((p) => ({
      nombre: primerNombreConInicial(p.clienteNombre),
      producto: p.items[0].nombreProducto,
      minutosAtras: Math.max(1, Math.round((Date.now() - p.createdAt.getTime()) / 60000)),
      ciudad: p.ciudad,
    }));
}

function primerNombreConInicial(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/);
  const primero = partes[0] ?? "Cliente";
  const inicial = partes[1]?.[0];
  return inicial ? `${primero} ${inicial}.` : primero;
}

/** Promoción activa más próxima a vencer, para el banner de oferta con cuenta regresiva */
export async function obtenerPromocionDestacada() {
  const ahora = new Date();
  return db.promocion.findFirst({
    where: {
      activa: true,
      fechaFin: { gte: ahora },
      OR: [{ fechaInicio: null }, { fechaInicio: { lte: ahora } }],
    },
    orderBy: { fechaFin: "asc" },
  });
}
