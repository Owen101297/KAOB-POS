'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Chart, registerables } from 'chart.js';
import {
  CircleDollarSign,
  Download,
  Plus,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';

Chart.register(...registerables);

const STATS = [
  { label: 'Ventas de hoy', value: '$ 0', color: 'brand' as const, icon: <CircleDollarSign />, hint: 'Ayer: $ 0' },
  { label: 'Facturas de hoy', value: '# 0', color: 'sky' as const, icon: <Receipt />, hint: 'Ayer: # 0' },
  { label: 'Gastos de hoy', value: '$ 0', color: 'amber' as const, icon: <Wallet />, hint: 'Ayer: $ 0' },
  { label: 'Utilidad de hoy', value: '$ 0', color: 'violet' as const, icon: <TrendingUp />, hint: 'Margen: 0%' },
];

const PAYMENTS = [
  { label: 'Transferencia', color: '#f59e0b', soft: 'bg-amber-50 text-amber-600', value: '$ 0' },
  { label: 'Efectivo', color: '#62cb31', soft: 'bg-brand-50 text-brand-600', value: '$ 0' },
  { label: 'Crédito', color: '#0ea5e9', soft: 'bg-sky-50 text-sky-600', value: '$ 0' },
];

const STEPS = [
  'Configuración inicial del almacén',
  'Medios de pago',
  'Creación de usuarios',
  'Información general',
  'Impuestos',
  'Impresión de factura',
  'Problemas de impresión',
];

const CHART_GRID = '#eef2f6';
const CHART_TICK = '#94a3b8';

export default function Dashboard() {
  const chartHoraRef = useRef<HTMLCanvasElement>(null);
  const chartDiaRef = useRef<HTMLCanvasElement>(null);
  const instances = useRef<Chart[]>([]);

  useEffect(() => {
    Chart.defaults.font.family =
      "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = CHART_TICK;

    const tooltipStyle = {
      backgroundColor: '#0f172a',
      padding: 10,
      cornerRadius: 10,
      boxPadding: 4,
      titleFont: { weight: 600 as const },
    };

    instances.current.forEach((c) => c.destroy());
    instances.current = [];

    if (chartHoraRef.current) {
      const ctx = chartHoraRef.current.getContext('2d');
      const gradient = ctx?.createLinearGradient(0, 0, 0, 190);
      gradient?.addColorStop(0, 'rgba(98, 203, 49, 0.22)');
      gradient?.addColorStop(1, 'rgba(98, 203, 49, 0)');

      instances.current.push(
        new Chart(chartHoraRef.current, {
          type: 'line',
          data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            datasets: [
              {
                data: [0, 0, 0, 0, 0, 80000, 120000, 85000, 60000, 20000, 5000, 0],
                borderColor: '#4aad21',
                backgroundColor: gradient ?? 'rgba(98,203,49,0.08)',
                borderWidth: 2,
                tension: 0.35,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#4aad21',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: tooltipStyle,
            },
            scales: {
              x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0 } },
              y: {
                grid: { color: CHART_GRID },
                border: { display: false },
                ticks: {
                  callback: (value) => `$${Number(value) / 1000}k`,
                },
              },
            },
          },
        })
      );
    }

    if (chartDiaRef.current) {
      instances.current.push(
        new Chart(chartDiaRef.current, {
          type: 'bar',
          data: {
            labels: ['Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Ayer', 'Hoy'],
            datasets: [
              {
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#62cb31',
                hoverBackgroundColor: '#4aad21',
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
              tooltip: tooltipStyle,
            },
            scales: {
              x: { grid: { display: false }, border: { display: false } },
              y: {
                grid: { color: CHART_GRID },
                border: { display: false },
                ticks: { callback: (value) => `$${Number(value) / 1000}k` },
              },
            },
          },
        })
      );
    }

    return () => instances.current.forEach((c) => c.destroy());
  }, []);

  return (
    <div>
      <PageHeader
        title="Resumen"
        description="Sábado, 22 de agosto de 2026"
        actions={
          <>
            <Button variant="outline">
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Link href="/ventas/nueva">
              <Button>
                <Plus className="h-4 w-4" /> Nueva venta
              </Button>
            </Link>
          </>
        }
      />

      {/* KPIs */}
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

            <Card>
              <CardHeader>
                <CardTitle>Ventas por método de pago</CardTitle>
                <p className="text-xs text-slate-400">Hoy</p>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-slate-100">
                  {PAYMENTS.map((m) => (
                    <li key={m.label} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      <span className="flex-1 text-[13px] font-medium text-slate-600">{m.label}</span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${m.soft}`}>
                        0%
                      </span>
                      <span className="w-20 text-right text-[13px] font-semibold tabular-nums text-slate-800">
                        {m.value}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total</span>
                  <span className="text-lg font-bold tabular-nums text-slate-900">$ 0</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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

            <Card>
              <CardHeader>
                <CardTitle>Meta del día</CardTitle>
                <p className="text-xs text-slate-400">Objetivo configurado</p>
              </CardHeader>
              <CardContent className="flex h-[148px] flex-col justify-center">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold tracking-tight text-slate-900">$ 0</span>
                  <span className="text-sm font-medium text-slate-400">de $ 500.000</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500" />
                </div>
                <p className="mt-3 text-[13px] text-slate-400">
                  Aún no registras ventas hoy. ¡El día apenas comienza!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Aside onboarding */}
        <aside className="w-full shrink-0 xl:w-[300px]">
          <Card className="sticky top-24">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Primeros pasos</CardTitle>
              <Link href="#" className="text-brand-600 hover:text-brand-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Progreso</span>
                <span className="font-bold text-slate-700">0 / 7 completado</span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-0 rounded-full bg-brand-500 transition-all duration-500" />
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
