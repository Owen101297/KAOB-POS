'use client';

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

interface Promocion {
  nombre: string;
  tipo: string;
  valor: number;
  fechaFin: Date | string;
}

interface Props {
  promocion: Promocion | null;
}

function tiempoRestante(fechaFin: Date | string) {
  const diff = new Date(fechaFin).getTime() - Date.now();
  if (diff <= 0) return null;
  const horas = Math.floor(diff / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diff % (1000 * 60)) / 1000);
  return { horas, minutos, segundos };
}

export default function OfertaFlashBanner({ promocion }: Props) {
  const [restante, setRestante] = useState(() => (promocion ? tiempoRestante(promocion.fechaFin) : null));

  useEffect(() => {
    if (!promocion) return;
    const id = setInterval(() => setRestante(tiempoRestante(promocion.fechaFin)), 1000);
    return () => clearInterval(id);
  }, [promocion]);

  if (!promocion || !restante) return null;

  const valorTexto = promocion.tipo === 'PORCENTAJE' ? `${promocion.valor}% OFF` : `${promocion.valor.toLocaleString('es-CO')} COP OFF`;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 text-white py-1.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 flex-wrap">
      <Flame className="h-3.5 w-3.5 shrink-0" />
      <span>
        Oferta flash: {promocion.nombre} · {valorTexto}
      </span>
      <span className="font-mono bg-black/25 px-2 py-0.5 rounded">
        {pad(restante.horas)}:{pad(restante.minutos)}:{pad(restante.segundos)}
      </span>
    </div>
  );
}
