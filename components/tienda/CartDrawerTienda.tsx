'use client';

import { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Phone, Send, CheckCircle2, CreditCard, Landmark, Smartphone, Wallet } from 'lucide-react';
import { formatoCOP } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import FinanciacionCalculadora, { type MetodoFinanciacion } from './FinanciacionCalculadora';
import { crearPedidoOnline } from '@/lib/actions/tienda';

export interface ItemBolsa {
  varianteId: number;
  productoId: number;
  nombre: string;
  referencia: string;
  colorNombre: string;
  colorHex: string | null;
  tallaValor: string;
  precio: number;
  cantidad: number;
  stockDisponible: number;
}

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  items: ItemBolsa[];
  onActualizarCantidad: (varianteId: number, delta: number) => void;
  onEliminarItem: (varianteId: number) => void;
  onVaciarBolsa: () => void;
  telefonoWhatsAppTienda?: string;
}

export default function CartDrawerTienda({
  abierto,
  onCerrar,
  items,
  onActualizarCantidad,
  onEliminarItem,
  onVaciarBolsa,
  telefonoWhatsAppTienda = '573000000000',
}: Props) {
  const [paso, setPaso] = useState<'carrito' | 'datos'>('carrito');
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'CONTADO' | MetodoFinanciacion>('CONTADO');
  const [mostrarFinanciacion, setMostrarFinanciacion] = useState(false);

  if (!abierto) return null;

  const total = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const totalPrendas = items.reduce((acc, it) => acc + it.cantidad, 0);

  const METODO_PAGO_LABEL: Record<string, string> = {
    CONTADO: 'Pago de contado (efectivo/transferencia/tarjeta)',
    PLAN_SEPARE: 'Plan Separe',
    ADDI: 'Addi',
    SISTECREDITO: 'Sistecrédito',
  };

  const generarMensajeWhatsApp = () => {
    let msg = `🛒 *NUEVO PEDIDO - KAOB MODERN WEAR*\n`;
    msg += `--------------------------------------\n`;
    msg += `👤 *Cliente:* ${nombre.trim()}\n`;
    msg += `📱 *WhatsApp:* ${celular.trim()}\n`;
    msg += `📍 *Ciudad / Dirección:* ${ciudad.trim()} - ${direccion.trim()}\n`;
    msg += `💳 *Método de pago:* ${METODO_PAGO_LABEL[metodoPago]}\n`;
    if (notas.trim()) msg += `📝 *Notas:* ${notas.trim()}\n`;
    msg += `--------------------------------------\n`;
    msg += `📦 *PRENDAS SOLICITADAS:*\n\n`;

    items.forEach((it, idx) => {
      msg += `${idx + 1}. *${it.nombre}* (Ref: ${it.referencia})\n`;
      msg += `   • Talla: ${it.tallaValor} | Color: ${it.colorNombre}\n`;
      msg += `   • Cantidad: ${it.cantidad} x ${formatoCOP(it.precio)} = *${formatoCOP(it.precio * it.cantidad)}*\n\n`;
    });

    msg += `--------------------------------------\n`;
    msg += `💰 *TOTAL A PAGAR:* ${formatoCOP(total)}\n`;
    msg += `--------------------------------------\n`;
    msg += `¡Hola! Acabo de armar mi pedido desde la tienda online KAOB. Quedo atento a los datos de pago y envío.`;

    return encodeURIComponent(msg);
  };

  const handleEnviarPedidoWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !nombre || !celular) return;

    setEnviando(true);

    try {
      await crearPedidoOnline({
        clienteNombre: nombre.trim(),
        clienteTelefono: celular.trim(),
        ciudad: ciudad.trim(),
        direccion: direccion.trim(),
        notas: notas.trim() || undefined,
        metodoFinanciacion: metodoPago,
        subtotal: total,
        total,
        items: items.map((it) => ({
          varianteId: it.varianteId,
          nombreProducto: it.nombre,
          referencia: it.referencia,
          tallaValor: it.tallaValor,
          colorNombre: it.colorNombre,
          cantidad: it.cantidad,
          precioUnitario: it.precio,
          subtotal: it.precio * it.cantidad,
        })),
      });
    } catch {
      // Si falla el registro interno, igual dejamos continuar el pedido por WhatsApp
    }

    const mensajeCodificado = generarMensajeWhatsApp();
    const telLimpio = telefonoWhatsAppTienda.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${telLimpio}?text=${mensajeCodificado}`;

    window.open(url, '_blank');
    onVaciarBolsa();
    setPaso('carrito');
    setEnviando(false);
    onCerrar();
  };

  const MONTO_ENVIO_GRATIS = 150000;
  const faltaParaGratis = Math.max(0, MONTO_ENVIO_GRATIS - total);
  const porcentajeGratis = Math.min(100, Math.round((total / MONTO_ENVIO_GRATIS) * 100));

  return (
    <div className="fixed inset-0 z-[1500] flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Cabecera del Drawer */}
        <div className="p-5 border-b border-zinc-200 bg-zinc-950 text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black font-bold">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-widest">
                  Tu Bolsa de Compras
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {totalPrendas === 1 ? '1 prenda seleccionada' : `${totalPrendas} prendas seleccionadas`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar bolsa"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Barra de Envío Gratis */}
          {items.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold">
                {faltaParaGratis === 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    🎉 ¡Felicidades! Tienes Envío Gratis
                  </span>
                ) : (
                  <span className="text-zinc-300">
                    Agrega <strong className="text-white">{formatoCOP(faltaParaGratis)}</strong> para <strong>Envío Gratis</strong>
                  </span>
                )}
                <span className="text-zinc-400 font-mono">{porcentajeGratis}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeGratis}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Tu bolsa está vacía</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  Explora nuestras colecciones y añade las prendas que más te gusten.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={onCerrar}
                className="mt-2 text-xs font-bold uppercase tracking-wider rounded-full px-6"
              >
                Volver a la tienda
              </Button>
            </div>
          ) : paso === 'carrito' ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.varianteId}
                  className="flex gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl bg-white border border-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-800 shadow-xs shrink-0">
                      {item.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-zinc-900 line-clamp-1">{item.nombre}</p>
                      <p className="text-[11px] text-zinc-500 font-medium">
                        Talla: <strong className="text-zinc-800">{item.tallaValor}</strong> · Color:{' '}
                        <strong className="text-zinc-800">{item.colorNombre}</strong>
                      </p>
                      <p className="text-xs font-black text-zinc-900">
                        {formatoCOP(item.precio)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEliminarItem(item.varianteId)}
                      className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                      title="Eliminar prenda"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center rounded-lg border border-zinc-300 bg-white p-0.5 shadow-xs">
                      <button
                        type="button"
                        onClick={() => onActualizarCantidad(item.varianteId, -1)}
                        className="h-6 w-6 rounded bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.cantidad}</span>
                      <button
                        type="button"
                        disabled={item.cantidad >= item.stockDisponible}
                        onClick={() => onActualizarCantidad(item.varianteId, 1)}
                        className="h-6 w-6 rounded bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold text-xs disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-between items-center text-xs text-zinc-500">
                <button
                  type="button"
                  onClick={onVaciarBolsa}
                  className="text-red-500 hover:underline font-semibold"
                >
                  Vaciar bolsa
                </button>
                <span>Stock asegurado</span>
              </div>
            </div>
          ) : (
            /* PASO 2: DATOS DEL CLIENTE */
            <form id="form-checkout-wa" onSubmit={handleEnviarPedidoWhatsApp} className="space-y-3.5">
              <div className="rounded-xl bg-zinc-100 p-3 text-xs text-zinc-700 space-y-1">
                <p className="font-bold">Completa tus datos para despachar tu pedido</p>
                <p className="text-zinc-500 text-[11px]">
                  Al continuar te abrirá WhatsApp con el resumen de tu compra listo para coordinar el pago.
                </p>
              </div>

              {/* Método de pago / financiación */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">¿Cómo quieres pagar?</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'CONTADO', label: 'Contado', icono: Landmark },
                      { id: 'PLAN_SEPARE', label: 'Plan Separe', icono: Wallet },
                      { id: 'ADDI', label: 'Addi', icono: CreditCard },
                      { id: 'SISTECREDITO', label: 'Sistecrédito', icono: Smartphone },
                    ] as const
                  ).map((m) => {
                    const Icono = m.icono;
                    const activo = metodoPago === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMetodoPago(m.id);
                          setMostrarFinanciacion(m.id !== 'CONTADO');
                        }}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                          activo ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <Icono className="h-3.5 w-3.5" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                {mostrarFinanciacion && metodoPago !== 'CONTADO' && (
                  <div className="mt-2.5">
                    <FinanciacionCalculadora precio={total} variante="completa" metodoSeleccionado={metodoPago} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Nombre completo *</label>
                <Input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Número de WhatsApp *</label>
                <Input
                  required
                  type="tel"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  placeholder="Ej. 310 123 4567"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Ciudad *</label>
                  <Input
                    required
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej. Medellín"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Dirección *</label>
                  <Input
                    required
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej. Calle 10 # 40-20"
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Notas o referencias</label>
                <Input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Apto 301, dejar en portería…"
                  className="text-xs"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer del Drawer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-zinc-200 bg-zinc-50 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-medium">Subtotal</span>
              <span className="font-bold text-zinc-900">{formatoCOP(total)}</span>
            </div>
            <div className="flex justify-between items-center text-base font-black">
              <span className="text-zinc-900 uppercase">Total a pagar</span>
              <span className="text-xl text-zinc-900">{formatoCOP(total)}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-semibold text-zinc-400 uppercase tracking-wide">
              <span className="px-2 py-0.5 rounded bg-zinc-100">Efectivo</span>
              <span className="px-2 py-0.5 rounded bg-zinc-100">Nequi / Daviplata</span>
              <span className="px-2 py-0.5 rounded bg-zinc-100">Tarjeta (Wompi)</span>
              <span className="px-2 py-0.5 rounded bg-zinc-100">Addi</span>
              <span className="px-2 py-0.5 rounded bg-zinc-100">Sistecrédito</span>
              <span className="px-2 py-0.5 rounded bg-zinc-100">Plan Separe</span>
            </div>

            {paso === 'carrito' ? (
              <Button
                size="lg"
                onClick={() => setPaso('datos')}
                className="w-full py-6 rounded-2xl bg-black text-white hover:bg-zinc-800 font-bold uppercase tracking-widest text-xs shadow-lg transition-all"
              >
                Proceder al Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  type="submit"
                  form="form-checkout-wa"
                  disabled={enviando || !nombre || !celular}
                  size="lg"
                  className="w-full py-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" /> Finalizar Pedido por WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPaso('carrito')}
                  className="w-full text-xs font-semibold text-zinc-600"
                >
                  Volver a editar prendas
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
