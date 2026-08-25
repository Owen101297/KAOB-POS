"use client";

import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { formatoCOP } from "@/lib/format";

export interface VentaDetallePrint {
  id: number;
  consecutivo: number;
  tipo: "VENTA" | "REMISION" | "COTIZACION";
  estado: "COMPLETADA" | "PENDIENTE" | "ANULADA";
  createdAt: Date | string;
  subtotal: number;
  descuento: number;
  total: number;
  nota?: string | null;
  cliente?: { nombre: string; documento?: string | null; tipoDoc?: string } | null;
  vendedor?: { nombre: string } | null;
  bodega?: { nombre: string; direccion?: string | null } | null;
  items: {
    id: number;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
    variante: {
      sku: string;
      color: { nombre: string };
      talla: { valor: string };
      producto?: { nombre: string };
    };
  }[];
  pagos?: {
    id: number;
    metodo: string;
    monto: number;
    referencia?: string | null;
  }[];
}

interface TicketPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venta: VentaDetallePrint | null;
}

export function TicketPrintModal({ open, onOpenChange, venta }: TicketPrintModalProps) {
  if (!venta) return null;

  const prefijo = venta.tipo === "VENTA" ? "V" : venta.tipo === "REMISION" ? "R" : "C";
  const codigo = `${prefijo}-${String(venta.consecutivo).padStart(4, "0")}`;
  const fechaStr = new Date(venta.createdAt).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-slate-200 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-bold text-slate-800">
            Comprobante de {venta.tipo === "VENTA" ? "Venta" : venta.tipo === "REMISION" ? "Remisión" : "Cotización"} {codigo}
          </DialogTitle>
        </DialogHeader>

        {/* ÁREA IMPRIMIBLE TICKET 80mm */}
        <div className="p-4 max-h-[70vh] overflow-y-auto bg-slate-50 flex justify-center">
          <div
            id="ticket-print-area"
            className="w-[80mm] bg-white p-4 text-[12px] font-mono text-slate-900 shadow-sm border border-slate-200 print:shadow-none print:border-none print:w-full"
          >
            {/* ENCABEZADO TIENDA */}
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3 mb-3">
              <h2 className="text-base font-extrabold tracking-wider uppercase text-slate-900">KAOB STORE</h2>
              <p className="text-[11px] text-slate-600">Tienda de Ropa & Moda</p>
              <p className="text-[10px] text-slate-500">{venta.bodega?.nombre ?? "Bodega Principal"}</p>
              {venta.bodega?.direccion && <p className="text-[10px] text-slate-500">{venta.bodega.direccion}</p>}
              <div className="pt-1 font-bold text-sm text-slate-900">
                DOCUMENTO: {codigo}
              </div>
              <p className="text-[10px] text-slate-500">{fechaStr}</p>
            </div>

            {/* DATOS CLIENTE / VENDEDOR */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-semibold">{venta.cliente?.nombre ?? "Cliente General"}</span>
              </div>
              {venta.cliente?.documento && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Doc:</span>
                  <span>{venta.cliente.tipoDoc ?? "CC"} {venta.cliente.documento}</span>
                </div>
              )}
              {venta.vendedor && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Atendido por:</span>
                  <span>{venta.vendedor.nombre}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Estado:</span>
                <span className="font-bold">{venta.estado}</span>
              </div>
            </div>

            {/* TABLA DE ÍTEMS */}
            <table className="w-full text-left text-[11px] mb-3">
              <thead>
                <tr className="border-b border-slate-400 text-slate-600">
                  <th className="py-1">Cant × Artículo</th>
                  <th className="py-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-200">
                {(venta.items ?? []).map((item) => (
                  <tr key={item.id} className="py-1">
                    <td className="py-1 pr-1">
                      <div className="font-semibold">
                        {item.cantidad ?? 0} × {item.variante?.producto?.nombre ?? "Producto"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.variante?.sku ?? "-"} · {item.variante?.color?.nombre ?? ""} / T.{item.variante?.talla?.valor ?? ""}
                      </div>
                      {(item.descuento ?? 0) > 0 && (
                        <div className="text-[10px] text-red-500">Desc: -{formatoCOP(item.descuento)}</div>
                      )}
                    </td>
                    <td className="py-1 text-right align-top font-semibold">
                      {formatoCOP(item.subtotal ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTALES */}
            <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatoCOP(venta.subtotal)}</span>
              </div>
              {venta.descuento > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Descuento global:</span>
                  <span>-{formatoCOP(venta.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-400 pt-1">
                <span>TOTAL:</span>
                <span>{formatoCOP(venta.total)}</span>
              </div>
            </div>

            {/* DESGLOSE DE PAGOS */}
            {venta.pagos && venta.pagos.length > 0 && (
              <div className="border-t border-dashed border-slate-300 pt-2 mt-2 space-y-1 text-[10px]">
                <div className="font-semibold text-slate-600">Forma de pago:</div>
                {venta.pagos.map((p) => (
                  <div key={p.id} className="flex justify-between text-slate-700">
                    <span>{p.metodo} {p.referencia ? `(${p.referencia})` : ""}</span>
                    <span>{formatoCOP(p.monto)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* NOTAS */}
            {venta.nota && (
              <div className="border-t border-dashed border-slate-300 pt-2 mt-2 text-[10px] text-slate-600">
                <span className="font-semibold">Nota:</span> {venta.nota}
              </div>
            )}

            {/* PIE DE PÁGINA */}
            <div className="text-center text-[10px] text-slate-500 pt-4 border-t border-dashed border-slate-300 mt-4 space-y-0.5">
              <p className="font-semibold text-slate-700">¡GRACIAS POR SU COMPRA!</p>
              <p>Conserve este ticket para cambios</p>
              <p className="text-[9px] text-slate-400 pt-1">KAOB POS v4.0</p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-3 bg-white border-t border-slate-200 flex justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" /> Imprimir 80mm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
