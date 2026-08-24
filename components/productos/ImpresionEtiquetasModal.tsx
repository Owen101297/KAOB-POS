"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Barcode, Printer, Plus, Minus, Layers, Check, Copy, Sparkles } from "lucide-react";
import JsBarcode from "jsbarcode";
import { formatoCOP } from "@/lib/format";

interface VarianteEtiqueta {
  id: number;
  sku: string;
  productoNombre: string;
  referencia: string;
  colorNombre: string;
  tallaValor: string;
  precio: number;
}

interface ImpresionEtiquetasModalProps {
  open: boolean;
  onClose: () => void;
  variantes: VarianteEtiqueta[];
  nombreTienda?: string;
}

export default function ImpresionEtiquetasModal({
  open,
  onClose,
  variantes,
  nombreTienda = "KAOB MODA",
}: ImpresionEtiquetasModalProps) {
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [tamanoEtiqueta, setTamanoEtiqueta] = useState<"50x30" | "40x25" | "80mm">("50x30");
  const svgMapRef = useRef<Map<string, SVGSVGElement>>(new Map());

  // Inicializar cantidades al abrir
  useEffect(() => {
    if (open) {
      const initial: Record<number, number> = {};
      variantes.forEach((v) => {
        initial[v.id] = 1;
      });
      setCantidades(initial);
    }
  }, [open, variantes]);

  // Dibujar códigos de barras para CADA copia individualmente
  useEffect(() => {
    if (!open || variantes.length === 0) return;

    const timer = setTimeout(() => {
      svgMapRef.current.forEach((el, key) => {
        if (el) {
          const sku = el.getAttribute("data-sku");
          if (sku) {
            try {
              JsBarcode(el, sku, {
                format: "CODE128",
                width: tamanoEtiqueta === "40x25" ? 1.2 : 1.4,
                height: tamanoEtiqueta === "40x25" ? 28 : 34,
                displayValue: true,
                fontSize: tamanoEtiqueta === "40x25" ? 9 : 10,
                font: "monospace",
                fontOptions: "bold",
                margin: 0,
                textMargin: 2,
                lineColor: "#0f172a",
              });
            } catch (e) {
              console.warn("Error generando código de barras:", e);
            }
          }
        }
      });
    }, 60);

    return () => clearTimeout(timer);
  }, [open, variantes, cantidades, tamanoEtiqueta]);

  const cambiarCantidad = (id: number, delta: number) => {
    setCantidades((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const ponerTodas = (cant: number) => {
    const next: Record<number, number> = {};
    variantes.forEach((v) => {
      next[v.id] = cant;
    });
    setCantidades(next);
  };

  const totalEtiquetas = Object.values(cantidades).reduce((a, b) => a + b, 0);

  const imprimir = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 bg-white border border-slate-200 text-slate-900 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 sm:p-5 border-b border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <Barcode className="h-5 w-5 text-brand-600" />
              Impresión de Etiquetas de Código de Barras
            </DialogTitle>
            <div className="flex items-center gap-2">
              <select
                value={tamanoEtiqueta}
                onChange={(e) => setTamanoEtiqueta(e.target.value as any)}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
              >
                <option value="50x30">Adhesivo 50x30 mm (Estándar)</option>
                <option value="40x25">Adhesivo 40x25 mm (Pequeño)</option>
                <option value="80mm">Rollo Térmico 80 mm</option>
              </select>
              <Badge variant="success">{totalEtiquetas} Etiquetas</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {/* Selector de copias por variante */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-600" />
                Copias a imprimir por prenda y talla
              </h4>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => ponerTodas(1)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Todas x1
                </button>
                <button
                  type="button"
                  onClick={() => ponerTodas(5)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Todas x5
                </button>
                <button
                  type="button"
                  onClick={() => ponerTodas(0)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Limpiar (0)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {variantes.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="truncate mr-2">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {v.productoNombre}
                    </p>
                    <p className="text-[10.5px] font-medium text-slate-500">
                      Talla: <strong className="text-slate-800">{v.tallaValor}</strong> • Color: <strong className="text-slate-800">{v.colorNombre}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(v.id, -1)}
                      className="h-6 w-6 rounded flex items-center justify-center bg-white text-slate-700 hover:bg-slate-200 font-bold"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-bold w-6 text-center text-xs text-slate-900">
                      {cantidades[v.id] || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(v.id, 1)}
                      className="h-6 w-6 rounded flex items-center justify-center bg-white text-slate-700 hover:bg-slate-200 font-bold"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vista previa imprimible */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Vista Previa de Etiquetas ({totalEtiquetas} listas para imprimir)
              </h4>
              <span className="text-[11px] font-semibold text-slate-500">
                Formato: {tamanoEtiqueta === "50x30" ? "50 x 30 mm" : tamanoEtiqueta === "40x25" ? "40 x 25 mm" : "Térmica 80 mm"}
              </span>
            </div>

            <div
              id="printable-labels-area"
              className="flex flex-wrap gap-3.5 p-6 bg-white border border-slate-300 rounded-xl shadow-xs justify-center overflow-y-auto max-h-[360px]"
            >
              {totalEtiquetas === 0 ? (
                <p className="text-xs font-semibold text-slate-400 py-8 text-center">
                  No hay etiquetas seleccionadas. Aumenta las cantidades arriba.
                </p>
              ) : (
                variantes
                  .filter((v) => (cantidades[v.id] || 0) > 0)
                  .flatMap((v) =>
                    Array.from({ length: cantidades[v.id] || 1 }).map((_, idx) => {
                      const itemKey = `${v.id}-${idx}`;
                      return (
                        <div
                          key={itemKey}
                          className="print-single-label w-[190px] h-[126px] bg-white border border-slate-400 border-dashed rounded p-2 flex flex-col justify-between items-center text-center font-sans select-none shadow-2xs"
                        >
                          {/* Encabezado */}
                          <div className="w-full">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 truncate leading-none">
                              {nombreTienda}
                            </p>
                            <p className="text-[10.5px] font-bold text-slate-900 truncate leading-tight mt-1">
                              {v.productoNombre}
                            </p>
                          </div>

                          {/* Código de barras Code128 */}
                          <div className="w-full flex justify-center items-center my-0.5 overflow-hidden">
                            <svg
                              ref={(el) => {
                                if (el) svgMapRef.current.set(itemKey, el);
                                else svgMapRef.current.delete(itemKey);
                              }}
                              data-sku={v.sku}
                              className="max-h-[44px] max-w-[170px]"
                            />
                          </div>

                          {/* Pie de etiqueta con Talla, Color y Precio */}
                          <div className="w-full flex items-center justify-between pt-1 border-t border-slate-300 text-[10px]">
                            <span className="font-extrabold text-slate-800">
                              T: {v.tallaValor} • {v.colorNombre}
                            </span>
                            <span className="font-black text-[11.5px] text-slate-950">
                              {formatoCOP(v.precio)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-200 bg-white flex flex-row items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            size="sm"
            onClick={imprimir}
            disabled={totalEtiquetas === 0}
            className="flex items-center gap-2 font-bold"
          >
            <Printer className="h-4 w-4" />
            Imprimir {totalEtiquetas} Etiquetas
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Estilos CSS para Impresión Térmica Directa */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-labels-area,
          #printable-labels-area * {
            visibility: visible !important;
          }
          #printable-labels-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 2mm !important;
          }
          .print-single-label {
            border: 1px solid #000 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
