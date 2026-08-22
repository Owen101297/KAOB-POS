"use server";

import { db } from "@/lib/db";

export interface ReporteVentasData {
  totalVentas: number;
  totalDescuentos: number;
  subtotal: number;
  totalTransacciones: number;
  ticketPromedio: number;
  unidadesVendidas: number;
  ventasPorMetodo: { metodo: string; total: number; porcentaje: number }[];
  ventasPorCategoria: { categoria: string; unidades: number; total: number; porcentaje: number }[];
  ventasPorVendedor: { vendedor: string; ventasCount: number; total: number; comision: number }[];
  tendenciaDiaria: { fecha: string; total: number; transacciones: number }[];
}

export interface ReporteRentabilidadData {
  ingresosTotales: number;
  costoMercancia: number; // COGS
  utilidadBruta: number;
  margenBrutoPct: number;
  productosRentables: {
    productoId: number;
    referencia: string;
    nombre: string;
    unidades: number;
    ingresos: number;
    costoTotal: number;
    utilidadBruta: number;
    margenPct: number;
  }[];
}

export interface ReporteInventarioData {
  valorCostoTotal: number;
  valorVentaTotal: number;
  utilidadEstimadaTotal: number;
  unidadesTotales: number;
  topSellers: {
    productoId: number;
    referencia: string;
    nombre: string;
    unidadesVendidas: number;
    totalVentas: number;
  }[];
  alertasStockBajo: {
    varianteId: number;
    sku: string;
    producto: string;
    color: string;
    talla: string;
    bodega: string;
    cantidadActual: number;
    minimo: number;
  }[];
}

// ─────────────────────────── CONSULTAS ──────────────────────────

