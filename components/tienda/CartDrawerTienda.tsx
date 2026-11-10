'use client';

import { useState } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Phone,
  Send,
  CreditCard,
  Wallet,
  Landmark,
  Banknote,
  CheckCircle2,
} from 'lucide-react';
import { formatoCOP } from '@/lib/format';
import { registrarPedidoOnline } from '@/lib/actions/pedidos';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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

export type MetodoPagoTienda =
  | 'WOMPI'
  | 'BOLD'
  | 'ADDI'
  | 'SISTECREDITO'
  | 'FIADO'
  | 'CONTRAENTREGA'
  | 'WHATSAPP';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  items: ItemBolsa[];
  onActualizarCantidad: (varianteId: number, delta: number) => void;
  onEliminarItem: (varianteId: number) => void;
  onVaciarBolsa: () => void;
  telefonoWhatsAppTienda?: string;
  /** Pasarelas activas según env del servidor; sin llaves el método se oculta. */
  pasarelas?: { wompi: boolean; bold: boolean };
  /** Fiado requiere clientes con cupo cargado en el POS. */
  fiadoActivo?: boolean;
}

const METODO_META: Record<
  MetodoPagoTienda,
  { titulo: string; detalle: string; icono: React.ReactNode; cta: string; acento: string }
> = {
  WOMPI: {
    titulo: 'Tarjeta / PSE / Nequi',
    detalle: 'Pasarela segura de Wompi',
    icono: <CreditCard className="h-4 w-4" />,
    cta: 'Pagar con Wompi',
    acento: 'bg-sky-600 hover:bg-sky-700 text-white',
  },
  BOLD: {
    titulo: 'Pagar con Bold',
    detalle: 'Link de pago Bold (tarjeta, PSE)',
    icono: <Wallet className="h-4 w-4" />,
    cta: 'Ir a pagar con Bold',
    acento: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  ADDI: {
    titulo: 'Addi',
    detalle: 'Paga a cuotas con tu documento',
    icono: <Landmark className="h-4 w-4" />,
    cta: 'Confirmar pedido con Addi',
    acento: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  SISTECREDITO: {
    titulo: 'Sistecrédito',
    detalle: 'Crédito con tu documento',
    icono: <Landmark className="h-4 w-4" />,
    cta: 'Confirmar pedido (Sistecrédito)',
    acento: 'bg-cyan-700 hover:bg-cyan-800 text-white',
  },
  FIADO: {
    titulo: 'Fiado (crédito)',
    detalle: 'Solo clientes con cupo en KAOB',
    icono: <Banknote className="h-4 w-4" />,
    cta: 'Confirmar pedido a crédito',
    acento: 'bg-zinc-900 hover:bg-zinc-800 text-white',
  },
  CONTRAENTREGA: {
    titulo: 'Pago contraentrega',
    detalle: 'Pagas en efectivo al recibir',
    icono: <Banknote className="h-4 w-4" />,
    cta: 'Confirmar pedido (pagas al recibir)',
    acento: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  WHATSAPP: {
    titulo: 'WhatsApp',
    detalle: 'Coordinar el pago contigo',
    icono: <Send className="h-4 w-4" />,
    cta: 'Finalizar por WhatsApp',
    acento: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
};

export default function CartDrawerTienda({
  abierto,
  onCerrar,
  items,
  onActualizarCantidad,
  onEliminarItem,
  onVaciarBolsa,
  telefonoWhatsAppTienda = '573000000000',
  pasarelas = { wompi: process.env.NEXT_PUBLIC_WOMPI_ACTIVO === '1', bold: process.env.NEXT_PUBLIC_BOLD_ACTIVO === '1' },
  fiadoActivo = process.env.NEXT_PUBLIC_FIADO_ACTIVO === '1',
}: Props) {
  const [paso, setPaso] = useState<'carrito' | 'datos' | 'pago'>('carrito');
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [notas, setNotas] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [metodo, setMetodo] = useState<MetodoPagoTienda>('WHATSAPP');
  const [enviando, setEnviando] = useState(false);
  const [errorCheckout, setErrorCheckout] = useState('');

  if (!abierto) return null;

  const total = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const totalPrendas = items.reduce((acc, it) => acc + it.cantidad, 0);

  const opcionesMetodo: MetodoPagoTienda[] = [
    ...(pasarelas.wompi ? ['WOMPI' as const] : []),
    ...(pasarelas.bold ? ['BOLD' as const] : []),
    'ADDI' as const,
    'SISTECREDITO' as const,
    ...(fiadoActivo ? ['FIADO' as const] : []),
    'CONTRAENTREGA' as const,
    'WHATSAPP' as const,
  ];

  const bodyCheckout = () => ({
    nombre: nombre.trim(),
    celular: celular.trim(),
    ciudad: ciudad.trim(),
    direccion: direccion.trim(),
    notas: notas.trim(),
    items: items.map((it) => ({ varianteId: it.varianteId, cantidad: it.cantidad })),
  });

  const datosCompletos = Boolean(nombre.trim() && celular.trim() && ciudad.trim() && direccion.trim());

  // Envía un POST multilinea al Web Checkout de Wompi (inputs hidden) para
  // redirigir al cliente dentro del gesto del usuario (evita bloqueo de popups).
  const submitFormPost = (url: string, campos: Record<string, string>) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    for (const [nombreCampo, valor] of Object.entries(campos)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = nombreCampo;
      input.value = valor;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  };

  const finalizarPago = async () => {
    if (!datosCompletos || enviando || items.length === 0) return;
    const requiereDocumento =
      metodo === 'ADDI' || metodo === 'SISTECREDITO' || metodo === 'FIADO';
    if (requiereDocumento && documento.replace(/\s/g, '').length < 6) {
      setErrorCheckout('Escribe tu número de documento para continuar.');
      return;
    }

    setEnviando(true);
    setErrorCheckout('');

    try {
      const base = bodyCheckout();

      // WhatsApp: pedido en BD + mensaje con la referencia (spec 001, D7).
      if (metodo === 'WHATSAPP') {
        await enviarPorWhatsApp();
        setEnviando(false);
        return;
      }

      // Pasarelas: redirigir al proveedor.
      if (metodo === 'WOMPI' || metodo === 'BOLD') {
        const res = await fetch(metodo === 'WOMPI' ? '/api/checkout/wompi' : '/api/checkout/bold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...base, email: email.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setErrorCheckout(data.error || 'No pudimos iniciar el pago. Intenta de nuevo.');
          setEnviando(false);
          return;
        }
        onVaciarBolsa();
        if (metodo === 'WOMPI') submitFormPost(data.url, data.campos);
        else window.location.href = data.url;
        return;
      }

      // Métodos directos: pedido queda registrado y se muestra su estado.
      const res = await fetch('/api/checkout/directo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...base, email: email.trim(), documento: documento.trim(), metodo }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorCheckout(data.error || 'No pudimos registrar tu pedido. Intenta de nuevo.');
        setEnviando(false);
        return;
      }
      onVaciarBolsa();
      window.location.href = `/tienda/pago/${data.referencia}`;
    } catch {
      setErrorCheckout('Error de conexión. Revisa tu internet e intenta de nuevo.');
      setEnviando(false);
    }
  };

  const enviarPorWhatsApp = async () => {
    // La ventana se abre de forma síncrona (dentro del gesto del usuario) y
    // luego se redirige tras guardar; evita el bloqueo de popups de Safari.
    const ventana = window.open('about:blank', '_blank');

    // v1: el pedido queda registrado en BD (PED-<fecha>-<id>) y el mensaje de
    // WhatsApp se abre después con la referencia incluida (spec 001, D7).
    const res = await registrarPedidoOnline(bodyCheckout());

    if (!res.ok || !ventana) {
      setErrorCheckout(!res.ok ? res.error : 'Tu navegador bloqueó la ventana de WhatsApp; el pedido sí quedó registrado.');
      ventana?.close();
      return;
    }

    const mensaje = `${generarMensajeWhatsApp()}${encodeURIComponent(`\n🧾 *Referencia:* ${res.data.referencia}`)}`;
    const telLimpio = telefonoWhatsAppTienda.replace(/[^0-9]/g, '');
    ventana.location.href = `https://wa.me/${telLimpio}?text=${mensaje}`;

    onVaciarBolsa();
    setPaso('carrito');
  };

  // Mensaje de WhatsApp (bolsa actual, URI-encoded).
  const generarMensajeWhatsApp = () => {
    let msg = `🛒 *NUEVO PEDIDO - KAOB MODERN WEAR*\n`;
    msg += `--------------------------------------\n`;
    msg += `👤 *Cliente:* ${nombre.trim()}\n`;
    msg += `📱 *WhatsApp:* ${celular.trim()}\n`;
    msg += `📍 *Ciudad / Dirección:* ${ciudad.trim()} - ${direccion.trim()}\n`;
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
          ) : paso === 'datos' ? (
            /* PASO 2: DATOS DEL CLIENTE */
            <form id="form-checkout-wa" onSubmit={(e) => e.preventDefault()} className="space-y-3.5">
              <div className="rounded-xl bg-zinc-100 p-3 text-xs text-zinc-700 space-y-1">
                <p className="font-bold">Completa tus datos para despachar tu pedido</p>
                <p className="text-zinc-500 text-[11px]">
                  Ciudad y dirección son necesarias para envíos a toda Colombia.
                </p>
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
          ) : (
            /* PASO 3: MÉTODO DE PAGO (spec 002, US1) */
            <div className="space-y-3.5">
              <div className="rounded-xl bg-zinc-100 p-3 text-xs text-zinc-700 space-y-1">
                <p className="font-bold">¿Cómo quieres pagar tu pedido?</p>
                <p className="text-zinc-500 text-[11px]">
                  Todos los métodos quedan coordinados con la referencia de tu pedido.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {opcionesMetodo.map((op) => {
                  const meta = METODO_META[op];
                  const activo = metodo === op;
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setMetodo(op)}
                      aria-pressed={activo}
                      className={`text-left rounded-xl border p-2.5 transition-all ${
                        activo
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                          : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
                        {meta.icono}
                        {meta.titulo}
                      </span>
                      <span className={`block mt-0.5 text-[10px] ${activo ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {meta.detalle}
                      </span>
                    </button>
                  );
                })}
              </div>

              {(metodo === 'WOMPI' || metodo === 'BOLD') && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Correo electrónico (para el recibo)
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="text-xs"
                  />
                </div>
              )}

              {(metodo === 'ADDI' || metodo === 'SISTECREDITO' || metodo === 'FIADO') && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Número de documento {metodo === 'FIADO' ? '(el de tu cuenta KAOB con cupo)' : ''}
                  </label>
                  <Input
                    inputMode="numeric"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value.replace(/[^0-9 ]/g, ''))}
                    placeholder="Ej. 1010123456"
                    className="text-xs"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {metodo === 'FIADO'
                      ? 'Verificamos el cupo disponible antes de confirmar.'
                      : 'Gestionamos el crédito y te confirmamos por WhatsApp.'}
                  </p>
                </div>
              )}

              {metodo === 'CONTRAENTREGA' && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-800">
                  Pagas en efectivo cuando recibas tu pedido. Coordinamos la entrega por WhatsApp con la referencia.
                </div>
              )}

              {metodo === 'WOMPI' && (
                <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 text-[11px] text-sky-800">
                  Te llevamos a la pasarela segura de Wompi para completar el pago y volver a la tienda.
                </div>
              )}
              {metodo === 'BOLD' && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800">
                  Te llevamos a un enlace de pago Bold y regresamos a la tienda al terminar.
                </div>
              )}
            </div>
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

            {paso === 'carrito' ? (
              <Button
                size="lg"
                onClick={() => setPaso('datos')}
                className="w-full py-6 rounded-2xl bg-black text-white hover:bg-zinc-800 font-bold uppercase tracking-widest text-xs shadow-lg transition-all"
              >
                Proceder al Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : paso === 'datos' ? (
              <div className="space-y-2">
                {errorCheckout && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {errorCheckout}
                  </p>
                )}
                <Button
                  size="lg"
                  disabled={!nombre || !celular}
                  onClick={() => setPaso('pago')}
                  className="w-full py-6 rounded-2xl bg-black text-white hover:bg-zinc-800 font-bold uppercase tracking-widest text-xs shadow-lg"
                >
                  Continuar al pago <ArrowRight className="ml-2 h-4 w-4" />
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
            ) : (
              <div className="space-y-2">
                {errorCheckout && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {errorCheckout}
                  </p>
                )}
                <Button
                  type="button"
                  disabled={enviando || !datosCompletos}
                  onClick={() => finalizarPago()}
                  size="lg"
                  className={`w-full py-6 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 ${METODO_META[metodo].acento}`}
                >
                  {enviando ? 'Procesando…' : METODO_META[metodo].cta} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={enviando}
                  onClick={() => setPaso('datos')}
                  className="w-full text-xs font-semibold text-zinc-600"
                >
                  Volver a mis datos
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
