'use client';

import React, { useState } from 'react';
import { ArrowRight, BookOpen, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

interface Articulo {
  id: string;
  tag: string;
  titulo: string;
  extracto: string;
  fecha: string;
  tiempoLectura: string;
  imagen: string;
  contenido: string[];
}

const ARTICULOS: Articulo[] = [
  {
    id: 'style-guide-oversize',
    tag: 'STYLE GUIDE',
    titulo: 'El arte de vestir siluetas oversize y proporciones boxy',
    extracto: 'Cómo equilibrar volumen, caída y longitud para lograr un look contemporáneo y pulido.',
    fecha: 'Agosto 2026',
    tiempoLectura: '4 min de lectura',
    imagen: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800',
    contenido: [
      'El corte oversize contemporáneo no es simplemente usar una talla más grande; es una arquitectura de patrones diseñada con hombros caídos deliberados, caja amplia en el torso y longitud recortada para evitar siluetas desproporcionadas.',
      'Al construir un atuendo con nuestras camisetas heavyweight 240 GSM, la clave reside en el contraste: combina la parte superior holgada con pantalones de corte recto o cargo estructurados.',
      'Los tonos monocromáticos (grafito, tiza, negro azabache) potencian la sensación de volumen limpio y sofisticación urbana.',
    ],
  },
  {
    id: 'streetwear-culture',
    tag: 'CULTURE',
    titulo: 'Streetwear contemporáneo: del underground a la alta costura',
    extracto: 'La evolución de la moda urbana hacia el lujo atemporal y el valor del gramaje pesado.',
    fecha: 'Agosto 2026',
    tiempoLectura: '5 min de lectura',
    imagen: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&q=80&w=800',
    contenido: [
      'La moda urbana ha trascendido los gráficos recargados para centrarse en lo fundamental: el tacto, la textura y la permanencia.',
      'En KΛOB MODERN WEAR entendemos el streetwear como un lienzo arquitectónico donde la ausencia de excesos permite que la calidad de la confección hable por sí misma.',
      'Nuestras colecciones son concebidas bajo tirajes limitados que garantizan exclusividad y un proceso de producción ético y nacional.',
    ],
  },
  {
    id: 'care-tips-heavyweight',
    tag: 'CARE TIPS',
    titulo: 'Cómo lavar y conservar tus prendas heavyweight 240+ GSM',
    extracto: 'Guía esencial del atelier para prolongar la densidad del tejido y la solidez del color.',
    fecha: 'Agosto 2026',
    tiempoLectura: '3 min de lectura',
    imagen: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800',
    contenido: [
      '1. Lava siempre al revés con agua fría (máx. 30°C) para proteger la fibra natural del algodón.',
      '2. Evita el uso de secadoras automáticas; el secado al aire libre en plano conserva la estructura del cuello acanalado y evita el encogimiento.',
      '3. Plancha a temperatura media por el reverso. El algodón de alto gramaje recuperará su caída firme natural tras el primer uso.',
    ],
  },
];

export default function JournalSection() {
  const [articuloActivo, setArticuloActivo] = useState<Articulo | null>(null);

  return (
    <section className="w-full py-16 sm:py-24 bg-white border-b border-zinc-200/80">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8">
        
        {/* Encabezado Centrado */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-400 uppercase block mb-2">
            KΛOB JOURNAL
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-zinc-950 uppercase">
            Style. Culture. Timeless.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-light mt-2">
            Crónicas sobre confección, cuidado textil y la estética del streetwear de autor.
          </p>
        </div>

        {/* Grid de 3 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {ARTICULOS.map((art) => (
            <article
              key={art.id}
              onClick={() => setArticuloActivo(art)}
              className="group flex flex-col justify-between bg-zinc-50/50 border border-zinc-200/80 overflow-hidden hover:border-black transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-lg"
            >
              {/* Imagen con Ratio 16:10 */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                <img
                  src={art.imagen}
                  alt={art.titulo}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3 left-3 bg-black text-white px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase">
                  {art.tag}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 uppercase mb-2">
                    <span>{art.fecha}</span>
                    <span>•</span>
                    <span>{art.tiempoLectura}</span>
                  </div>

                  <h3 className="font-serif text-lg sm:text-xl font-normal text-zinc-950 leading-snug group-hover:text-black mb-3">
                    {art.titulo}
                  </h3>

                  <p className="text-xs text-zinc-600 font-light leading-relaxed line-clamp-2">
                    {art.extracto}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200/80 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-950 group-hover:text-black">
                  <span>READ MORE</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>

      {/* Modal de Lectura Completa */}
      {articuloActivo && (
        <Dialog open={!!articuloActivo} onOpenChange={(open) => !open && setArticuloActivo(null)}>
          <DialogContent className="max-w-2xl bg-white border border-zinc-200 text-zinc-950 p-0 overflow-hidden">
            <div className="relative aspect-[16/9] w-full bg-zinc-900">
              <img
                src={articuloActivo.imagen}
                alt={articuloActivo.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="bg-white text-black px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase inline-block mb-2">
                  {articuloActivo.tag}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-light leading-tight">
                  {articuloActivo.titulo}
                </h3>
              </div>
            </div>

            <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-4 text-xs sm:text-sm text-zinc-700 leading-relaxed font-light">
              <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 pb-2 border-b border-zinc-100">
                <span>PUBLICADO: {articuloActivo.fecha}</span>
                <span>•</span>
                <span>{articuloActivo.tiempoLectura}</span>
              </div>

              {articuloActivo.contenido.map((parrafo, idx) => (
                <p key={idx}>{parrafo}</p>
              ))}

              <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  KΛOB MODERN WEAR // ATELIER NOTES
                </span>
                <button
                  type="button"
                  onClick={() => setArticuloActivo(null)}
                  className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
