"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Barcode, Printer, Plus, Minus, Check, Layers } from "lucide-react";
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
  const svgRefs = useRef<Record<string, SVGSVGElement | null>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<number, number> = {};
      variantes.forEach((v) => {
        initial[v.id] = 1;
      });
      setCantidades(initial);
    }
  }, [open, variantes]);

  // Render barcodes after modal mounts
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        variantes.forEach((v) => {
          const el = svgRefs.current[v.sku];
          if (el) {
            try {
              JsBarcode(el, v.sku, {
                format: "CODE128",
                width: 1.4,
                height: 36,
                displayValue: true,
                fontSize: 11,
                margin: 0,
                textMargin: 2,
              });
            } catch (e) {
              console.warn("Error generando barcode:", e);
            }
          }
        });
      }, 50);
    }
  }, [open, variantes, tamanoEtiqueta]);

  const cambiarCantidad = (id: number, delta: number) => {
    setCantidades((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const totalEtiquetas = Object.values(cantidades).reduce((a, b) => a + b, 0);

  const imprimirEtiquetas = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-800">
          <DialogTitle className="flex items-center justify-between text-base font-bold">
            <span className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-blue-600" />
              Impresión de Etiquetas de Código de Barras
            </span>
            <div className="flex items-center gap-2">
              <select
                value={tamanoEtiqueta}
                onChange={(e) => setTamanoEtiqueta(e.target.value as any)}
                className="px-3 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <option value="50x30">Adhesivo 50x30 mm (Estándar)</option>
                <option value="40x25">Adhesivo 40x25 mm (Pequeño)</option>
                <option value="80mm">Rollo Térmico 80 mm</option>
              </select>
              <Badge variant="info">{totalEtiquetas} Etiquetas a imprimir</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Selector de copias por variante */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Cantidad de copias por prenda y talla
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {variantes.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
                >
                  <div className="truncate mr-2">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {v.productoNombre}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Talla: <strong>{v.tallaValor}</strong> • Color: <strong>{v.colorNombre}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => cambiarCantidad(v.id, -1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-bold w-6 text-center">{cantidades[v.id] || 0}</span>
                    <button
                      onClick={() => cambiarCantidad(v.id, 1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-3">
              Vista Previa de Impresión
            </h4>

            <div
              id="printable-labels-container"
              className="flex flex-wrap gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-inner justify-center"
            >
              {variantes
                .filter((v) => (cantidades[v.id] || 0) > 0)
                .flatMap((v) =>
                  Array.from({ length: cantidades[v.id] || 1 }).map((_, idx) => (
                    <div
                      key={`${v.id}-${idx}`}
                      className="print-label w-[190px] h-[120px] bg-white border border-dashed border-gray-400 p-2.5 flex flex-col justify-between items-center text-center font-sans select-none text-black shadow-sm"
                    >
                      <div className="w-full">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-800 truncate">
                          {nombreTienda}
                        </p>
                        <p className="text-[10px] font-bold text-black truncate leading-tight mt-0.5">
                          {v.productoNombre}
                        </p>
                      </div>

                      <div className="w-full flex justify-center my-0.5 overflow-hidden">
                        <svg
                          ref={(el) => {
                            svgRefs.current[v.sku] = el;
                          }}
                          className="max-h-[42px] max-w-full"
                        />
                      </div>

                      <div className="w-full flex items-center justify-between pt-1 border-t border-gray-300 text-[10px]">
                        <span className="font-semibold">
                          T: {v.tallaValor} • {v.colorNombre}
                        </span>
                        <span className="font-bold text-xs">{formatoCOP(v.precio)}</span>
                      </div>
                    </div>
                  ))
                )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={imprimirEtiquetas}
            disabled={totalEtiquetas === 0}
            className="flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Printer className="h-4 w-4" />
            Imprimir {totalEtiquetas} Etiquetas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
