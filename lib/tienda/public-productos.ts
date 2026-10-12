import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const productoTiendaSelect = {
  id: true,
  referencia: true,
  nombre: true,
  descripcion: true,
  genero: true,
  calidad: true,
  precioBase: true,
  activo: true,
  categoria: { select: { nombre: true } },
  variantes: {
    where: { activa: true },
    select: {
      id: true,
      precioOverride: true,
      color: { select: { id: true, nombre: true, hex: true } },
      talla: { select: { id: true, valor: true } },
      stocks: { select: { cantidad: true } },
    },
  },
} satisfies Prisma.ProductoSelect;

export type ProductoTienda = Prisma.ProductoGetPayload<{
  select: typeof productoTiendaSelect;
}>;

export async function listarProductosPublicos(): Promise<ProductoTienda[]> {
  const productos = await db.producto.findMany({
    where: { activo: true },
    orderBy: { createdAt: "desc" },
    select: productoTiendaSelect,
  });

  // La tienda necesita disponibilidad total por variante, no cantidades por bodega.
  return productos.map((producto) => ({
    ...producto,
    variantes: producto.variantes.map((variante) => ({
      ...variante,
      stocks: [{ cantidad: variante.stocks.reduce((total, stock) => total + stock.cantidad, 0) }],
    })),
  }));
}
