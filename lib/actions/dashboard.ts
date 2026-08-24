"use server";

import { db } from "@/lib/db";

export interface DashboardData {
  ventasHoy: number;
  ventasAyer: number;
  transaccionesHoy: number;
  transaccionesAyer: number;
  gastosHoy: number;
  gastosAyer: number;
  costoVentasHoy: number;
  utilidadHoy: number;
  margenUtilidadHoy: number;
  pagosHoy: {
    metodo: string;
    label: string;
    total: number;
    porcentaje: number;
    color: string;
    bgSoft: string;
  }[];
  ventasPorHora: { hora: string; total: number }[];
  ventasPorDia: { dia: string; total: number }[];
  ultimasVentas: {
    id: number;
    codigo: string;
    cliente: string;
    total: number;
    metodo: string;
    fecha: Date;
    itemsCount: number;
  }[];
  topProductos: {
    id: number;
    nombre: string;
    referencia: string;
    unidades: number;
    total: number;
  }[];
  cajaAbierta: boolean;
  baseCajaActual: number;
  alertasStockCount: number;
  totalClientes: number;
}

export async function obtenerDatosDashboard(bodegaId?: number): Promise<DashboardData> {
  const ahora = new Date();

  // Inicio y fin de hoy
  const startToday = new Date(ahora);
  startToday.setHours(0, 0, 0, 0);

  const endToday = new Date(ahora);
  endToday.setHours(23, 59, 59, 999);

  // Inicio y fin de ayer
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);

  const endYesterday = new Date(endToday);
  endYesterday.setDate(endYesterday.getDate() - 1);

  // Inicio de hace 7 días
  const start7DaysAgo = new Date(startToday);
  start7DaysAgo.setDate(start7DaysAgo.getDate() - 6);

  // 1. Ventas de Hoy
  const ventasHoyDb = await db.venta.findMany({
    where: {
      estado: "COMPLETADA",
      tipo: "VENTA",
      createdAt: { gte: startToday, lte: endToday },
      ...(bodegaId ? { bodegaId } : {}),
    },
    include: {
      items: true,
      pagos: true,
      cliente: { select: { nombre: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const ventasHoy = ventasHoyDb.reduce((a, v) => a + v.total, 0);
  const transaccionesHoy = ventasHoyDb.length;
  let costoVentasHoy = 0;
  ventasHoyDb.forEach((v) => {
    v.items.forEach((it) => {
      costoVentasHoy += (it.costoUnitario || 0) * it.cantidad;
    });
  });

  // 2. Ventas de Ayer
  const ventasAyerDb = await db.venta.findMany({
    where: {
      estado: "COMPLETADA",
      tipo: "VENTA",
      createdAt: { gte: startYesterday, lte: endYesterday },
      ...(bodegaId ? { bodegaId } : {}),
    },
    select: { total: true },
  });

  const ventasAyer = ventasAyerDb.reduce((a, v) => a + v.total, 0);
  const transaccionesAyer = ventasAyerDb.length;

  // 3. Gastos de Hoy y Ayer
  const gastosHoyDb = await db.gasto.findMany({
    where: {
      estado: "REGISTRADO",
      fecha: { gte: startToday, lte: endToday },
      ...(bodegaId ? { bodegaId } : {}),
    },
    select: { monto: true },
  });
  const gastosHoy = gastosHoyDb.reduce((a, g) => a + g.monto, 0);

  const gastosAyerDb = await db.gasto.findMany({
    where: {
      estado: "REGISTRADO",
      fecha: { gte: startYesterday, lte: endYesterday },
      ...(bodegaId ? { bodegaId } : {}),
    },
    select: { monto: true },
  });
  const gastosAyer = gastosAyerDb.reduce((a, g) => a + g.monto, 0);

  // Utilidad de Hoy
  const utilidadHoy = ventasHoy - costoVentasHoy - gastosHoy;
  const margenUtilidadHoy = ventasHoy > 0 ? Math.round((utilidadHoy / ventasHoy) * 100) : 0;

  // 4. Desglose de Medios de Pago de Hoy
  const metodosHoyMap: Record<string, number> = {
    EFECTIVO: 0,
    TRANSFERENCIA: 0,
    TARJETA: 0,
    CREDITO: 0,
  };

  ventasHoyDb.forEach((v) => {
    v.pagos.forEach((p) => {
      metodosHoyMap[p.metodo] = (metodosHoyMap[p.metodo] || 0) + p.monto;
    });
  });

  const configMetodos: Record<string, { label: string; color: string; bgSoft: string }> = {
    EFECTIVO: { label: "Efectivo", color: "#10b981", bgSoft: "bg-emerald-50 text-emerald-600" },
    TRANSFERENCIA: { label: "Transferencia", color: "#3b82f6", bgSoft: "bg-blue-50 text-blue-600" },
    TARJETA: { label: "Datáfono / Tarjeta", color: "#a855f7", bgSoft: "bg-purple-50 text-purple-600" },
    CREDITO: { label: "Crédito", color: "#f59e0b", bgSoft: "bg-amber-50 text-amber-600" },
  };

  const pagosHoy = Object.entries(metodosHoyMap).map(([metodo, total]) => ({
    metodo,
    label: configMetodos[metodo]?.label || metodo,
    total,
    porcentaje: ventasHoy > 0 ? Math.round((total / ventasHoy) * 100) : 0,
    color: configMetodos[metodo]?.color || "#64748b",
    bgSoft: configMetodos[metodo]?.bgSoft || "bg-slate-50 text-slate-600",
  }));

  // 5. Curva de Ventas por Hora de Hoy (08:00 a 21:00)
  const horasMap: Record<number, number> = {};
  for (let h = 8; h <= 21; h++) {
    horasMap[h] = 0;
  }

  ventasHoyDb.forEach((v) => {
    const hora = new Date(v.createdAt).getHours();
    if (horasMap[hora] !== undefined) {
      horasMap[hora] += v.total;
    }
  });

  const ventasPorHora = Object.entries(horasMap).map(([h, total]) => ({
    hora: `${h}:00`,
    total,
  }));

  // 6. Curva de Ventas de los Últimos 7 Días
  const ventas7DiasDb = await db.venta.findMany({
    where: {
      estado: "COMPLETADA",
      tipo: "VENTA",
      createdAt: { gte: start7DaysAgo, lte: endToday },
      ...(bodegaId ? { bodegaId } : {}),
    },
    select: { createdAt: true, total: true },
  });

  const diasNombres = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const diasMap: { dia: string; total: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(startToday);
    d.setDate(d.getDate() - i);
    const diaNombre = diasNombres[d.getDay()];
    const diaKey = d.toISOString().split("T")[0];

    const totalDia = ventas7DiasDb
      .filter((v) => new Date(v.createdAt).toISOString().split("T")[0] === diaKey)
      .reduce((a, v) => a + v.total, 0);

    diasMap.push({
      dia: diaNombre,
      total: totalDia,
    });
  }

  // 7. Últimas 5 Ventas
  const ultimasVentas = ventasHoyDb.slice(0, 5).map((v) => ({
    id: v.id,
    codigo: `VEN-${String(v.consecutivo).padStart(4, "0")}`,
    cliente: v.cliente?.nombre || "Cliente General",
    total: v.total,
    metodo: v.pagos[0]?.metodo || "EFECTIVO",
    fecha: v.createdAt,
    itemsCount: v.items.reduce((a, it) => a + it.cantidad, 0),
  }));

  // 8. Top 5 Productos de la Semana
  const topItems = await db.ventaItem.groupBy({
    by: ["varianteId"],
    where: {
      venta: {
        estado: "COMPLETADA",
        tipo: "VENTA",
        createdAt: { gte: start7DaysAgo },
        ...(bodegaId ? { bodegaId } : {}),
      },
    },
    _sum: { cantidad: true, subtotal: true },
    orderBy: { _sum: { cantidad: "desc" } },
    take: 5,
  });

  const topProductos: DashboardData["topProductos"] = [];
  for (const it of topItems) {
    const v = await db.variante.findUnique({
      where: { id: it.varianteId },
      include: { producto: true },
    });
    if (v) {
      topProductos.push({
        id: v.producto.id,
        nombre: v.producto.nombre,
        referencia: v.producto.referencia,
        unidades: it._sum.cantidad || 0,
        total: it._sum.subtotal || 0,
      });
    }
  }

  // 9. Estado de Caja Actual y Stock Bajo
  const sesionAbierta = await db.sesionCaja.findFirst({
    where: {
      estado: "ABIERTA",
      ...(bodegaId ? { bodegaId } : {}),
    },
  });

  const stocksDb = await db.stockBodega.findMany({
    where: bodegaId ? { bodegaId } : undefined,
    select: { cantidad: true, minimo: true },
  });
  const alertasStockCount = stocksDb.filter(
    (s) => s.cantidad === 0 || (s.minimo > 0 && s.cantidad <= s.minimo)
  ).length;

  const totalClientes = await db.cliente.count({ where: { activo: true } });

  return {
    ventasHoy,
    ventasAyer,
    transaccionesHoy,
    transaccionesAyer,
    gastosHoy,
    gastosAyer,
    costoVentasHoy,
    utilidadHoy,
    margenUtilidadHoy,
    pagosHoy,
    ventasPorHora,
    ventasPorDia: diasMap,
    ultimasVentas,
    topProductos,
    cajaAbierta: !!sesionAbierta,
    baseCajaActual: sesionAbierta?.baseInicial || 0,
    alertasStockCount,
    totalClientes,
  };
}
