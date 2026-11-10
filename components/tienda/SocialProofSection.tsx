'use client';

import { motion } from 'framer-motion';
import { Star, ShieldCheck, Truck, Sparkles, MessageCircle, CheckCircle } from 'lucide-react';
import { fadeUp, viewportOnce } from '@/components/tienda/motion';

/**
 * Prueba social editorial (002b): testimonios como citas serif, credenciales
 * con métodos de pago y garantías en papel hueso. Textos intactos (sub-002).
 */
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

  const pilares = [
    { icono: Truck, titulo: 'Envíos Rápidos', detalle: 'Cobertura en toda Colombia' },
    { icono: ShieldCheck, titulo: 'Garantía de Talla', detalle: 'Cambios fáciles y rápidos' },
    { icono: Sparkles, titulo: 'Calidad Premium', detalle: 'Textiles de alta durabilidad' },
    { icono: MessageCircle, titulo: 'Atención 24/7', detalle: 'Asesoría directa en WhatsApp' },
  ];

  return (
    <section className="py-16 md:py-20 bg-bone-50 border-b border-ink/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Encabezado */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-bronze/40 text-bronze-dark text-[10px] font-bold uppercase tracking-[0.22em] mb-3">
            <Star className="h-3 w-3 fill-bronze text-bronze" />
            <span>Opiniones reales de clientes</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl tracking-tight text-ink">
            Lo que dicen quienes ya estrenan
          </h2>
          <p className="text-xs sm:text-sm text-ink-400 mt-2">
            Clientes por toda Colombia confían en nuestras prendas y servicio.
          </p>
        </motion.div>

        {/* Reseñas en cita editorial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {testimonios.map((t, idx) => (
            <motion.blockquote
              key={idx}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              transition={{ delay: idx * 0.08 }}
              className="rounded-3xl bg-bone-100 border border-ink/10 p-6 sm:p-7 flex flex-col justify-between hover:shadow-lg transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[...Array(t.estrellas)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-bronze text-bronze" />
                  ))}
                </div>
                <p className="font-display italic text-[15px] text-ink leading-relaxed">
                  “{t.comentario}”
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-ink/10 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                    {t.nombre}
                    <CheckCircle className="h-3.5 w-3.5 text-ink-400 inline" />
                  </p>
                  <p className="text-[11px] text-ink-400">{t.ciudad} · Cliente verificado</p>
                </div>
                <span className="text-[9px] font-mono text-ink-400 bg-bone-50 border border-ink/10 px-2 py-0.5 rounded text-right max-w-[45%]">
                  {t.prenda}
                </span>
              </div>
            </motion.blockquote>
          ))}
        </div>

        {/* Métodos de pago online (spec 002, US1/US3) */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mb-14 rounded-3xl border border-ink/10 bg-bone-100 p-6 sm:p-7"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-bronze-dark">
                Paga como quieras, sin filas
              </p>
              <p className="text-[11px] text-ink-400 mt-1">
                Checkout 100% en línea con confirmación inmediata de tu pedido.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Wompi · Tarjeta/PSE', 'Bold', 'Addi', 'Sistecrédito', 'Contraentrega', 'Fiado'].map((m) => (
                <span
                  key={m}
                  className="px-3 py-1.5 rounded-full bg-bone-50 border border-ink/10 text-[10px] font-bold uppercase tracking-wide text-ink-600"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pilares */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 pt-10 border-t border-ink/10">
          {pilares.map((p, i) => {
            const Icono = p.icono;
            return (
              <motion.div
                key={p.titulo}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center text-center p-4"
              >
                <Icono className="h-5 w-5 text-bronze mb-2" strokeWidth={1.5} />
                <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink">{p.titulo}</h4>
                <p className="text-[11px] text-ink-400 mt-1">{p.detalle}</p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
