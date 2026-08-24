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
  Download,
  Building2,
  Package,
  Users,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useBodega } from "@/components/providers/BodegaProvider";
import { formatoCOP } from "@/lib/format";
import { obtenerDatosDashboard, type DashboardData } from "@/lib/actions/dashboard";

Chart.register(...registerables);

interface DashboardClientProps {
  initialData: DashboardData;
}

const STEPS = [
  "Configuración inicial del almacén",
  "Medios de pago",
  "Creación de usuarios",
  "Información general",
  "Impuestos",
  "Impresión de factura",
  "Control de inventario inicial",
];

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const { bodegaActiva } = useBodega();
  const [data, setData] = useState<DashboardData>(initialData);
  const [pending, startTransition] = useTransition();
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  const chartHoraRef = useRef<HTMLCanvasElement>(null);
  const chartDiaRef = useRef<HTMLCanvasElement>(null);
  const instances = useRef<Chart[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Recargar datos en vivo
  const refrescarDatos = () => {
    startTransition(async () => {
      const res = await obtenerDatosDashboard(bodegaActiva?.id);
      setData(res);
      setUltimaActualizacion(new Date());
    });
  };

  useEffect(() => {
    if (mounted) {
      refrescarDatos();
    }
  }, [bodegaActiva?.id, mounted]);

  // Auto-refresco en vivo cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refrescarDatos();
    }, 30000);
    return () => clearInterval(interval);
  }, [bodegaActiva?.id]);

  // Renderizado de Gráficos de Chart.js con paleta limpia blanca/slate
  useEffect(() => {
    Chart.defaults.font.family =
      "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = "#94a3b8";

    instances.current.forEach((c) => c.destroy());
    instances.current = [];

    const tooltipStyle = {
      backgroundColor: "#0f172a",
      padding: 10,
      cornerRadius: 8,
    };

    // 1. Gráfico Ventas por Hora
    if (chartHoraRef.current) {
      const ctx = chartHoraRef.current.getContext("2d");
      const gradient = ctx?.createLinearGradient(0, 0, 0, 190);
      gradient?.addColorStop(0, "rgba(98, 203, 49, 0.25)");
      gradient?.addColorStop(1, "rgba(98, 203, 49, 0)");

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
                borderColor: "#62cb31",
                backgroundColor: gradient ?? "rgba(98, 203, 49, 0.08)",
                borderWidth: 2,
                tension: 0.35,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: "#62cb31",
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
                ...tooltipStyle,
                callbacks: {
                  label: (ctx) => `Ventas: ${formatoCOP(Number(ctx.raw) || 0)}`,
                },
              },
            },
            scales: {
              x: { grid: { display: false }, border: { display: false } },
              y: {
                beginAtZero: true,
                grid: { color: "#f1f5f9" },
                border: { display: false },
                ticks: {
                  callback: (value) => `$${Number(value) >= 1000 ? `${Number(value) / 1000}k` : value}`,
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
                backgroundColor: "#62cb31",
                hoverBackgroundColor: "#4aad21",
                borderRadius: 6,
                maxBarThickness: 28,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...tooltipStyle,
                callbacks: {
                  label: (ctx) => `Total: ${formatoCOP(Number(ctx.raw) || 0)}`,
                },
              },
            },
            scales: {
              x: { grid: { display: false }, border: { display: false } },
              y: {
                beginAtZero: true,
                grid: { color: "#f1f5f9" },
                border: { display: false },
                ticks: {
                  callback: (value) => `$${Number(value) >= 1000 ? `${Number(value) / 1000}k` : value}`,
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

  // Metas del día
  const metaDia = 500000;
  const progresoMetaPct = Math.min(100, Math.round((data.ventasHoy / metaDia) * 100));

  const STATS = [
    {
      label: "Ventas de hoy",
      value: formatoCOP(data.ventasHoy),
      color: "brand" as const,
      icon: <CircleDollarSign />,
      hint: `Ayer: ${formatoCOP(data.ventasAyer)}`,
    },
    {
      label: "Facturas de hoy",
      value: `# ${data.transaccionesHoy}`,
      color: "sky" as const,
      icon: <Receipt />,
      hint: `Ayer: # ${data.transaccionesAyer}`,
    },
    {
      label: "Gastos de hoy",
      value: formatoCOP(data.gastosHoy),
      color: "amber" as const,
      icon: <Wallet />,
      hint: `Ayer: ${formatoCOP(data.gastosAyer)}`,
    },
    {
      label: "Utilidad de hoy",
      value: formatoCOP(data.utilidadHoy),
      color: "violet" as const,
      icon: <TrendingUp />,
      hint: `Margen: ${data.margenUtilidadHoy}%`,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Resumen"
        description={
          mounted
            ? `Sincronizado: ${ultimaActualizacion.toLocaleTimeString("es-CO")} ${bodegaActiva ? `• Bodega: ${bodegaActiva.nombre}` : ""}`
            : "Cargando datos en vivo..."
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={refrescarDatos}
              disabled={pending}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin text-brand-600" : ""}`} />
              Actualizar
            </Button>
            <Link href="/ventas/nueva">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Nueva venta
              </Button>
            </Link>
          </>
        }
      />

      {/* 4 KPIs Clave con Componente StatCard Blanco */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            color={s.color}
            icon={s.icon}
            hint={s.hint}
          />
        ))}
      </div>

      <div className="flex flex-col gap-5 xl:flex-row">
        {/* Columna principal */}
        <div className="min-w-0 flex-1 space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Ventas por hora */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas por hora</CardTitle>
                <p className="text-xs text-slate-400">Hoy</p>
              </CardHeader>
              <CardContent>
                <div className="h-[190px]">
                  <canvas ref={chartHoraRef} />
                </div>
              </CardContent>
            </Card>

            {/* Ventas por método de pago */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas por método de pago</CardTitle>
                <p className="text-xs text-slate-400">Hoy</p>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-slate-100">
                  {data.pagosHoy.map((m) => (
                    <li key={m.metodo} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      <span className="flex-1 text-[13px] font-medium text-slate-600">
                        {m.label}
                      </span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${m.bgSoft}`}>
                        {m.porcentaje}%
                      </span>
                      <span className="w-24 text-right text-[13px] font-semibold tabular-nums text-slate-800">
                        {formatoCOP(m.total)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Hoy
                  </span>
                  <span className="text-lg font-bold tabular-nums text-slate-900">
                    {formatoCOP(data.ventasHoy)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Ventas por día */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas por día</CardTitle>
                <p className="text-xs text-slate-400">Últimos 7 días</p>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <canvas ref={chartDiaRef} />
                </div>
              </CardContent>
            </Card>

            {/* Meta del día */}
            <Card>
              <CardHeader>
                <CardTitle>Meta del día</CardTitle>
                <p className="text-xs text-slate-400">Objetivo configurado</p>
              </CardHeader>
              <CardContent className="flex h-[148px] flex-col justify-center">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold tracking-tight text-slate-900">
                    {formatoCOP(data.ventasHoy)}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    de {formatoCOP(metaDia)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
                    style={{ width: `${progresoMetaPct}%` }}
                  />
                </div>
                <p className="mt-3 text-[13px] text-slate-400">
                  {data.ventasHoy === 0
                    ? "Aún no registras ventas hoy. ¡El día apenas comienza!"
                    : `Has alcanzado el ${progresoMetaPct}% de la meta estimada del día.`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Últimas Ventas en Tiempo Real */}
          {data.ultimasVentas.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Últimas Ventas Registradas</CardTitle>
                  <p className="text-xs text-slate-400">Transacciones de hoy en vivo</p>
                </div>
                <Link
                  href="/ventas"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-left">
                        <th className="pb-2 font-semibold">Código</th>
                        <th className="pb-2 font-semibold">Cliente</th>
                        <th className="pb-2 font-semibold">Método</th>
                        <th className="pb-2 font-semibold text-right">Prendas</th>
                        <th className="pb-2 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.ultimasVentas.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-mono font-bold text-brand-600">{v.codigo}</td>
                          <td className="py-2.5 text-slate-800 font-medium">{v.cliente}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[10px] text-slate-700">
                              {v.metodo}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-semibold text-slate-600">
                            {v.itemsCount}
                          </td>
                          <td className="py-2.5 text-right font-bold text-slate-900">
                            {formatoCOP(v.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Aside onboarding / Primeros pasos */}
        <aside className="w-full shrink-0 xl:w-[300px]">
          <Card className="sticky top-24">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Primeros pasos</CardTitle>
              <Link href="/configuracion" className="text-brand-600 hover:text-brand-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Progreso</span>
                <span className="font-bold text-slate-700">
                  {data.ventasHoy > 0 ? "6 / 7" : "4 / 7"} completado
                </span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-500"
                  style={{ width: data.ventasHoy > 0 ? "85%" : "57%" }}
                />
              </div>
              <ul className="-mx-2 divide-y divide-slate-100">
                {STEPS.map((step, i) => (
                  <li key={step}>
                    <button
                      type="button"
                      className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white transition-transform group-hover:scale-110">
                        {i + 1}
                      </span>
                      <span className="text-[12.5px] font-medium leading-snug text-slate-600 group-hover:text-slate-900">
                        {step}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
