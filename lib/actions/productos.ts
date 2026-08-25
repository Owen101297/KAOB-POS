"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  agregarVariantesSchema,
  crearProductoSchema,
  errorDesconocido,
  preciosSchema,
  productoBaseSchema,
  type ActionResult,
} from "@/lib/validations";
import { generarSku } from "@/lib/constants";
import type { Prisma, Variante } from "@prisma/client";

// ─────────────────────────── CONSULTAS ───────────────────────

export type ProductoLista = Prisma.ProductoGetPayload<{
  include: {
    categoria: true;
    marca: true;
    variantes: {
      where: { activa: true };
      include: {
        color: true;
        talla: true;
        stocks: { include: { bodega: true } };
      };
    };
  };
}>;

export async function listarProductos(soloActivos = false): Promise<ProductoLista[]> {
  return db.producto.findMany({
    where: soloActivos ? { activo: true } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      categoria: true,
      marca: true,
      variantes: {
        where: { activa: true },
        include: {
          color: true,
          talla: true,
          stocks: { include: { bodega: true } },
        },
      },
    },
  });
}

export type ProductoDetalle = NonNullable<
  Prisma.PromiseReturnType<typeof obtenerProducto>
>;

export async function obtenerProducto(id: number) {
  return db.producto.findUnique({
    where: { id },
    include: {
      categoria: true,
      marca: true,
      variantes: {
        orderBy: [{ colorId: "asc" }, { tallaId: "asc" }],
        include: {
          color: true,
          talla: { include: { grupo: true } },
          stocks: { include: { bodega: true } },
        },
      },
    },
  });
}

export async function referenciaExiste(referencia: string, excluirId?: number) {
  const found = await db.producto.findUnique({ where: { referencia } });
  return !!found && found.id !== excluirId;
}

// ─────────────────────────── CREACIÓN ────────────────────────

interface VarianteInput {
  colorId: number;
  tallaId: number;
  stocks: { bodegaId: number; cantidad: number; minimo: number }[];
}