export async function obtenerReporteVentas(
  dias: number = 30,
  bodegaId?: number
): Promise<ReporteVentasData> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const ventas = await db.venta.findMany({
    where: {
      estado: "COMPLETADA",
      tipo: "VENTA",
      createdAt: { gte: desde },
      ...(bodegaId ? { bodegaId } : {}),
    },
    include: {
      items: {
        include: {
          variante: {
            include: {
              producto: { include: { categoria: true } },
            },
          },
        },
      },
      pagos: true,
      vendedor: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const totalVentas = ventas.reduce((a, v) => a + v.total, 0);
  const totalDescuentos = ventas.reduce((a, v) => a + v.descuento, 0);
  const subtotal = ventas.reduce((a, v) => a + v.subtotal, 0);
  const totalTransacciones = ventas.length;
  const ticketPromedio = totalTransacciones > 0 ? Math.round(totalVentas / totalTransacciones) : 0;

  let unidadesVendidas = 0;
  const metodosMap: Record<string, number> = {};
  const categoriasMap: Record<string, { unidades: number; total: number }> = {};
  const vendedoresMap: Record<string, { count: number; total: number; pct: number }> = {};
  const diasMap: Record<string, { total: number; count: number }> = {};

  for (const v of ventas) {
    // Tendencia por día
    const fechaKey = new Date(v.createdAt).toISOString().split("T")[0];
    if (!diasMap[fechaKey]) diasMap[fechaKey] = { total: 0, count: 0 };
    diasMap[fechaKey].total += v.total;
    diasMap[fechaKey].count += 1;

    // Métodos de pago
    for (const p of v.pagos) {
      metodosMap[p.metodo] = (metodosMap[p.metodo] ?? 0) + p.monto;
    }

    // Vendedor
    const nomVendedor = v.vendedor?.nombre ?? "Sin Vendedor";
    const pctComision = v.vendedor?.comisionPct ?? 0;
    if (!vendedoresMap[nomVendedor]) {
      vendedoresMap[nomVendedor] = { count: 0, total: 0, pct: pctComision };
    }
    vendedoresMap[nomVendedor].count += 1;
    vendedoresMap[nomVendedor].total += v.total;

    // Ítems y categorías
    for (const item of v.items) {
      unidadesVendidas += item.cantidad;
      const nomCat = item.variante.producto.categoria.nombre;
      if (!categoriasMap[nomCat]) categoriasMap[nomCat] = { unidades: 0, total: 0 };
      categoriasMap[nomCat].unidades += item.cantidad;
      categoriasMap[nomCat].total += item.subtotal;
    }
  }

  const ventasPorMetodo = Object.entries(metodosMap).map(([metodo, total]) => ({
    metodo,
    total,
    porcentaje: totalVentas > 0 ? Math.round((total / totalVentas) * 100) : 0,
  }));

  const ventasPorCategoria = Object.entries(categoriasMap).map(([categoria, d]) => ({
    categoria,
    unidades: d.unidades,
    total: d.total,
    porcentaje: totalVentas > 0 ? Math.round((d.total / totalVentas) * 100) : 0,
  }));

  const ventasPorVendedor = Object.entries(vendedoresMap).map(([vendedor, d]) => ({
    vendedor,
    ventasCount: d.count,
    total: d.total,
    comision: Math.round((d.total * d.pct) / 100),
  }));

  const tendenciaDiaria = Object.entries(diasMap).map(([fecha, d]) => ({
    fecha,
    total: d.total,
    transacciones: d.count,
  }));

  return {
    totalVentas,
    totalDescuentos,
    subtotal,
    totalTransacciones,
    ticketPromedio,
    unidadesVendidas,
    ventasPorMetodo,
    ventasPorCategoria,
    ventasPorVendedor,
    tendenciaDiaria,
  };
}

export async function obtenerReporteRentabilidad(
  dias: number = 30
): Promise<ReporteRentabilidadData> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const items = await db.ventaItem.findMany({
    where: {
      venta: {
        estado: "COMPLETADA",
        tipo: "VENTA",
        createdAt: { gte: desde },
      },
    },
    include: {
      variante: {
        include: {
          producto: { select: { id: true, referencia: true, nombre: true } },
        },
      },
    },
  });

  let ingresosTotales = 0;
  let costoMercancia = 0;
  const prodMap: Record<
    number,
    {
      productoId: number;
      referencia: string;
      nombre: string;
      unidades: number;
      ingresos: number;
      costoTotal: number;
    }
  > = {};

  for (const item of items) {
    const ingresosItem = item.subtotal;
    const costoItem = item.cantidad * item.costoUnitario;

    ingresosTotales += ingresosItem;
    costoMercancia += costoItem;

    const pId = item.variante.producto.id;
    if (!prodMap[pId]) {
      prodMap[pId] = {
        productoId: pId,
        referencia: item.variante.producto.referencia,
        nombre: item.variante.producto.nombre,
        unidades: 0,
        ingresos: 0,
        costoTotal: 0,
      };
    }
    prodMap[pId].unidades += item.cantidad;
    prodMap[pId].ingresos += ingresosItem;
    prodMap[pId].costoTotal += costoItem;
  }

  const utilidadBruta = ingresosTotales - costoMercancia;
  const margenBrutoPct =
    ingresosTotales > 0 ? Number(((utilidadBruta / ingresosTotales) * 100).toFixed(1)) : 0;

  const productosRentables = Object.values(prodMap)
    .map((p) => {
      const ub = p.ingresos - p.costoTotal;
      const mPct = p.ingresos > 0 ? Number(((ub / p.ingresos) * 100).toFixed(1)) : 0;
      return {
        ...p,
        utilidadBruta: ub,
        margenPct: mPct,
      };
    })
    .sort((a, b) => b.utilidadBruta - a.utilidadBruta);

  return {
    ingresosTotales,
    costoMercancia,
    utilidadBruta,
    margenBrutoPct,
    productosRentables,
  };
}

export async function obtenerReporteInventarioRotacion(
  bodegaId?: number
): Promise<ReporteInventarioData> {
  const stocks = await db.stockBodega.findMany({
    where: bodegaId ? { bodegaId } : undefined,
    include: {
      bodega: { select: { nombre: true } },
      variante: {
        include: {
          color: { select: { nombre: true } },
          talla: { select: { valor: true } },
          producto: { select: { id: true, referencia: true, nombre: true, costo: true, precioBase: true } },
        },
      },
    },
  });

  let valorCostoTotal = 0;
  let valorVentaTotal = 0;
  let unidadesTotales = 0;
  const alertasStockBajo: ReporteInventarioData["alertasStockBajo"] = [];

  for (const s of stocks) {
    unidadesTotales += s.cantidad;
    const costoUnit = s.variante.producto.costo;
    const precioUnit = s.variante.precioOverride ?? s.variante.producto.precioBase;

    valorCostoTotal += s.cantidad * costoUnit;
    valorVentaTotal += s.cantidad * precioUnit;

    if (s.minimo > 0 && s.cantidad <= s.minimo) {
      alertasStockBajo.push({
        varianteId: s.varianteId,
        sku: s.variante.sku,
        producto: s.variante.producto.nombre,
        color: s.variante.color.nombre,
        talla: s.variante.talla.valor,
        bodega: s.bodega.nombre,
        cantidadActual: s.cantidad,
        minimo: s.minimo,
      });
    }
  }

  // Top Sellers últimos 60 días
  const desde = new Date();
  desde.setDate(desde.getDate() - 60);

  const topItems = await db.ventaItem.groupBy({
    by: ["varianteId"],
    where: {
      venta: { estado: "COMPLETADA", tipo: "VENTA", createdAt: { gte: desde } },
    },
    _sum: { cantidad: true, subtotal: true },
    orderBy: { _sum: { cantidad: "desc" } },
    take: 20,
  });

  const topSellersMap: Record<number, { productoId: number; referencia: string; nombre: string; unidades: number; total: number }> = {};

  for (const item of topItems) {
    const v = await db.variante.findUnique({
      where: { id: item.varianteId },
      include: { producto: true },
    });
    if (v) {
      const pId = v.producto.id;
      if (!topSellersMap[pId]) {
        topSellersMap[pId] = {
          productoId: pId,
          referencia: v.producto.referencia,
          nombre: v.producto.nombre,
          unidades: 0,
          total: 0,
        };
      }
      topSellersMap[pId].unidades += item._sum.cantidad ?? 0;
      topSellersMap[pId].total += item._sum.subtotal ?? 0;
    }
  }

  const topSellers = Object.values(topSellersMap)
    .map((t) => ({
      productoId: t.productoId,
      referencia: t.referencia,
      nombre: t.nombre,
      unidadesVendidas: t.unidades,
      totalVentas: t.total,
    }))
    .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);

  return {
    valorCostoTotal,
    valorVentaTotal,
    utilidadEstimadaTotal: valorVentaTotal - valorCostoTotal,
    unidadesTotales,
    topSellers,
    alertasStockBajo,
  };
}
