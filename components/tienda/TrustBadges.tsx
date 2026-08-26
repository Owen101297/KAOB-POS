'use client';

import React from 'react';
import { Layers, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { AddiLogo, SistecreditoLogo, NequiLogo, BancolombiaLogo, PlanSepareLogo } from './PaymentMethodsBadges';

export default function TrustBadges() {
  return (
    <section className="w-full bg-[#FFFFFF] border-b border-zinc-200/80">
      <div className="max-w-[1520px] mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80">
        
        {/* Columna 1: Premium Fabrics */}
        <div className="flex items-center gap-4 px-6 sm:px-10 py-6 sm:py-8 group hover:bg-zinc-50/60 transition-colors">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200/80 group-hover:bg-black group-hover:text-white transition-colors duration-300">
            <Layers className="w-5 h-5 text-zinc-900 group-hover:text-white transition-colors" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold tracking-[0.15em] text-zinc-950 uppercase mb-1">
              Premium Fabrics
            </h3>
            <p className="text-xs text-zinc-500 font-light leading-snug">
              Algodón pesado 100% (240+ GSM), tejido preencogido y suavizado al tacto.
            </p>
          </div>
        </div>

        {/* Columna 2: Timeless Design */}
        <div className="flex items-center gap-4 px-6 sm:px-10 py-6 sm:py-8 group hover:bg-zinc-50/60 transition-colors">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200/80 group-hover:bg-black group-hover:text-white transition-colors duration-300">
            <Sparkles className="w-5 h-5 text-zinc-900 group-hover:text-white transition-colors" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold tracking-[0.15em] text-zinc-950 uppercase mb-1">
              Timeless Design
            </h3>
            <p className="text-xs text-zinc-500 font-light leading-snug">
              Siluetas boxy y cortes contemporáneos que trascienden las tendencias pasajeras.
            </p>
          </div>
        </div>

        {/* Columna 3: Financiación & Envíos */}
        <div className="flex flex-col justify-center px-6 sm:px-10 py-6 sm:py-8 group hover:bg-zinc-50/60 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200/80">
              <Truck className="w-4 h-4 text-zinc-900" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold tracking-[0.15em] text-zinc-950 uppercase">
                Envíos & Financiación
              </h3>
              <p className="text-[11px] text-zinc-500 font-light">
                Cobertura nacional y múltiples medios de pago:
              </p>
            </div>
          </div>
          
          {/* Tira de SVGs de Pago */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 pl-11">
            <AddiLogo className="h-4 w-auto rounded shadow-2xs" />
            <SistecreditoLogo className="h-4 w-auto rounded shadow-2xs" />
            <NequiLogo className="h-4 w-auto rounded shadow-2xs" />
            <BancolombiaLogo className="h-4 w-auto rounded shadow-2xs" />
            <PlanSepareLogo className="h-4 w-auto rounded shadow-2xs" />
          </div>
        </div>

      </div>
    </section>
  );
}