export async function crearProducto(input: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const data = crearProductoSchema.parse(input);

    // Validar unicidad de combinaciones dentro del payload
    const claves = new Set(
      data.variantes.map((v) => `${v.colorId}-${v.tallaId}`)
    );
    if (claves.size !== data.variantes.length) {
      return { ok: false, error: "Hay combinaciones color×talla duplicadas." };
    }

    const [categoria, coloresIds, tallasIds] = await Promise.all([
      db.categoria.findUnique({ where: { id: data.categoriaId } }),
      db.color.findMany({ where: { id: { in: data.variantes.map((v) => v.colorId) } } }),
      db.talla.findMany({ where: { id: { in: data.variantes.map((v) => v.tallaId) } } }),
    ]);
    if (!categoria) return { ok: false, error: "La categoría seleccionada no existe." };

    if (await referenciaExiste(data.referencia)) {
      return { ok: false, error: `La referencia "${data.referencia}" ya existe.` };
    }

    const colorMap = new Map(coloresIds.map((c) => [c.id, c.nombre]));
    const tallaMap = new Map(tallasIds.map((t) => [t.id, t.valor]));

    const creado = await db.$transaction(async (tx) => {
      const producto = await tx.producto.create({
        data: {
          referencia: data.referencia,
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          categoriaId: data.categoriaId,
          marcaId: data.marcaId ?? null,
          genero: data.genero ?? null,
          material: data.material || null,
          calidad: data.calidad ?? null,
          temporada: data.temporada || null,
          costo: data.costo,
          precioBase: data.precioBase,
        },
      });

      for (const v of data.variantes as VarianteInput[]) {
        const tallaValor =
          tallaMap.get(v.tallaId) ??
          (await tx.talla.findUniqueOrThrow({ where: { id: v.tallaId } })).valor;
        let sku = generarSku(
          data.referencia,
          colorMap.get(v.colorId) ?? String(v.colorId),
          tallaValor
        );
        sku = await skuUnico(tx, sku);
        const variante = await tx.variante.create({
          data: {
            productoId: producto.id,
            colorId: v.colorId,
            tallaId: v.tallaId,
            sku,
          },
        });
        for (const s of v.stocks) {
          await tx.stockBodega.create({
            data: {
              varianteId: variante.id,
              bodegaId: s.bodegaId,
              cantidad: s.cantidad,
              minimo: s.minimo,
            },
          });
          if (s.cantidad > 0) {
            await tx.movimientoInventario.create({
              data: {
                varianteId: variante.id,
                tipo: "INICIAL",
                cantidad: s.cantidad,
                bodegaDestinoId: s.bodegaId,
                nota: "Stock inicial al crear el producto",
              },
            });
          }
        }
      }
      return producto;
    });

    revalidatePath("/productos");
    revalidatePath("/inventario");
    return { ok: true, data: { id: creado.id } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

async function skuUnico(
  tx: Prisma.TransactionClient,
  base: string
): Promise<string> {
  let candidato = base;
  let n = 2;
  while (await tx.variante.findUnique({ where: { sku: candidato } })) {
    candidato = `${base}-${n++}`;
  }
  return candidato;
}

// ────────────────────────── ACTUALIZACIÓN ────────────────────

export async function actualizarProducto(
  id: number,
  input: unknown
): Promise<ActionResult> {
  try {
    const data = productoBaseSchema.parse(input);
    if (await referenciaExiste(data.referencia, id)) {
      return { ok: false, error: `La referencia "${data.referencia}" pertenece a otro producto.` };
    }
    await db.producto.update({
      where: { id },
      data: {
        referencia: data.referencia,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        categoriaId: data.categoriaId,
        marcaId: data.marcaId ?? null,
        genero: data.genero ?? null,
        material: data.material || null,
        calidad: data.calidad ?? null,
        temporada: data.temporada || null,
        costo: data.costo,
        precioBase: data.precioBase,
      },
    });
    revalidatePath("/productos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

/** Actualiza costo y/o precio de venta desde la lista de precios */
export async function actualizarPrecios(input: unknown): Promise<ActionResult> {
  try {
    const data = preciosSchema.parse(input);
    await db.producto.update({
      where: { id: data.id },
      data: { costo: data.costo, precioBase: data.precioBase },
    });
    revalidatePath("/lista-precios");
    revalidatePath("/productos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function toggleProductoActivo(id: number): Promise<ActionResult> {
  try {
    const p = await db.producto.findUniqueOrThrow({ where: { id } });
    await db.producto.update({ where: { id }, data: { activo: !p.activo } });
    revalidatePath("/productos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function eliminarProducto(id: number): Promise<ActionResult> {
  try {
    const producto = await db.producto.findUnique({
      where: { id },
      include: {
        variantes: {
          include: {
            ventaItems: {
              select: {
                id: true,
                venta: { select: { id: true, estado: true } },
              },
            },
            compraItems: {
              select: {
                id: true,
                compra: { select: { id: true, estado: true } },
              },
            },
            planSepareItems: {
              select: {
                id: true,
                planSepare: { select: { id: true, estado: true } },
              },
            },
            ordenCompraDetalles: { select: { id: true } },
            trasladosDetalle: { select: { id: true } },
          },
        },
      },
    });
    if (!producto) return { ok: false, error: "El producto no existe." };

    // Verificar si tiene ventas activas no anuladas
    const tieneVentasActivas = producto.variantes.some((v) =>
      v.ventaItems.some((vi) => vi.venta?.estado !== "ANULADA")
    );
    // Verificar si tiene compras activas no anuladas
    const tieneComprasActivas = producto.variantes.some((v) =>
      v.compraItems.some((ci) => ci.compra?.estado !== "ANULADA")
    );
    // Verificar si tiene plan separe activo (no cancelado ni entregado)
    const tienePlanSepareActivo = producto.variantes.some((v) =>
      v.planSepareItems.some((psi) => psi.planSepare?.estado === "ACTIVO")
    );

    if (tienePlanSepareActivo) {
      return {
        ok: false,
        error: "El producto está reservado en un Plan Separe ACTIVO. Cancela el plan primero antes de eliminar.",
      };
    }

    const varianteIds = producto.variantes.map((v) => v.id);

    await db.$transaction(async (tx) => {
      if (varianteIds.length > 0) {
        // 1. Eliminar ítems de planes separe asociados (ej. cancelados/finalizados)
        await tx.planSepareItem.deleteMany({
          where: { varianteId: { in: varianteIds } },
        });
        // 2. Eliminar detalles de órdenes de compra
        await tx.ordenCompraDetalle.deleteMany({
          where: { varianteId: { in: varianteIds } },
        });
        // 3. Eliminar ítems de compra/documento soporte
        await tx.compraItem.deleteMany({
          where: { varianteId: { in: varianteIds } },
        });
        // 4. Eliminar ítems de venta asociados
        await tx.ventaItem.deleteMany({
          where: { varianteId: { in: varianteIds } },
        });
        // 5. Eliminar detalles de traslados
        await tx.trasladoDetalle.deleteMany({
          where: { varianteId: { in: varianteIds } },
        });
        // 6. Eliminar movimientos de inventario asociados
        await tx.movimientoInventario.deleteMany({
          where: { varianteId: { in: varianteIds } },
        });
        // 7. Eliminar stock en bodegas
        await tx.stockBodega.deleteMany({
          where: { varianteId: { in: varianteIds } },
        });
        // 8. Eliminar variantes
        await tx.variante.deleteMany({
          where: { id: { in: varianteIds } },
        });
      }
      // 9. Eliminar producto
      await tx.producto.delete({
        where: { id },
      });
    });

    revalidatePath("/productos");
    revalidatePath("/inventario");
    revalidatePath("/ventas/nueva");
    revalidatePath("/tienda");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function eliminarMultiplesProductos(
  ids: number[]
): Promise<
  ActionResult<{
    eliminados: number;
    omitidos: { id: number; nombre: string; referencia: string; motivo: string }[];
  }>
> {
  try {
    if (!ids || ids.length === 0) {
      return { ok: false, error: "No se seleccionó ningún producto para eliminar." };
    }

    const productos = await db.producto.findMany({
      where: { id: { in: ids } },
      include: {
        variantes: {
          include: {
            ventaItems: {
              select: {
                id: true,
                venta: { select: { id: true, estado: true } },
              },
            },
            compraItems: {
              select: {
                id: true,
                compra: { select: { id: true, estado: true } },
              },
            },
            planSepareItems: {
              select: {
                id: true,
                planSepare: { select: { id: true, estado: true } },
              },
            },
          },
        },
      },
    });

    const omitidos: { id: number; nombre: string; referencia: string; motivo: string }[] = [];
    const paraEliminarIds: number[] = [];
    const todasVarianteIds: number[] = [];

    for (const p of productos) {
      const tienePlanSepareActivo = p.variantes.some((v) =>
        v.planSepareItems.some((psi) => psi.planSepare?.estado === "ACTIVO")
      );
      if (tienePlanSepareActivo) {
        omitidos.push({
          id: p.id,
          nombre: p.nombre,
          referencia: p.referencia,
          motivo: "Tiene un Plan Separe ACTIVO pendiente. Cancela el plan primero.",
        });
        continue;
      }

      paraEliminarIds.push(p.id);
      todasVarianteIds.push(...p.variantes.map((v) => v.id));
    }

    if (paraEliminarIds.length > 0) {
      await db.$transaction(async (tx) => {
        if (todasVarianteIds.length > 0) {
          // 1. Eliminar ítems de planes separe
          await tx.planSepareItem.deleteMany({
            where: { varianteId: { in: todasVarianteIds } },
          });
          // 2. Eliminar detalles de órdenes de compra
          await tx.ordenCompraDetalle.deleteMany({
            where: { varianteId: { in: todasVarianteIds } },
          });
          // 3. Eliminar compras
          await tx.compraItem.deleteMany({
            where: { varianteId: { in: todasVarianteIds } },
          });
          // 4. Eliminar ventas
          await tx.ventaItem.deleteMany({
            where: { varianteId: { in: todasVarianteIds } },
          });
          // 5. Eliminar traslados
          await tx.trasladoDetalle.deleteMany({
            where: { varianteId: { in: todasVarianteIds } },
          });
          // 6. Eliminar movimientos de inventario
          await tx.movimientoInventario.deleteMany({
            where: { varianteId: { in: todasVarianteIds } },
          });
          // 7. Eliminar stock
          await tx.stockBodega.deleteMany({
            where: { varianteId: { in: todasVarianteIds } },
          });
          // 8. Eliminar variantes
          await tx.variante.deleteMany({
            where: { id: { in: todasVarianteIds } },
          });
        }
        // 9. Eliminar productos
        await tx.producto.deleteMany({
          where: { id: { in: paraEliminarIds } },
        });
      });
    }

    revalidatePath("/productos");
    revalidatePath("/inventario");
    revalidatePath("/ventas/nueva");
    revalidatePath("/tienda");

    return {
      ok: true,
      data: {
        eliminados: paraEliminarIds.length,
        omitidos,
      },
    };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

/** Agrega variantes nuevas a un producto existente con stock inicial opcional */
export async function agregarVariantes(
  input: unknown
): Promise<ActionResult<{ creadas: number }>> {
  try {
    const data = agregarVariantesSchema.parse(input);
    const producto = await db.producto.findUnique({ where: { id: data.productoId } });
    if (!producto) return { ok: false, error: "El producto no existe." };

    const existentes = await db.variante.findMany({
      where: { productoId: producto.id },
      select: { colorId: true, tallaId: true },
    });
    const setExistentes = new Set(existentes.map((e) => `${e.colorId}-${e.tallaId}`));

    const nuevas = data.combinaciones.filter(
      (c) => !setExistentes.has(`${c.colorId}-${c.tallaId}`)
    );
    if (nuevas.length === 0) {
      return { ok: false, error: "Todas esas combinaciones ya existen en el producto." };
    }

    const [colores, tallas] = await Promise.all([
      db.color.findMany({ where: { id: { in: nuevas.map((n) => n.colorId) } } }),
      db.talla.findMany({ where: { id: { in: nuevas.map((n) => n.tallaId) } } }),
    ]);
    const colorMap = new Map(colores.map((c) => [c.id, c.nombre]));
    const tallaMap = new Map(tallas.map((t) => [t.id, t.valor]));

    await db.$transaction(async (tx) => {
      for (const comb of nuevas) {
        let sku = generarSku(producto.referencia, colorMap.get(comb.colorId) ?? "", tallaMap.get(comb.tallaId) ?? "");
        sku = await skuUnico(tx, sku);
        const variante = await tx.variante.create({
          data: { productoId: producto.id, colorId: comb.colorId, tallaId: comb.tallaId, sku },
        });
        for (const s of data.stocks) {
          await tx.stockBodega.upsert({
            where: { varianteId_bodegaId: { varianteId: variante.id, bodegaId: s.bodegaId } },
            create: {
              varianteId: variante.id,
              bodegaId: s.bodegaId,
              cantidad: s.cantidad,
              minimo: s.minimo,
            },
            update: {},
          });
          if (s.cantidad > 0) {
            await tx.movimientoInventario.create({
              data: {
                varianteId: variante.id,
                tipo: "INICIAL",
                cantidad: s.cantidad,
                bodegaDestinoId: s.bodegaId,
                nota: "Variante agregada posteriormente",
              },
            });
          }
        }
      }
    });

    revalidatePath("/productos");
    revalidatePath("/inventario");
    return { ok: true, data: { creadas: nuevas.length } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}
