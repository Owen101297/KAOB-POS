'use client';

import React, { useState } from 'react';
import { Mail, Check, Sparkles, ArrowRight } from 'lucide-react';
import { registrarLeadTienda } from '@/lib/actions/tienda';

export default function NewsletterForm() {
  const [contacto, setContacto] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contacto.trim() || cargando) return;

    setCargando(true);
    try {
      const esEmail = contacto.includes('@');
      await registrarLeadTienda({
        email: esEmail ? contacto.trim() : undefined,
        telefono: !esEmail ? contacto.trim() : undefined,
        origen: 'NEWSLETTER',
        cuponOfrecido: 'KΛOB-WELCOME10',
        descuentoPct: 10,
      });
      setEnviado(true);
    } catch (err) {
      console.error('Error registrando lead:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="w-full bg-[#0A0A0A] text-white py-14 sm:py-16 border-b border-zinc-800">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
          
          {/* Texto Persuasivo */}
          <div className="text-center lg:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>CÍRCULO KΛOB</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-light tracking-tight text-white mb-2">
              Acceso Anticipado & 10% OFF
            </h3>
            <p className="text-xs text-zinc-400 font-light leading-relaxed max-w-md">
              Suscríbete para recibir noticias de nuevos drops limitados, reposición de inventario y un 10% de descuento en tu primer pedido.
            </p>
          </div>

          {/* Formulario de Captura */}
          <div className="w-full sm:w-auto min-w-[320px] sm:min-w-[420px]">
            {enviado ? (
              <div className="p-4 bg-zinc-900 border border-zinc-700 text-center flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                  ¡BIENVENIDO! USA EL CUPÓN: KΛOB-WELCOME10
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="WhatsApp o Correo electrónico"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-white focus:outline-none text-white pl-10 pr-4 py-3.5 text-xs placeholder:text-zinc-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={cargando}
                  className="bg-white hover:bg-zinc-200 text-black px-6 py-3.5 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-1 shrink-0 disabled:opacity-50"
                >
                  <span>{cargando ? '...' : 'SUBSCRIBE'}</span>
                  {!cargando && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
