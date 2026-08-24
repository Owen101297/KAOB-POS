"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Printer, CheckCircle2, RotateCcw } from "lucide-react";
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
  useEffect(() => {
    if (open && venta) {
      // Auto-trigger print after short delay
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, venta]);

  if (!venta) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-slate-900 border-slate-800">
        <DialogHeader className="p-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <DialogTitle className="text-sm font-bold flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            ¡Venta Registrada Exitosamente!
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 flex justify-center bg-slate-950">
          {/* Ticket Térmico 80mm */}
          <div
            id="thermal-ticket-80mm"
            className="w-[280px] bg-white text-black p-4 font-mono text-[11px] select-none rounded shadow-2xl space-y-2"
          >
            {/* Encabezado Tienda */}
            <div className="text-center space-y-0.5 border-b border-dashed border-gray-400 pb-2">
              <p className="font-extrabold text-sm tracking-wider uppercase">
                {venta.tiendaNombre || "KAOB POS"}
              </p>
              <p className="text-[10px]">NIT: {venta.nit || "900.000.000-0"}</p>
              <p className="text-[10px]">{venta.direccion || "Dirección de la tienda"}</p>
              <p className="text-[10px]">{venta.ciudad || "Colombia"} • Tel: {venta.telefono || "3000000000"}</p>
              <p className="text-[9px] text-gray-600">{venta.regimen || "Responsable de IVA"}</p>
            </div>

            {/* Datos del Documento */}
            <div className="border-b border-dashed border-gray-400 pb-2 space-y-0.5 text-[10px]">
              <div className="flex justify-between font-bold">
                <span>{venta.tipo}: {venta.codigo}</span>
                <span>{new Date(venta.fecha).toLocaleDateString("es-CO")}</span>
              </div>
              <div>Cliente: {venta.clienteNombre || "CLIENTE GENERAL"}</div>
              {venta.clienteDoc && <div>Doc: {venta.clienteDoc}</div>}
              {venta.vendedorNombre && <div>Vendedor: {venta.vendedorNombre}</div>}
            </div>

            {/* Detalle de Artículos */}
            <div className="border-b border-dashed border-gray-400 pb-2 space-y-1">
              <div className="flex justify-between font-bold text-[10px]">
                <span>CANT / DESCRIPCIÓN</span>
                <span>SUBTOTAL</span>
              </div>
              {venta.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[10px] leading-tight">
                  <span className="truncate pr-1">
                    {it.cantidad}x {it.nombre} ({it.talla} - {it.color})
                  </span>
                  <span className="shrink-0">{formatoCOP(it.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Totales y Pagos */}
            <div className="border-b border-dashed border-gray-400 pb-2 space-y-0.5 text-right text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatoCOP(venta.subtotal)}</span>
              </div>
              {venta.descuento > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Descuento:</span>
                  <span>-{formatoCOP(venta.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-gray-300">
                <span>TOTAL:</span>
                <span>{formatoCOP(venta.total)}</span>
              </div>

              {venta.pagos.map((p, idx) => (
                <div key={idx} className="flex justify-between text-gray-700 text-[10px]">
                  <span>Pago ({p.metodo}):</span>
                  <span>{formatoCOP(p.monto)}</span>
                </div>
              ))}

              {venta.cambio !== undefined && venta.cambio > 0 && (
                <div className="flex justify-between text-gray-700 text-[10px] font-bold">
                  <span>Cambio / Vueltas:</span>
                  <span>{formatoCOP(venta.cambio)}</span>
                </div>
              )}
            </div>

            {/* Pie de Página */}
            <div className="text-center pt-1 space-y-1 text-[10px]">
              <p className="font-semibold">{venta.mensajeTicket || "¡Gracias por su compra!"}</p>
              <p className="text-[9px] text-gray-600 leading-tight">
                {venta.pieTicket || "Conserve este ticket para cambios o garantías."}
              </p>
              <p className="text-[8px] text-gray-400 tracking-widest pt-1">
                |||||||||||||||||||||||||||||||||||||
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between">
          <Button variant="outline" onClick={onClose} className="text-white border-slate-700 hover:bg-slate-800">
            <RotateCcw className="h-4 w-4 mr-1" />
            Nueva Venta
          </Button>
          <Button variant="primary" onClick={() => window.print()} className="flex items-center gap-1.5">
            <Printer className="h-4 w-4" />
            Reimprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
