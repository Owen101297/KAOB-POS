'use client';

import { ArrowUpRight, Sparkles, User, Users, Gem } from 'lucide-react';

interface Props {
  onSeleccionarGenero: (genero: string | null) => void;
  generoSeleccionado: string | null;
}

export default function CategoryGridBento({
  onSeleccionarGenero,
  generoSeleccionado,
}: Props) {
  const colecciones = [
    {
      id: 'DAMA',
      nombre: 'Colección Dama',
      tagline: 'Elegancia casual & prendas contemporáneas',
      badge: 'Tendencia 2026',
      colorBadge: 'bg-rose-50 text-rose-600 border-rose-200',
      icono: Sparkles,
      iconoBg: 'bg-rose-50 text-rose-500',
      colSpan: 'md:col-span-2 lg:col-span-2',
      generoKey: 'DAMA',
    },
    {
      id: 'CABALLERO',
      nombre: 'Colección Caballero',
      tagline: 'Oversize, hoodies & streetwear de alto gramaje',
      badge: 'Lo Más Vendido',
      colorBadge: 'bg-sky-50 text-sky-600 border-sky-200',
      icono: User,
      iconoBg: 'bg-sky-50 text-sky-500',
      colSpan: 'md:col-span-1 lg:col-span-1',
      generoKey: 'CABALLERO',
    },
    {
      id: 'UNISEX',
      nombre: 'Línea Unisex & Urban',
      tagline: 'Prendas neutras, cortes boxy y esenciales',
      badge: 'Esenciales',
      colorBadge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      icono: Users,
      iconoBg: 'bg-emerald-50 text-emerald-500',
      colSpan: 'md:col-span-1 lg:col-span-1',
      generoKey: 'UNISEX',
    },
    {
      id: 'ACCESORIOS',
      nombre: 'Accesorios & Gorras',
      tagline: 'Caps estructuradas, morrales y complementos',
      badge: 'Complementos',
      colorBadge: 'bg-amber-50 text-amber-600 border-amber-200',
      icono: Gem,
      iconoBg: 'bg-amber-50 text-amber-500',
      colSpan: 'md:col-span-2 lg:col-span-2',
      generoKey: 'ACCESORIOS',
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-[#F8F5F0] border-b border-zinc-300/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera de la sección */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              Explora por Colección
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mt-1">
              Estilos según tu preferencia
            </h2>
          </div>
          {generoSeleccionado && (
            <button
              type="button"
              onClick={() => onSeleccionarGenero(null)}
              className="text-xs font-semibold text-zinc-500 hover:text-black underline"
            >
              Ver todas las colecciones
            </button>
          )}
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {colecciones.map((col) => {
            const Icono = col.icono;
            const esActivo = generoSeleccionado === col.generoKey;

            return (
              <div
                key={col.id}
                onClick={() => {
                  onSeleccionarGenero(esActivo ? null : col.generoKey);
                  const el = document.getElementById('catalogo-prendas');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`group relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white border cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[220px] ${col.colSpan} ${
                  esActivo
                    ? 'border-black ring-2 ring-black/10 scale-[1.01] shadow-xl'
                    : 'border-zinc-200 hover:border-zinc-300 hover:shadow-lg'
                }`}
              >
                {/* Isotipo sutil en marca de agua */}
                <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-500 pointer-events-none">
                  <img src="/brand/isotype.svg" alt="" className="w-44 h-44 object-contain" />
                </div>

                {/* Superior: Icono y Badge */}
                <div className="flex items-center justify-between relative z-10">
                  <div className={`p-3 rounded-2xl ${col.iconoBg}`}>
                    <Icono className="h-6 w-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${col.colorBadge}`}>
                    {col.badge}
                  </span>
                </div>

                {/* Inferior: Título, Tagline y Flecha */}
                <div className="relative z-10 pt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                        {col.nombre}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 max-w-sm leading-relaxed">
                        {col.tagline}
                      </p>
                    </div>

                    <div className="h-10 w-10 rounded-full bg-zinc-100 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all duration-300 shrink-0 ml-3">
                      <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
