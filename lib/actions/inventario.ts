"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  ajusteStockSchema,
  errorDesconocido,
  minimoStockSchema,
  trasladoSchema,
  type ActionResult,
} from "@/lib/validations";
import { formatoTraslado } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

// ─────────────────────────── CONSULTAS ───────────────────────

export type StockFila = Prisma.StockBodegaGetPayload<{
  include: {
    bodega: true;
    variante: {
      include: {
        producto: { include: { categoria: true; marca: true } };
        color: true;
        talla: true;
      };
    };
  };
}>;

/** Filas de stock consolidadas; opcionalmente filtradas por bodega y/o solo alertas */
export async function listarStock(opciones?: {
  bodegaId?: number;
  soloAlertas?: boolean;
}): Promise<StockFila[]> {
  const where: Prisma.StockBodegaWhereInput = {};
  if (opciones?.bodegaId) where.bodegaId = opciones.bodegaId;

  const filas = await db.stockBodega.findMany({
    where,
    orderBy: [{ bodegaId: "asc" }, { varianteId: "asc" }],
    include: {
      bodega: true,
      variante: {
        include: {
          producto: { include: { categoria: true, marca: true } },
          color: true,
          talla: true,
        },
      },
    },
  });

  if (opciones?.soloAlertas) {
    return filas.filter(
      (f) => f.cantidad === 0 || (f.minimo > 0 && f.cantidad <= f.minimo)
    );
  }
  return filas;
}

export type MovimientoLista = Prisma.MovimientoInventarioGetPayload<{
  include: {
    variante: {
      include: {
        producto: true;
        color: true;
        talla: true;
      };
    };
    bodegaOrigen: true;
    bodegaDestino: true;
    traslado: true;
  };
}>;

export async function listarMovimientos(limite = 500): Promise<MovimientoLista[]> {
  return db.movimientoInventario.findMany({
    take: limite,
    orderBy: { createdAt: "desc" },
    include: {
      variante: {
        include: {
          producto: true,
          color: true,
          talla: true,
        },
      },
      bodegaOrigen: true,
      bodegaDestino: true,
      traslado: true,
    },
  });
}

export type TrasladoDetalle = Prisma.TrasladoGetPayload<{
  include: {
    bodegaOrigen: true;
    bodegaDestino: true;
    detalles: { include: { variante: { include: { producto: true; color: true; talla: true } } } };
  };
}>;

export async function listarTraslados(): Promise<TrasladoDetalle[]> {
  return db.traslado.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      bodegaOrigen: true,
      bodegaDestino: true,
      detalles: {
        include: { variante: { include: { producto: true, color: true, talla: true } } },
      },
    },
  });
}

// ─────────────────────────── AJUSTES ─────────────────────────

export async function ajustarStock(input: unknown): Promise<ActionResult> {
  try {
    const data = ajusteStockSchema.parse(input);
    await db.$transaction(async (tx) => {
      const stock = await tx.stockBodega.findUnique({
        where: { varianteId_bodegaId: { varianteId: data.varianteId, bodegaId: data.bodegaId } },
      });
      const actual = stock?.cantidad ?? 0;
      if (!stock) {
        await tx.stockBodega.create({
          data: {
            varianteId: data.varianteId,
            bodegaId: data.bodegaId,
            cantidad: data.nuevaCantidad,
          },
        });
      } else {
        await tx.stockBodega.update({
          where: { id: stock.id },
          data: { cantidad: data.nuevaCantidad },
        });
      }
      const delta = data.nuevaCantidad - actual;
      if (delta !== 0) {
        await tx.movimientoInventario.create({
          data: {
            varianteId: data.varianteId,
            tipo: delta > 0 ? "AJUSTE_ENTRADA" : "AJUSTE_SALIDA",
            cantidad: Math.abs(delta),
            bodegaDestinoId: delta > 0 ? data.bodegaId : null,
            bodegaOrigenId: delta < 0 ? data.bodegaId : null,
            nota: data.motivo,
          },
        });
      }
    });
    revalidatePath("/inventario");
    revalidatePath("/movimientos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function actualizarMinimo(input: unknown): Promise<ActionResult> {
  try {
    const data = minimoStockSchema.parse(input);
    await db.stockBodega.upsert({
      where: { varianteId_bodegaId: { varianteId: data.varianteId, bodegaId: data.bodegaId } },
      create: { varianteId: data.varianteId, bodegaId: data.bodegaId, minimo: data.minimo },
      update: { minimo: data.minimo },
    });
    revalidatePath("/inventario");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── TRASLADOS ───────────────────────

export async function crearTraslado(input: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const data = trasladoSchema.parse(input);

    // Validar duplicados dentro del payload
    const ids = new Set(data.items.map((i) => i.varianteId));
    if (ids.size !== data.items.length) {
      return { ok: false, error: "Hay artículos duplicados en la lista." };
    }

    const [origen, destino] = await Promise.all([
      db.bodega.findUnique({ where: { id: data.bodegaOrigenId } }),
      db.bodega.findUnique({ where: { id: data.bodegaDestinoId } }),
    ]);
    if (!origen || !destino) return { ok: false, error: "Bodega origen o destino no existe." };

    const resultado = await db.$transaction(async (tx) => {
      // Bloquear y validar stocks
      for (const item of data.items) {
        const stock = await tx.stockBodega.findUnique({
          where: { varianteId_bodegaId: { varianteId: item.varianteId, bodegaId: origen.id } },
        });
        if (!stock || stock.cantidad < item.cantidad) {
          const v = await tx.variante.findUnique({
            where: { id: item.varianteId },
            select: { sku: true },
          });
          throw new Error(
            `Stock insuficiente en "${origen.nombre}" para ${v?.sku ?? "artículo"} (disponible: ${stock?.cantidad ?? 0}).`
          );
        }
      }

      const traslado = await tx.traslado.create({
        data: {
          bodegaOrigenId: origen.id,
          bodegaDestinoId: destino.id,
          nota: data.nota || null,
        },
      });

      for (const item of data.items) {
        await tx.trasladoDetalle.create({
          data: { trasladoId: traslado.id, varianteId: item.varianteId, cantidad: item.cantidad },
        });

        await tx.stockBodega.update({
          where: { varianteId_bodegaId: { varianteId: item.varianteId, bodegaId: origen.id } },
          data: { cantidad: { decrement: item.cantidad } },
        });
        await tx.stockBodega.upsert({
          where: { varianteId_bodegaId: { varianteId: item.varianteId, bodegaId: destino.id } },
          create: {
            varianteId: item.varianteId,
            bodegaId: destino.id,
            cantidad: item.cantidad,
          },
          update: { cantidad: { increment: item.cantidad } },
        });

        const refDoc = formatoTraslado(traslado.id);
        await tx.movimientoInventario.createMany({
          data: [
            {
              varianteId: item.varianteId,
              tipo: "TRASLADO_SALIDA",
              cantidad: item.cantidad,
              bodegaOrigenId: origen.id,
              trasladoId: traslado.id,
              refDocumento: refDoc,
            },
            {
              varianteId: item.varianteId,
              tipo: "TRASLADO_ENTRADA",
              cantidad: item.cantidad,
              bodegaDestinoId: destino.id,
              trasladoId: traslado.id,
              refDocumento: refDoc,
            },
          ],
        });
      }
      return traslado;
    });

    revalidatePath("/traslados");
    revalidatePath("/inventario");
    revalidatePath("/movimientos");
    return { ok: true, data: { id: resultado.id } };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : errorDesconocido(e) };
  }
}
