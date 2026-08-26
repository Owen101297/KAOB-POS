'use client';

import { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Phone, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatoCOP } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddiLogo, SistecreditoLogo, NequiLogo, BancolombiaLogo, PlanSepareLogo, CardBrandsLogo } from './PaymentMethodsBadges';
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
  const [metodoPago, setMetodoPago] = useState<'CONTADO' | 'ADDI' | 'SISTECREDITO' | 'PLAN_SEPARE' | 'TRANSFERENCIA'>('TRANSFERENCIA');

  if (!abierto) return null;

  const total = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const totalPrendas = items.reduce((acc, it) => acc + it.cantidad, 0);

  const METODO_PAGO_LABEL: Record<string, string> = {
    TRANSFERENCIA: 'Transferencia (Nequi / Bancolombia / Daviplata)',
    ADDI: 'Financiación con Addi (0% interés en cuotas)',
    SISTECREDITO: 'Financiación con Sistecrédito',
    PLAN_SEPARE: 'Plan Separe KΛOB (Aparta con 30%)',
    CONTADO: 'Efectivo / Tarjeta en Tienda',
  };

  const generarMensajeWhatsApp = () => {
    let msg = `🛒 *NUEVO PEDIDO - KΛOB MODERN WEAR*\n`;
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
    msg += `¡Hola! Acabo de armar mi pedido desde la tienda online KΛOB. Quedo atento a la confirmación y datos de pago.`;

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
      // Si falla el registro en BD, dejamos continuar al cliente con el mensaje a WhatsApp
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

  const MONTO_ENVIO_GRATIS = 200000;
  const faltaParaGratis = Math.max(0, MONTO_ENVIO_GRATIS - total);
  const porcentajeGratis = Math.min(100, Math.round((total / MONTO_ENVIO_GRATIS) * 100));

  return (
    <div className="fixed inset-0 z-[1500] flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 text-zinc-950">
        
        {/* Cabecera del Drawer */}
        <div className="p-5 border-b border-zinc-800 bg-[#09090B] text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-white text-black font-bold">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em]">
                  BOLSA DE COMPRAS
                </h2>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {totalPrendas === 1 ? '1 PRENDA' : `${totalPrendas} PRENDAS`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Cerrar bolsa"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Barra de Progreso Envío Gratis */}
          {items.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                {faltaParaGratis === 0 ? (
                  <span className="text-emerald-400">
                    🎉 ¡TIENES ENVÍO GRATIS A TODA COLOMBIA!
                  </span>
                ) : (
                  <span className="text-zinc-400">
                    AGREGA <strong className="text-white">{formatoCOP(faltaParaGratis)}</strong> PARA ENVÍO GRATIS
                  </span>
                )}
                <span className="text-zinc-400 font-mono">{porcentajeGratis}%</span>
              </div>
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
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
              <div className="w-16 h-16 bg-zinc-100 flex items-center justify-center text-zinc-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">Tu bolsa está vacía</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs font-light">
                  Explora las colecciones y selecciona tus prendas favoritas.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={onCerrar}
                className="mt-2 text-xs font-bold uppercase tracking-[0.2em] rounded-none px-6 py-4"
              >
                VOLVER A LA TIENDA
              </Button>
            </div>
          ) : paso === 'carrito' ? (
            /* PASO 1: LISTADO DE PRENDAS */
            <div className="space-y-3.5">
              {items.map((item) => (
                <div
                  key={item.varianteId}
                  className="flex gap-3 p-3 bg-zinc-50 border border-zinc-200/80 items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 bg-white border border-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-800 shrink-0 font-serif">
                      {item.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-zinc-950 uppercase tracking-wide line-clamp-1">{item.nombre}</p>
                      <p className="text-[11px] text-zinc-500">
                        Talla: <strong className="text-zinc-950">{item.tallaValor}</strong> · Color:{' '}
                        <strong className="text-zinc-950">{item.colorNombre}</strong>
                      </p>
                      <p className="text-xs font-black text-zinc-950">
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

                    <div className="flex items-center border border-zinc-300 bg-white">
                      <button
                        type="button"
                        onClick={() => onActualizarCantidad(item.varianteId, -1)}
                        className="h-6 w-6 hover:bg-zinc-100 text-zinc-700 font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.cantidad}</span>
                      <button
                        type="button"
                        disabled={item.cantidad >= item.stockDisponible}
                        onClick={() => onActualizarCantidad(item.varianteId, 1)}
                        className="h-6 w-6 hover:bg-zinc-100 text-zinc-700 font-bold text-xs disabled:opacity-30"
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
                  className="text-zinc-400 hover:text-red-600 underline font-medium"
                >
                  Vaciar bolsa
                </button>
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Stock Asegurado</span>
              </div>
            </div>
          ) : (
            /* PASO 2: DATOS DEL CLIENTE Y MÉTODO DE PAGO */
            <form id="form-checkout-wa" onSubmit={handleEnviarPedidoWhatsApp} className="space-y-4">
              <div className="p-3 bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 space-y-1">
                <p className="font-bold uppercase tracking-wider">Completa tus datos de despacho</p>
                <p className="text-zinc-500 text-[11px] font-light">
                  Se generará tu pedido y serás redirigido a WhatsApp para confirmar pago y envío.
                </p>
              </div>

              {/* Selector de Método de Pago con Logos SVG */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-2">
                  Selecciona Método de Pago o Financiación:
                </label>
                
                <div className="space-y-2">
                  {/* Transferencia Nequi / Bancolombia */}
                  <label
                    onClick={() => setMetodoPago('TRANSFERENCIA')}
                    className={`flex items-center justify-between p-3 border cursor-pointer transition-all ${
                      metodoPago === 'TRANSFERENCIA' ? 'border-black bg-zinc-50 ring-1 ring-black' : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input type="radio" checked={metodoPago === 'TRANSFERENCIA'} readOnly className="accent-black" />
                      <span className="text-xs font-bold">Transferencia Bancaria</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <NequiLogo className="h-4 w-auto rounded" />
                      <BancolombiaLogo className="h-4 w-auto rounded" />
                    </div>
                  </label>

                  {/* Addi */}
                  <label
                    onClick={() => setMetodoPago('ADDI')}
                    className={`flex items-center justify-between p-3 border cursor-pointer transition-all ${
                      metodoPago === 'ADDI' ? 'border-black bg-zinc-50 ring-1 ring-black' : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input type="radio" checked={metodoPago === 'ADDI'} readOnly className="accent-black" />
                      <span className="text-xs font-bold">Financiación con Addi</span>
                    </div>
                    <AddiLogo className="h-4 w-auto rounded" />
                  </label>

                  {/* Sistecrédito */}
                  <label
                    onClick={() => setMetodoPago('SISTECREDITO')}
                    className={`flex items-center justify-between p-3 border cursor-pointer transition-all ${
                      metodoPago === 'SISTECREDITO' ? 'border-black bg-zinc-50 ring-1 ring-black' : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input type="radio" checked={metodoPago === 'SISTECREDITO'} readOnly className="accent-black" />
                      <span className="text-xs font-bold">Sistecrédito</span>
                    </div>
                    <SistecreditoLogo className="h-4 w-auto rounded" />
                  </label>

                  {/* Plan Separe */}
                  <label
                    onClick={() => setMetodoPago('PLAN_SEPARE')}
                    className={`flex items-center justify-between p-3 border cursor-pointer transition-all ${
                      metodoPago === 'PLAN_SEPARE' ? 'border-black bg-zinc-50 ring-1 ring-black' : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input type="radio" checked={metodoPago === 'PLAN_SEPARE'} readOnly className="accent-black" />
                      <span className="text-xs font-bold">Plan Separe KΛOB (30%)</span>
                    </div>
                    <PlanSepareLogo className="h-4 w-auto rounded" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-1">Nombre completo *</label>
                <Input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="rounded-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-1">WhatsApp de contacto *</label>
                <Input
                  required
                  type="tel"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  placeholder="Ej. 300 123 4567"
                  className="rounded-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-1">Ciudad *</label>
                  <Input
                    required
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej. Bogotá"
                    className="rounded-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-1">Dirección *</label>
                  <Input
                    required
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej. Cra 15 # 85-30"
                    className="rounded-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-1">Notas o Apto</label>
                <Input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Torre 2 Apto 501…"
                  className="rounded-none text-xs"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer del Drawer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-zinc-200 bg-zinc-50 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium">Subtotal</span>
              <span className="font-bold text-zinc-950">{formatoCOP(total)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-black">
              <span className="text-zinc-950 uppercase tracking-wider">Total a pagar</span>
              <span className="text-lg text-zinc-950">{formatoCOP(total)}</span>
            </div>

            {paso === 'carrito' ? (
              <Button
                size="lg"
                onClick={() => setPaso('datos')}
                className="w-full py-6 rounded-none bg-black text-white hover:bg-zinc-800 font-bold uppercase tracking-[0.2em] text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>CONTINUAR AL CHECKOUT</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  type="submit"
                  form="form-checkout-wa"
                  disabled={enviando || !nombre || !celular}
                  size="lg"
                  className="w-full py-6 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-[0.2em] text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>ENVIAR PEDIDO POR WHATSAPP</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPaso('carrito')}
                  className="w-full text-xs font-bold uppercase tracking-wider text-zinc-600 rounded-none"
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
