"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  anularCompraSchema,
  crearOrdenCompraSchema,
  errorDesconocido,
  registrarCompraSchema,
  type ActionResult,
} from "@/lib/validations";

const COMPRA_PATHS = [
  "/compras/documento-soporte",
  "/compras/historico-doc-soporte",
  "/ordenes-compra",
  "/inventario",
  "/movimientos",
];

function revalidarCompras() {
  COMPRA_PATHS.forEach((path) => revalidatePath(path));
}

// ─────────────────────────── CONSULTAS ──────────────────────────

const varianteInclude = {
  include: {
    color: true,
    talla: true,
    producto: { select: { nombre: true, referencia: true } },
  },
} as const;

export async function listarCompras(opts?: {
  proveedorId?: number;
  bodegaId?: number;
  desde?: Date;
  hasta?: Date;
  take?: number;
}) {
  return db.compra.findMany({
    where: {
      ...(opts?.proveedorId ? { proveedorId: opts.proveedorId } : {}),
      ...(opts?.bodegaId ? { bodegaId: opts.bodegaId } : {}),
      ...(opts?.desde || opts?.hasta
        ? {
            createdAt: {
              ...(opts.desde ? { gte: opts.desde } : {}),
              ...(opts.hasta ? { lte: opts.hasta } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 200,
    include: {
      proveedor: true,
      bodega: true,
      items: { include: { variante: varianteInclude } },
      pagos: true,
    },
  });
}

export type CompraLista = Awaited<ReturnType<typeof listarCompras>>[number];

export async function obtenerCompra(id: number) {
  return db.compra.findUnique({
    where: { id },
    include: {
      proveedor: true,
      bodega: true,
      items: { include: { variante: varianteInclude } },
      pagos: true,
    },
  });
}

export async function obtenerConsecutivoCompra(): Promise<number> {
  const ultima = await db.compra.findFirst({
    orderBy: { consecutivo: "desc" },
    select: { consecutivo: true },
  });
  return (ultima?.consecutivo ?? 0) + 1;
}

// ─────────────────────────── REGISTRAR COMPRA ──────────────────────────

export async function registrarCompra(
  input: unknown
): Promise<ActionResult<{ id: number; consecutivo: number; codigo: string }>> {
  try {
    const data = registrarCompraSchema.parse(input);

    const consecutivo = await obtenerConsecutivoCompra();
    const codigo = `FC-${String(consecutivo).padStart(4, "0")}`;

    const subtotal = data.items.reduce(
      (a, i) => a + i.cantidad * i.costoUnitario,
      0
    );
    const total = subtotal + data.impuesto;

    const compra = await db.$transaction(async (tx) => {
      const c = await tx.compra.create({
        data: {
          consecutivo,
          numeroFactura: data.numeroFactura || null,
          proveedorId: data.proveedorId,
          bodegaId: data.bodegaId,
          subtotal,
          impuesto: data.impuesto,
          total,
          estado: "COMPLETADA",
          nota: data.nota || null,
        },
      });

      for (const item of data.items) {
        await tx.compraItem.create({
          data: {
            compraId: c.id,
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            costoUnitario: item.costoUnitario,
            subtotal: item.cantidad * item.costoUnitario,
          },
        });

        // Incrementar stock en bodega (upsert si no existía)
        await tx.stockBodega.upsert({
          where: {
            varianteId_bodegaId: {
              varianteId: item.varianteId,
              bodegaId: data.bodegaId,
            },
          },
          update: { cantidad: { increment: item.cantidad } },
          create: {
            varianteId: item.varianteId,
            bodegaId: data.bodegaId,
            cantidad: item.cantidad,
            minimo: 0,
          },
        });

        // Registrar movimiento de inventario tipo COMPRA
        await tx.movimientoInventario.create({
          data: {
            varianteId: item.varianteId,
            tipo: "COMPRA",
            cantidad: item.cantidad,
            bodegaDestinoId: data.bodegaId,
            costoUnitario: item.costoUnitario,
            nota: `Compra ${codigo}${data.numeroFactura ? ` (Fact. ${data.numeroFactura})` : ""}`,
            refDocumento: codigo,
          },
        });

        // Actualizar costo base en el producto si el costo de compra difiere
        const variante = await tx.variante.findUnique({
          where: { id: item.varianteId },
          select: { productoId: true },
        });
        if (variante) {
          await tx.producto.update({
            where: { id: variante.productoId },
            data: { costo: item.costoUnitario },
          });
        }
      }

      // Registrar pagos
      for (const pago of data.pagos) {
        await tx.pagoCompra.create({
          data: {
            compraId: c.id,
            metodo: pago.metodo,
            monto: pago.monto,
            referencia: pago.referencia || null,
          },
        });

        // Si fue en efectivo y hay caja abierta, registrar salida de dinero (SUPLIDO/RETIRO)
        if (pago.metodo === "EFECTIVO") {
          const sesion = await tx.sesionCaja.findFirst({
            where: { estado: "ABIERTA", bodegaId: data.bodegaId },
            orderBy: { openedAt: "desc" },
          });
          if (sesion) {
            await tx.movimientoCaja.create({
              data: {
                sesionId: sesion.id,
                tipo: "SUPLIDO",
                monto: pago.monto,
                referencia: `Pago compra ${codigo}`,
              },
            });
          }
        }
      }

      return c;
    });

    revalidarCompras();
    return { ok: true, data: { id: compra.id, consecutivo, codigo } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── ANULAR COMPRA ──────────────────────────

export async function anularCompra(input: unknown): Promise<ActionResult> {
  try {
    const data = anularCompraSchema.parse(input);

    const compra = await db.compra.findUnique({
      where: { id: data.id },
      include: { items: true },
    });
    if (!compra) return { ok: false, error: "La compra no existe." };
    if (compra.estado === "ANULADA")
      return { ok: false, error: "La compra ya está anulada." };

    // Verificar que haya suficiente stock en la bodega para revertir
    for (const item of compra.items) {
      const stock = await db.stockBodega.findUnique({
        where: {
          varianteId_bodegaId: {
            varianteId: item.varianteId,
            bodegaId: compra.bodegaId,
          },
        },
      });
      if (!stock || stock.cantidad < item.cantidad) {
        const v = await db.variante.findUnique({
          where: { id: item.varianteId },
          select: { sku: true },
        });
        return {
          ok: false,
          error: `No se puede anular: stock insuficiente para ${v?.sku ?? "artículo"} en la bodega.`,
        };
      }
    }

    await db.$transaction(async (tx) => {
      for (const item of compra.items) {
        await tx.stockBodega.update({
          where: {
            varianteId_bodegaId: {
              varianteId: item.varianteId,
              bodegaId: compra.bodegaId,
            },
          },
          data: { cantidad: { decrement: item.cantidad } },
        });

        await tx.movimientoInventario.create({
          data: {
            varianteId: item.varianteId,
            tipo: "DEVOLUCION",
            cantidad: item.cantidad,
            bodegaOrigenId: compra.bodegaId,
            costoUnitario: item.costoUnitario,
            nota: `Anulación compra FC-${String(compra.consecutivo).padStart(4, "0")}: ${data.motivo}`,
            refDocumento: `FC-${String(compra.consecutivo).padStart(4, "0")}`,
          },
        });
      }

      await tx.compra.update({
        where: { id: data.id },
        data: {
          estado: "ANULADA",
          nota: (compra.nota ? compra.nota + "\n" : "") + `ANULADA: ${data.motivo}`,
        },
      });
    });

    revalidarCompras();
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── ÓRDENES DE COMPRA ──────────────────────────

export async function listarOrdenesCompra(opts?: { take?: number }) {
  return db.ordenCompra.findMany({
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 100,
    include: {
      proveedor: true,
      bodega: true,
      detalles: { include: { variante: varianteInclude } },
    },
  });
}

export type OrdenCompraLista = Awaited<ReturnType<typeof listarOrdenesCompra>>[number];

export async function crearOrdenCompra(
  input: unknown
): Promise<ActionResult<{ id: number; consecutivo: number; codigo: string }>> {
  try {
    const data = crearOrdenCompraSchema.parse(input);

    const ultima = await db.ordenCompra.findFirst({
      orderBy: { consecutivo: "desc" },
      select: { consecutivo: true },
    });
    const consecutivo = (ultima?.consecutivo ?? 0) + 1;
    const codigo = `OC-${String(consecutivo).padStart(4, "0")}`;

    const total = data.detalles.reduce(
      (a, d) => a + d.cantidad * d.costoEstimado,
      0
    );

    const orden = await db.$transaction(async (tx) => {
      const o = await tx.ordenCompra.create({
        data: {
          consecutivo,
          proveedorId: data.proveedorId,
          bodegaId: data.bodegaId,
          total,
          estado: "PENDIENTE",
          nota: data.nota || null,
        },
      });

      for (const item of data.detalles) {
        await tx.ordenCompraDetalle.create({
          data: {
            ordenId: o.id,
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            costoEstimado: item.costoEstimado,
            subtotal: item.cantidad * item.costoEstimado,
          },
        });
      }

      return o;
    });

    revalidarCompras();
    return { ok: true, data: { id: orden.id, consecutivo, codigo } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}
