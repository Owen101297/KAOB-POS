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
      colorBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icono: Sparkles,
      bgGrad: 'from-zinc-900 via-neutral-900 to-stone-900',
      iconoBg: 'bg-rose-500/10 text-rose-400',
      colSpan: 'md:col-span-2 lg:col-span-2',
      generoKey: 'DAMA',
    },
    {
      id: 'CABALLERO',
      nombre: 'Colección Caballero',
      tagline: 'Oversize, hoodies & streetwear de alto gramaje',
      badge: 'Lo Más Vendido',
      colorBadge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      icono: User,
      bgGrad: 'from-zinc-900 via-slate-900 to-zinc-950',
      iconoBg: 'bg-sky-500/10 text-sky-400',
      colSpan: 'md:col-span-1 lg:col-span-1',
      generoKey: 'CABALLERO',
    },
    {
      id: 'UNISEX',
      nombre: 'Línea Unisex & Urban',
      tagline: 'Prendas neutras, cortes boxy y esenciales',
      badge: 'Esenciales',
      colorBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icono: Users,
      bgGrad: 'from-zinc-900 via-stone-900 to-neutral-950',
      iconoBg: 'bg-emerald-500/10 text-emerald-400',
      colSpan: 'md:col-span-1 lg:col-span-1',
      generoKey: 'UNISEX',
    },
    {
      id: 'ACCESORIOS',
      nombre: 'Accesorios & Gorras',
      tagline: 'Caps estructuradas, morrales y complementos',
      badge: 'Complementos',
      colorBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icono: Gem,
      bgGrad: 'from-zinc-900 via-zinc-950 to-black',
      iconoBg: 'bg-amber-500/10 text-amber-400',
      colSpan: 'md:col-span-2 lg:col-span-2',
      generoKey: 'ACCESORIOS',
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-black text-white border-b border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera de la sección */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
              Explora por Colección
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
              ESTILOS SEGÚN TU PREFERENCIA
            </h2>
          </div>
          {generoSeleccionado && (
            <button
              type="button"
              onClick={() => onSeleccionarGenero(null)}
              className="text-xs font-semibold text-zinc-400 hover:text-white underline"
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
                className={`group relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${col.bgGrad} border cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[220px] ${col.colSpan} ${
                  esActivo
                    ? 'border-white ring-2 ring-white/50 scale-[1.01] shadow-2xl'
                    : 'border-zinc-800 hover:border-zinc-600 hover:shadow-xl'
                }`}
              >
                {/* Isotipo sutil en marca de agua */}
                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                  <img src="/brand/isotype.svg" alt="" className="w-44 h-44 object-contain" />
                </div>

                {/* Superior: Icono y Badge */}
                <div className="flex items-center justify-between relative z-10">
                  <div className={`p-3 rounded-2xl ${col.iconoBg} backdrop-blur`}>
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
                      <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white group-hover:text-zinc-100">
                        {col.nombre}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 max-w-sm leading-relaxed">
                        {col.tagline}
                      </p>
                    </div>

                    <div className="h-10 w-10 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-all duration-300 shrink-0 ml-3">
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
