'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registrarLeadTienda } from '@/lib/actions/tienda';

interface Props {
  totalItemsEnBolsa: number;
  resumenCarrito?: string;
}

const CUPON = 'KAOB10';
const DESCUENTO_PCT = 10;

export default function ExitIntentModal({ totalItemsEnBolsa, resumenCarrito }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    let yaMostrado = false;
    try {
      yaMostrado = sessionStorage.getItem('kaob_exit_shown') === '1';
    } catch {
      // ignorar
    }
    if (yaMostrado) return;

    let habilitado = false;
    const habilitar = setTimeout(() => {
      habilitado = true;
    }, 8000);

    const onMouseLeave = (e: MouseEvent) => {
      if (!habilitado || yaMostrado) return;
      if (e.clientY <= 0) {
        yaMostrado = true;
        setAbierto(true);
        try {
          sessionStorage.setItem('kaob_exit_shown', '1');
        } catch {
          // ignorar
        }
      }
    };

    document.addEventListener('mouseleave', onMouseLeave);
    return () => {
      clearTimeout(habilitar);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefono.trim() && !email.trim()) return;
    setEnviando(true);
    try {
      await registrarLeadTienda({
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        origen: 'EXIT_INTENT',
        cuponOfrecido: CUPON,
        descuentoPct: DESCUENTO_PCT,
        carritoResumen: resumenCarrito || undefined,
      });
    } catch {
      // el cupón se muestra igual; el asesor puede validar manualmente por WhatsApp
    }
    setEnviando(false);
    setEnviado(true);
  };

  return (
    <div className="fixed inset-0 z-[1700] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-zinc-500 hover:bg-black/10"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-zinc-950 text-white p-6 text-center space-y-1.5">
          <Sparkles className="h-6 w-6 mx-auto text-amber-400" />
          <h3 className="text-lg font-black uppercase tracking-tight">¡Espera! No te vayas sin tu descuento</h3>
          <p className="text-xs text-zinc-400">
            {totalItemsEnBolsa > 0
              ? 'Tienes prendas en tu bolsa. Llévate un 10% extra en tu primera compra.'
              : 'Déjanos tus datos y llévate un 10% extra en tu primera compra.'}
          </p>
        </div>

        <div className="p-6">
          {enviado ? (
            <div className="text-center space-y-3 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-zinc-900">¡Cupón asegurado!</p>
              <div className="inline-block px-4 py-2 rounded-xl bg-zinc-900 text-white font-mono font-black tracking-widest text-sm">
                {CUPON}
              </div>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                Menciona este código al finalizar tu pedido por WhatsApp y te aplicamos el {DESCUENTO_PCT}% de descuento.
              </p>
              <Button variant="outline" onClick={() => setAbierto(false)} className="mt-2 text-xs font-bold rounded-full">
                Seguir comprando
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">WhatsApp</label>
                <Input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 310 123 4567"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Correo (opcional)</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="text-xs"
                />
              </div>
              <Button
                type="submit"
                disabled={enviando || (!telefono.trim() && !email.trim())}
                className="w-full py-5 rounded-2xl bg-black text-white hover:bg-zinc-800 font-bold uppercase tracking-widest text-xs"
              >
                {enviando ? 'Enviando...' : `Reclamar ${DESCUENTO_PCT}% de descuento`}
              </Button>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="w-full text-center text-[11px] text-zinc-400 hover:text-zinc-600"
              >
                No, gracias, prefiero pagar el precio completo
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
