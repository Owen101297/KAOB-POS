"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Printer, CheckCircle2, RotateCcw, Check, Sparkles } from "lucide-react";
import { formatoCOP } from "@/lib/format";

export interface VentaImpresionData {
  consecutivo: number;
  tipo: string;
  codigo: string;
  fecha: Date | string;
  tiendaNombre?: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  ciudad?: string;
  regimen?: string;
  mensajeTicket?: string;
  pieTicket?: string;
  clienteNombre?: string;
  clienteDoc?: string;
  vendedorNombre?: string;
  items: {
    nombre: string;
    color: string;
    talla: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }[];
  subtotal: number;
  descuento: number;
  total: number;
  pagos: { metodo: string; monto: number }[];
  recibido?: number;
  cambio?: number;
}

interface TicketVentaModalProps {
  open: boolean;
  onClose: () => void;
  venta: VentaImpresionData | null;
}

export default function TicketVentaModal({ open, onClose, venta }: TicketVentaModalProps) {
  // Manejo de atajo de teclado: Esc cierra / Enter imprime
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!venta) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white border border-slate-200 text-slate-900 shadow-2xl rounded-2xl">
        {/* Cabecera Éxito con Fondo Blanco Puro */}
        <DialogHeader className="p-4 sm:p-5 bg-emerald-50/60 border-b border-emerald-100 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-black flex items-center gap-2 text-emerald-800">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Check className="h-5 w-5 stroke-[3]" />
            </div>
            <span>¡Venta Guardada con Éxito!</span>
          </DialogTitle>
          <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-900 shadow-2xs">
            {venta.codigo}
          </span>
        </DialogHeader>

        {/* Vista Previa del Ticket Térmico */}
        <div className="p-5 flex flex-col items-center bg-slate-50/60 max-h-[65vh] overflow-y-auto">
          <p className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">
            Vista Previa de Tirilla Térmica (80mm)
          </p>

          <div
            id="thermal-ticket-80mm"
            className="w-[290px] bg-white text-black p-4 font-mono text-[11px] select-none rounded-xl border border-slate-300 shadow-sm space-y-2.5"
          >
            {/* Encabezado Tienda */}
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2.5">
              <p className="font-black text-sm tracking-wider uppercase text-slate-950">
                {venta.tiendaNombre || "KAOB POS"}
              </p>
              <p className="text-[10px] text-slate-700 font-semibold">NIT: {venta.nit || "900.000.000-0"}</p>
              <p className="text-[10px] text-slate-600">{venta.direccion || "Dirección de la tienda"}</p>
              <p className="text-[10px] text-slate-600">
                {venta.ciudad || "Colombia"} {venta.telefono ? `• Tel: ${venta.telefono}` : ""}
              </p>
              <p className="text-[9px] text-slate-500">{venta.regimen || "Responsable de IVA"}</p>
            </div>

            {/* Datos del Documento */}
            <div className="border-b border-dashed border-slate-400 pb-2 space-y-0.5 text-[10.5px]">
              <div className="flex justify-between font-black text-slate-900">
                <span>{venta.tipo}: {venta.codigo}</span>
                <span>{new Date(venta.fecha).toLocaleDateString("es-CO")}</span>
              </div>
              <div className="text-slate-800">
                Cliente: <strong>{venta.clienteNombre || "CLIENTE GENERAL"}</strong>
              </div>
              {venta.clienteDoc && <div className="text-slate-700">Doc: {venta.clienteDoc}</div>}
              {venta.vendedorNombre && <div className="text-slate-700">Vendedor: {venta.vendedorNombre}</div>}
            </div>

            {/* Detalle de Artículos */}
            <div className="border-b border-dashed border-slate-400 pb-2 space-y-1">
              <div className="flex justify-between font-black text-[10px] text-slate-900 border-b border-slate-200 pb-0.5">
                <span>CANT / PRENDA</span>
                <span>SUBTOTAL</span>
              </div>
              {venta.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[10.5px] leading-tight text-slate-900">
                  <span className="truncate pr-1">
                    {it.cantidad}x {it.nombre} ({it.talla} - {it.color})
                  </span>
                  <span className="shrink-0 font-bold">{formatoCOP(it.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Totales y Pagos */}
            <div className="border-b border-dashed border-slate-400 pb-2 space-y-1 text-right text-[10.5px]">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>Subtotal:</span>
                <span>{formatoCOP(venta.subtotal)}</span>
              </div>
              {venta.descuento > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Descuento:</span>
                  <span>-{formatoCOP(venta.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300 text-slate-950">
                <span>TOTAL A PAGAR:</span>
                <span>{formatoCOP(venta.total)}</span>
              </div>

              {venta.pagos.map((p, idx) => (
                <div key={idx} className="flex justify-between text-slate-700 text-[10px] font-semibold">
                  <span>Método ({p.metodo}):</span>
                  <span>{formatoCOP(p.monto)}</span>
                </div>
              ))}

              {venta.cambio !== undefined && venta.cambio > 0 && (
                <div className="flex justify-between text-emerald-800 text-[10.5px] font-black pt-0.5">
                  <span>Cambio / Vueltas:</span>
                  <span>{formatoCOP(venta.cambio)}</span>
                </div>
              )}
            </div>

            {/* Pie de Página */}
            <div className="text-center pt-1 space-y-1 text-[10px]">
              <p className="font-black text-slate-900">{venta.mensajeTicket || "¡Gracias por su compra!"}</p>
              <p className="text-[9px] text-slate-600 leading-tight">
                {venta.pieTicket || "Conserve este ticket para cambios o garantías (30 días)."}
              </p>
              <p className="text-[8px] text-slate-400 tracking-widest pt-1">
                |||||||||||||||||||||||||||||||||||||
              </p>
            </div>
          </div>
        </div>

        {/* Footer con Acciones Claras */}
        <DialogFooter className="p-4 bg-white border-t border-slate-200 flex flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-1.5 font-bold"
          >
            <RotateCcw className="h-4 w-4" />
            Nueva Venta
          </Button>

          <Button
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-2 font-black bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md"
          >
            <Printer className="h-4 w-4" />
            Imprimir Ticket
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Estilos CSS para Impresión de Tirilla Térmica 80mm */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-ticket-80mm,
          #thermal-ticket-80mm * {
            visibility: visible !important;
          }
          #thermal-ticket-80mm {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 2mm !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
