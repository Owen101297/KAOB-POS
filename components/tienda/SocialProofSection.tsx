'use client';

import { Star, ShieldCheck, Truck, Sparkles, MessageCircle, CheckCircle } from 'lucide-react';

export default function SocialProofSection() {
  const testimonios = [
    {
      nombre: 'Valeria R.',
      ciudad: 'Medellín',
      prenda: 'Camiseta Oversize Heavyweight',
      estrellas: 5,
      comentario: 'La tela es increíble, gruesa y con una caída perfecta. Llegó al día siguiente de pedirla por WhatsApp.',
    },
    {
      nombre: 'Juan Pablo M.',
      ciudad: 'Bogotá',
      prenda: 'Hoodie Boxy Fit Fleece',
      estrellas: 5,
      comentario: 'Excelente confección y el fit es exactamente lo que buscaba. Compraré más prendas de la colección.',
    },
    {
      nombre: 'Camila S.',
      ciudad: 'Cali',
      prenda: 'Conjunto Casual Modern',
      estrellas: 5,
      comentario: 'Atención 10/10 por WhatsApp. Me ayudaron a elegir la talla correcta y me quedó espectacular.',
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-zinc-950 text-white border-t border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold uppercase tracking-widest mb-3">
            <Star className="h-3 w-3 fill-amber-400" />
            <span>Opiniones Reales de Clientes</span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Experiencias KAOB
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            Más de 1.000 clientes satisfechos en toda Colombia disfrutan de nuestras prendas y servicio.
          </p>
        </div>

        {/* Rejilla de Reseñas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {testimonios.map((t, idx) => (
            <div
              key={idx}
              className="rounded-3xl bg-zinc-900/80 border border-zinc-800 p-6 sm:p-7 flex flex-col justify-between shadow-lg hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-3">
                {/* Estrellas */}
                <div className="flex items-center gap-1">
                  {[...Array(t.estrellas)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Comentario */}
                <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed font-normal">
                  "{t.comentario}"
                </p>
              </div>

              {/* Autor y Prenda */}
              <div className="pt-5 mt-5 border-t border-zinc-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    {t.nombre}
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 inline" />
                  </p>
                  <p className="text-[11px] text-zinc-500">{t.ciudad} · Cliente verificado</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                  {t.prenda}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pilares de Confianza y Garantía */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-10 border-t border-zinc-900">
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <Truck className="h-6 w-6 text-brand-400 mb-2" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Envíos Rápidos</h4>
            <p className="text-[11px] text-zinc-400 mt-1">Cobertura en toda Colombia</p>
          </div>

          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <ShieldCheck className="h-6 w-6 text-emerald-400 mb-2" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Garantía de Talla</h4>
            <p className="text-[11px] text-zinc-400 mt-1">Cambios fáciles y rápidos</p>
          </div>

          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <Sparkles className="h-6 w-6 text-amber-400 mb-2" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Calidad Premium</h4>
            <p className="text-[11px] text-zinc-400 mt-1">Textiles de alta durabilidad</p>
          </div>

          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <MessageCircle className="h-6 w-6 text-sky-400 mb-2" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Atención 24/7</h4>
            <p className="text-[11px] text-zinc-400 mt-1">Asesoría directa en WhatsApp</p>
          </div>
        </div>

      </div>
    </section>
  );
}
