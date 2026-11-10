// ───────────────────────── PEDIDOS ONLINE: NÚCLEO COMPARTIDO ─────────────────────────
// Creación de pedidos usada tanto por la server action de WhatsApp (registrar
// Pedido, spec 001) como por las rutas de pasarela (Wompi/Bold, spec 002).
// Regla v1 (001): el pedido NO descuenta stock ni genera Venta; el cobro ocurre
// en POS al entregar. El estado de pago vive en PagoOnline (spec 002).

import { db } from "@/lib/db";
import type { pedidoOnlineSchema } from "@/lib/validations";
import type { z } from "zod";

type DatosPedido = z.infer<typeof pedidoOnlineSchema>;

export interface PedidoCreado {
  id: number;
  referencia: string;
  total: number;
}

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

interface ItemData {
  varianteId: number;
  referencia: string;
  nombre: string;
  tallaValor: string;
  colorNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/**
 * Valida disponibilidad de variantes, calcula totales y crea el pedido con sus
 * items en una transacción. Devuelve error legible si la bolsa quedó obsoleta.
 */
export async function crearPedidoConItems(
  data: DatosPedido
): Promise<{ ok: true; pedido: PedidoCreado; items: ItemData[] } | { ok: false; error: string }> {
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

  // Referencia provisional única (la final depende del id autoincrement que
  // aún no existe; D2 de research.md de la spec 001).
  const provisional = `PED-${referenciaFecha()}-P${Date.now().toString(36)}`;

  const pedido = await db.$transaction(async (tx) => {
    const creado = await tx.pedido.create({
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
    const referencia = `PED-${referenciaFecha()}-${creado.id}`;
    await tx.pedido.update({ where: { id: creado.id }, data: { referencia } });
    return { id: creado.id, referencia, total };
  });

  return { ok: true, pedido, items: itemsData };
}
