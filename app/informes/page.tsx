'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Landmark,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

interface ReportCard {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}

const GROUPS: { label: string; reports: ReportCard[] }[] = [
  {
    label: 'Ventas',
    reports: [
      { title: 'Ventas por período', description: 'Comparativo por día, semana, mes o año.', icon: TrendingUp, tone: 'bg-brand-50 text-brand-600' },
      { title: 'Productos más vendidos', description: 'Ranking de productos por unidades e ingresos.', icon: BarChart3, tone: 'bg-violet-50 text-violet-600' },
      { title: 'Ventas por vendedor', description: 'Desempeño individual del equipo comercial.', icon: ClipboardList, tone: 'bg-sky-50 text-sky-600' },
    ],
  },
  {
    label: 'Inventario',
    reports: [
      { title: 'Valorización de inventario', description: 'Costo total y utilidad estimada del stock.', icon: Boxes, tone: 'bg-amber-50 text-amber-600' },
      { title: 'Movimientos', description: 'Entradas, salidas y ajustes por referencia.', icon: FileText, tone: 'bg-slate-100 text-slate-500' },
    ],
  },
  {
    label: 'Finanzas',
    reports: [
      { title: 'Flujo de caja', description: 'Ingresos y egresos consolidados del negocio.', icon: Landmark, tone: 'bg-emerald-50 text-emerald-600' },
      { title: 'Estado de cuentas bancarias', description: 'Saldos y conciliaciones por cuenta.', icon: FileSpreadsheet, tone: 'bg-indigo-50 text-indigo-600' },
      { title: 'Facturación electrónica', description: 'Documentos emitidos y su estado DIAN.', icon: Receipt, tone: 'bg-rose-50 text-rose-600' },
    ],
  },
];

export default function InformesPage() {
  return (
    <div>
      <PageHeader
        title="Informes"
        description="Analiza el comportamiento de tu negocio con reportes listos para exportar."
        actions={
          <button className="btn btn-default">
            <FileSpreadsheet className="h-4 w-4" /> Exportar todo
          </button>
        }
      />

      <div className="space-y-8">
        {GROUPS.map((group) => (
          <section key={group.label}>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {group.label}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.reports.map((r) => (
                <Link
                  key={r.title}
                  href="#"
                  className="group flex items-start gap-4 rounded-xl border border-slate-200/70 bg-white p-5 shadow-card outline-none transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-brand-500/40"
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl [&_svg]:h-5 [&_svg]:w-5 ${r.tone}`}>
                    <r.icon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-sm font-semibold text-slate-800 group-hover:text-brand-700">
                      {r.title}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-slate-400">
                      {r.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
