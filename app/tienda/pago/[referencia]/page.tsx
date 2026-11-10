// ───────────────────────── RETORNO DE PAGO (TIENDA) ─────────────────────────
// Público. Aterriza aquí el cliente tras pagar en Wompi/Bold o al confirmar un
// método directo. No se confía en la redirección como validación (docs de
// Wompi): si la pasarela es Wompi y el pago sigue PENDIENTE, se consulta la
// transacción por API (llave privada, servidor) para mostrar el estado real.
// El resultado oficial llega por webhook (idempotencia garantizada por FR-005).

import Link from 'next/link';
import { CheckCircle2, XCircle, Clock, ArrowRight, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { consultarPagoDePedido, aplicarResultadoPasarela } from '@/lib/pagos/cobros';
import { consultarTransaccionWompi } from '@/lib/pagos/wompi';
import RefrescoPago from './RefrescoPago';

export const dynamic = 'force-dynamic';

const ETIQUETA_ESTADO: Record<string, { titulo: string; detalle: string }> = {
  APROBADO: {
    titulo: '¡Pago aprobado!',
    detalle: 'Tu pedido quedó registrado y pagado. Coordinaremos el envío por WhatsApp.',
  },
  RECHAZADO: {
    titulo: 'El pago fue rechazado',
    detalle: 'El banco declinó la operación. Puedes volver a intentarlo o elegir otro método.',
  },
  CANCELADO: {
    titulo: 'El pago fue anulado',
    detalle: 'Tu pedido sigue pendiente de pago. Escríbenos por WhatsApp para retomarlo.',
  },
  EN_TRANSITO: {
    titulo: 'Pago en proceso',
    detalle: 'La pasarela está confirmando la operación. Esta página se actualiza sola.',
  },
  PENDIENTE: {
    titulo: 'Esperando tu pago',
    detalle: 'Cuando completes el pago, esta página mostrará la confirmación automáticamente.',
  },
};

const ETIQUETA_METODO: Record<string, string> = {
  WOMPI: 'Tarjeta / PSE vía Wompi',
  BOLD: 'Bold',
  ADDI: 'Addi (crédito a cuotas)',
  SISTECREDITO: 'Sistecrédito',
  FIADO: 'Crédito KAOB (fiado)',
  CONTRAENTREGA: 'Pago contraentrega',
};

interface Props {
  params: { referencia: string };
  searchParams: { id?: string };
}

export default async function PagoPage({ params, searchParams }: Props) {
  const referencia = params.referencia;

  // Verificación por consulta (solo Wompi: la API devuelve el estado real).
  if (searchParams.id) {
    const consulta = await consultarTransaccionWompi(searchParams.id);
    if (consulta.ok && consulta.estado) {
      await aplicarResultadoPasarela({
        proveedor: 'WOMPI',
        referenciaExterna: `WOMPI-${referencia}`,
        estado: consulta.estado,
        montoCents: consulta.montoCents,
      });
    }
  }

  const pedido = await consultarPagoDePedido(referencia);

  if (!pedido) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Pedido no encontrado</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Verifica el enlace o vuelve a la tienda para completar tu pedido.
        </p>
        <Link
          href="/tienda"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-zinc-800"
        >
          Volver a la tienda <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
    );
  }

  const estadoPago = pedido.pago?.estado ?? 'PENDIENTE';
  const meta = ETIQUETA_ESTADO[estadoPago] ?? ETIQUETA_ESTADO.PENDIENTE;
  const aprobado = estadoPago === 'APROBADO';
  const rechazofinal = estadoPago === 'RECHAZADO' || estadoPago === 'CANCELADO';
  const enProceso = estadoPago === 'PENDIENTE' || estadoPago === 'EN_TRANSITO';

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-xl px-4 py-12">
        <p className="text-center text-[11px] font-black uppercase tracking-[0.3em] text-zinc-950">
          Order #{pedido.referencia}
        </p>

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              aprobado ? 'bg-emerald-100 text-emerald-700' : rechazofinal ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {aprobado ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : rechazofinal ? (
              <XCircle className="h-8 w-8" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
          </div>

          <h1 className="mt-4 text-2xl font-black tracking-tight text-zinc-900">{meta.titulo}</h1>
          <p className="mt-2 text-sm text-zinc-500">{meta.detalle}</p>

          <dl className="mt-6 space-y-2 rounded-2xl bg-zinc-50 p-4 text-left text-xs">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Referencia</dt>
              <dd className="font-bold text-zinc-900">{pedido.referencia}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Total</dt>
              <dd className="font-bold text-zinc-900">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(pedido.total)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Método</dt>
              <dd className="font-bold text-zinc-900">
                {pedido.pago ? ETIQUETA_METODO[pedido.pago.proveedor] ?? pedido.pago.proveedor : 'Por definir'}
              </dd>
            </div>
          </dl>

          {rechazofinal && (
            <Link
              href="/tienda"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-zinc-800"
            >
              <RefreshCcw className="h-4 w-4" /> Intentar de nuevo
            </Link>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 text-[11px] text-zinc-600">
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center">
            <ShieldCheck className="mx-auto h-4 w-4 text-zinc-900" />
            <p className="mt-1 font-semibold">Pago seguro</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center">
            <Truck className="mx-auto h-4 w-4 text-zinc-900" />
            <p className="mt-1 font-semibold">Envíos a toda Colombia</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center">
            <Clock className="mx-auto h-4 w-4 text-zinc-900" />
            <p className="mt-1 font-semibold">Estado en vivo</p>
          </div>
        </div>

        {enProceso && <RefrescoPago />}
      </div>
    </main>
  );
}
