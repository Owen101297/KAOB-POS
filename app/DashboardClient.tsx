"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Chart, registerables } from "chart.js";
import {
  CircleDollarSign,
  Receipt,
  Wallet,
  TrendingUp,
  ShoppingCart,
  Plus,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Building2,
  Package,
  Users,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useBodega } from "@/components/providers/BodegaProvider";
import { formatoCOP } from "@/lib/format";
import { obtenerDatosDashboard, type DashboardData } from "@/lib/actions/dashboard";

Chart.register(...registerables);

interface DashboardClientProps {
  initialData: DashboardData;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const { bodegaActiva } = useBodega();
  const [data, setData] = useState<DashboardData>(initialData);
  const [pending, startTransition] = useTransition();
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());

  const chartHoraRef = useRef<HTMLCanvasElement>(null);
  const chartDiaRef = useRef<HTMLCanvasElement>(null);
  const instances = useRef<Chart[]>([]);

  // Recargar datos
  const refrescarDatos = () => {
    startTransition(async () => {
      const res = await obtenerDatosDashboard(bodegaActiva?.id);
      setData(res);
      setUltimaActualizacion(new Date());
    });
  };

  // Recargar cuando cambia la bodega activa
  useEffect(() => {
    refrescarDatos();
  }, [bodegaActiva?.id]);

  // Auto-refresco en vivo cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refrescarDatos();
    }, 30000);
    return () => clearInterval(interval);
  }, [bodegaActiva?.id]);

  // Renderizado de Gráficos de Chart.js
  useEffect(() => {
    Chart.defaults.font.family =
      "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = "#94a3b8";

    instances.current.forEach((c) => c.destroy());
    instances.current = [];

    // 1. Gráfico Ventas por Hora
    if (chartHoraRef.current) {
      const ctx = chartHoraRef.current.getContext("2d");
      const gradient = ctx?.createLinearGradient(0, 0, 0, 190);
      gradient?.addColorStop(0, "rgba(16, 185, 129, 0.25)");
      gradient?.addColorStop(1, "rgba(16, 185, 129, 0)");

      const labels = data.ventasPorHora.map((v) => v.hora);
      const values = data.ventasPorHora.map((v) => v.total);

      instances.current.push(
        new Chart(chartHoraRef.current, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                data: values,
                borderColor: "#10b981",
                backgroundColor: gradient ?? "rgba(16, 185, 129, 0.08)",
                borderWidth: 2.5,
                tension: 0.35,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: "#10b981",
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "#0f172a",
                padding: 10,
                cornerRadius: 10,
                callbacks: {
                  label: (ctx) => `Ventas: ${formatoCOP(Number(ctx.raw) || 0)}`,
                },
              },
            },
            scales: {
              x: { grid: { display: false } },
              y: {
                beginAtZero: true,
                grid: { color: "#f1f5f9" },
                ticks: {
                  callback: (v) => `$${Number(v) >= 1000 ? `${Number(v) / 1000}k` : v}`,
                },
              },
            },
          },
        })
      );
    }

    // 2. Gráfico Ventas Semanales (7 días)
    if (chartDiaRef.current) {
      const labels = data.ventasPorDia.map((v) => v.dia);
      const values = data.ventasPorDia.map((v) => v.total);

      instances.current.push(
        new Chart(chartDiaRef.current, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: "#3b82f6",
                borderRadius: 6,
                hoverBackgroundColor: "#2563eb",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "#0f172a",
                padding: 10,
                cornerRadius: 10,
                callbacks: {
                  label: (ctx) => `Total: ${formatoCOP(Number(ctx.raw) || 0)}`,
                },
              },
            },
            scales: {
              x: { grid: { display: false } },
              y: {
                beginAtZero: true,
                grid: { color: "#f1f5f9" },
                ticks: {
                  callback: (v) => `$${Number(v) >= 1000 ? `${Number(v) / 1000}k` : v}`,
                },
              },
            },
          },
        })
      );
    }

    return () => {
      instances.current.forEach((c) => c.destroy());
      instances.current = [];
    };
  }, [data]);

  // Variación Ventas Hoy vs Ayer
  const difVentas = data.ventasHoy - data.ventasAyer;
  const pctVentas = data.ventasAyer > 0 ? Math.round((difVentas / data.ventasAyer) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Dashboard General
            </h1>
            <Badge variant="info" className="text-xs font-semibold">
              En Vivo
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Última sincronización: {ultimaActualizacion.toLocaleTimeString("es-CO")}
            {bodegaActiva && (
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                • Bodega: {bodegaActiva.nombre}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refrescarDatos}
            disabled={pending}
            className="text-xs flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin text-blue-600" : ""}`} />
            Actualizar
          </Button>

          <Link href="/ventas/nueva">
            <Button
              variant="primary"
              size="sm"
              className="h-9 text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              <ShoppingCart className="h-4 w-4" />
              Terminal POS
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ventas de Hoy */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ventas de Hoy
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {formatoCOP(data.ventasHoy)}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              {difVentas >= 0 ? (
                <span className="text-emerald-600 font-semibold flex items-center">
                  <ArrowUpRight className="h-3.5 w-3.5" /> +{formatoCOP(difVentas)}
                </span>
              ) : (
                <span className="text-red-500 font-semibold flex items-center">
                  <ArrowDownRight className="h-3.5 w-3.5" /> {formatoCOP(difVentas)}
                </span>
              )}
              <span>vs ayer ({formatoCOP(data.ventasAyer)})</span>
            </p>
          </div>
        </div>

        {/* 2. Facturas de Hoy */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Facturas / Tickets
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {data.transaccionesHoy} <span className="text-sm font-normal text-slate-400">ventas</span>
            </h3>
            <p className="text-xs text-slate-500">
              Ticket Promedio:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {formatoCOP(
                  data.transaccionesHoy > 0 ? Math.round(data.ventasHoy / data.transaccionesHoy) : 0
                )}
              </strong>
            </p>
          </div>
        </div>

        {/* 3. Gastos de Hoy */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Gastos Operativos
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {formatoCOP(data.gastosHoy)}
            </h3>
            <p className="text-xs text-slate-500">
              Ayer: {formatoCOP(data.gastosAyer)}
            </p>
          </div>
        </div>

        {/* 4. Utilidad Neta de Hoy */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Utilidad Bruta
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {formatoCOP(data.utilidadHoy)}
            </h3>
            <p className="text-xs text-slate-500">
              Margen de Ganancia:{" "}
              <strong className="text-purple-600 font-bold">{data.margenUtilidadHoy}%</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos de Ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Ventas por Hora de Hoy (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Ventas por Hora de Hoy
              </h3>
              <p className="text-xs text-slate-500">
                Flujo de facturación en el mostrador a lo largo del día
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
              Hoy: {formatoCOP(data.ventasHoy)}
            </span>
          </div>

          <div className="h-56">
            <canvas ref={chartHoraRef} />
          </div>
        </div>

        {/* Gráfico 2: Ventas Semanales (1 Col) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Ventas Últimos 7 Días
            </h3>
            <p className="text-xs text-slate-500">
              Facturación acumulada diaria
            </p>
          </div>

          <div className="h-56">
            <canvas ref={chartDiaRef} />
          </div>
        </div>
      </div>

      {/* Desglose de Medios de Pago + Últimas Ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medios de Pago de Hoy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Medios de Pago de Hoy
          </h3>

          <div className="space-y-3">
            {data.pagosHoy.map((p) => (
              <div key={p.metodo} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {p.label}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatoCOP(p.total)}{" "}
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({p.porcentaje}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${p.porcentaje}%`,
                      backgroundColor: p.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Estado Operativo Rápido */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Estado de Caja
              </span>
              <span
                className={`font-bold ${
                  data.cajaAbierta ? "text-emerald-600" : "text-amber-500"
                }`}
              >
                {data.cajaAbierta ? "Abierta" : "Cerrada"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Stock Bajo / Agotado
              </span>
              <span
                className={`font-bold ${
                  data.alertasStockCount > 0 ? "text-red-500" : "text-emerald-600"
                }`}
              >
                {data.alertasStockCount} prendas
              </span>
            </div>
          </div>
        </div>

        {/* Últimas Ventas en Tiempo Real (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Últimas Ventas Registradas
            </h3>
            <Link
              href="/ventas"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver todas <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {data.ultimasVentas.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Aún no se han registrado ventas hoy.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-left">
                    <th className="pb-2 font-semibold">Código</th>
                    <th className="pb-2 font-semibold">Cliente</th>
                    <th className="pb-2 font-semibold">Método</th>
                    <th className="pb-2 font-semibold text-right">Prendas</th>
                    <th className="pb-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.ultimasVentas.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-mono font-bold text-blue-600">{v.codigo}</td>
                      <td className="py-2.5 text-slate-800 dark:text-slate-200 font-medium">
                        {v.cliente}
                      </td>
                      <td className="py-2.5">
                        <Badge variant="neutral" className="text-[10px]">
                          {v.metodo}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                        {v.itemsCount}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatoCOP(v.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Productos Más Vendidos */}
      {data.topProductos.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Prendas Más Vendidas de la Semana
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.topProductos.map((prod, idx) => (
              <div
                key={prod.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                  <Badge variant="success" className="text-[10px]">
                    {prod.unidades} uds
                  </Badge>
                </div>
                <p className="font-bold text-slate-900 dark:text-white truncate">
                  {prod.nombre}
                </p>
                <p className="font-mono text-[11px] text-slate-400">Ref: {prod.referencia}</p>
                <p className="font-black text-slate-900 dark:text-white pt-1">
                  {formatoCOP(prod.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
