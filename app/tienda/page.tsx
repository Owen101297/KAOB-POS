'use client';

import {
  CreditCard,
  ExternalLink,
  Globe,
  Package,
  Palette,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

const SETTINGS = [
  { title: 'Dominio de la tienda', detail: 'mitienda.vendty.com · Verificado', icon: Globe, tone: 'bg-sky-50 text-sky-600' },
  { title: 'Catálogo publicado', detail: '0 productos visibles en la vitrina', icon: Package, tone: 'bg-brand-50 text-brand-600' },
  { title: 'Medios de pago', detail: 'Pasarela no configurada', icon: CreditCard, tone: 'bg-violet-50 text-violet-600' },
  { title: 'Envíos y domicilios', detail: 'Zonas de cobertura sin definir', icon: Truck, tone: 'bg-amber-50 text-amber-600' },
];

export default function TiendaVirtualPage() {
  return (
    <div>
      <PageHeader
        title="Tienda virtual"
        description="Publica tu catálogo y vende en línea las 24 horas."
        actions={
          <>
            <Button variant="outline">
              <Palette className="h-4 w-4" /> Personalizar
            </Button>
            <Button>
              <ExternalLink className="h-4 w-4" /> Ver tienda
            </Button>
          </>
        }
      />

      {/* Estado */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-gradient-to-r from-slate-900 to-slate-800 p-5 shadow-card">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Globe className="h-6 w-6 text-brand-400" />
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white">Tu tienda está despublicada</h2>
              <Badge variant="warning">Inactiva</Badge>
            </div>
            <p className="mt-0.5 text-[13px] text-slate-300">
              Completa la configuración para que tus clientes puedan comprar en línea.
            </p>
          </div>
        </div>
        <Button variant="primary" size="lg" className="shadow-lg">
          Publicar tienda
        </Button>
      </div>

      {/* Configuración */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SETTINGS.map((s) => (
          <button
            key={s.title}
            type="button"
            className="group flex flex-col items-start gap-3 rounded-xl border border-slate-200/70 bg-white p-5 text-left shadow-card outline-none transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl [&_svg]:h-5 [&_svg]:w-5 ${s.tone}`}>
              <s.icon />
            </span>
            <span className="text-sm font-semibold text-slate-800 group-hover:text-brand-700">{s.title}</span>
            <span className="text-xs leading-relaxed text-slate-400">{s.detail}</span>
            <Badge variant={s.detail.includes('no configurada') || s.detail.includes('sin') || s.detail.startsWith('0 ') ? 'danger' : 'success'} className="mt-auto">
              {s.detail.includes('no configurada') || s.detail.includes('sin') || s.detail.startsWith('0 ')
                ? 'Requiere atención'
                : 'Configurado'}
            </Badge>
          </button>
        ))}
      </div>

      {/* Enlace público */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Comparte tu tienda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-slate-50 px-4 py-2.5 font-mono text-[13px] text-slate-600 ring-1 ring-inset ring-slate-200/70">
              https://mitienda.vendty.com
            </code>
            <Button variant="secondary">Copiar enlace</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
