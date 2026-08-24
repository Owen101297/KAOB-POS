"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Barcode,
  Check,
  CheckCircle2,
  DollarSign,
  Loader2,
  Minus,
  Plus,
  PlusCircle,
  Receipt,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatoCOP } from "@/lib/format";
import { buscarProductosPOS, type ProductoPOS } from "@/lib/actions/ventas";
import { registrarCompra } from "@/lib/actions/compras";

interface ProveedorItem {
  id: number;
  nombre: string;
  nit: string | null;
}

interface BodegaItem {
  id: number;
  nombre: string;
}

interface ItemCompraCarrito {
  varianteId: number;
  sku: string;
  nombre: string;
  color: string;
  talla: string;
  costoUnitario: number;
  cantidad: number;
}

interface DocumentoSoporteClientProps {
  proveedores: ProveedorItem[];
  bodegas: BodegaItem[];
}

export default function DocumentoSoporteClient({
  proveedores,
  bodegas,
}: DocumentoSoporteClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [proveedorId, setProveedorId] = useState<number | "">(
    proveedores[0]?.id ?? ""
  );
  const [bodegaId, setBodegaId] = useState<number>(bodegas[0]?.id ?? 1);
  const [numeroFactura, setNumeroFactura] = useState("");
  const [nota, setNota] = useState("");
  const [impuesto, setImpuesto] = useState(0);

  // Carrito de compras
  const [items, setItems] = useState<ItemCompraCarrito[]>([]);

  // Pagos
  const [metodoPago, setMetodoPago] = useState<string>("TRANSFERENCIA");
  const [referenciaPago, setReferenciaPago] = useState("");

  // Búsqueda de productos
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoPOS[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoMsg, setExitoMsg] = useState<string | null>(null);

  const subtotal = useMemo(
    () => items.reduce((a, i) => a + i.cantidad * i.costoUnitario, 0),
    [items]
  );
  const total = subtotal + impuesto;

  const debounceRef = useRef<NodeJS.Timeout>();
  const handleBusqueda = (value: string) => {
    setBusqueda(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCargandoProductos(true);
      try {
        const res = (await buscarProductosPOS(
          value,
          bodegaId
        )) as ProductoPOS[];
        setResultados(res);
      } catch {
        setResultados([]);
      } finally {
        setCargandoProductos(false);
      }
    }, 150);
  };

  function agregarItem(
    v: ProductoPOS["variantes"][number],
    p: ProductoPOS
  ) {
    setItems((prev) => {
      const existe = prev.find((i) => i.varianteId === v.id);
      if (existe) {
        return prev.map((i) =>
          i.varianteId === v.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          varianteId: v.id,
          sku: v.sku,
          nombre: p.nombre,
          color: v.color.nombre,
          talla: v.talla.valor,
          costoUnitario: p.costo,
          cantidad: 1,
        },
      ];
    });
    setBusqueda("");
    setResultados([]);
  }

  function actualizarCantidad(varianteId: number, delta: number) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.varianteId !== varianteId) return i;
        return { ...i, cantidad: Math.max(1, i.cantidad + delta) };
      })
    );
  }

  function actualizarCosto(varianteId: number, costo: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.varianteId === varianteId
          ? { ...i, costoUnitario: Math.max(0, costo) }
          : i
      )
    );
  }

  function eliminarItem(varianteId: number) {
    setItems((prev) => prev.filter((i) => i.varianteId !== varianteId));
  }

  async function handleGuardarCompra() {
    setErrorMsg(null);
    setExitoMsg(null);

    if (!proveedorId) {
      setErrorMsg("Selecciona un proveedor.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Agrega al menos un producto al documento soporte.");
      return;
    }

    const pagos = total > 0 ? [{ metodo: metodoPago as any, monto: total, referencia: referenciaPago || undefined }] : [];

    const res = await registrarCompra({
      numeroFactura: numeroFactura.trim() || undefined,
      proveedorId: Number(proveedorId),
      bodegaId,
      items: items.map((i) => ({
        varianteId: i.varianteId,
        cantidad: i.cantidad,
        costoUnitario: i.costoUnitario,
      })),
      pagos,
      impuesto,
      nota: nota.trim() || undefined,
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setExitoMsg(`✅ Documento Soporte ${res.data.codigo} registrado exitosamente.`);
    setItems([]);
    setNumeroFactura("");
    setNota("");
    setImpuesto(0);
    setReferenciaPago("");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Documento Soporte / Compra"
        description="Recepción de mercancía de proveedores con ingreso automático de inventario y costo."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* COLUMNA IZQUIERDA: FORMULARIO DATOS GENERALES Y BÚSQUEDA */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-5 w-5 text-brand-600" /> Datos del Proveedor
              </CardTitle>
              <CardDescription>
                Información de cabecera de la factura de compra
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Proveedor *
                  </label>
                  {proveedores.length === 0 && (
                    <a
                      href="/proveedores"
                      className="text-[11px] font-bold text-brand-600 hover:underline"
                    >
                      + Crear Proveedor
                    </a>
                  )}
                </div>
                <select
                  value={proveedorId ? String(proveedorId) : ""}
                  onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : "")}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                >
                  <option value="">Seleccionar proveedor…</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.nombre} {p.nit ? `(NIT ${p.nit})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bodega Destino *
                </label>
                <select
                  value={String(bodegaId)}
                  onChange={(e) => setBodegaId(Number(e.target.value))}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                >
                  {bodegas.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  N° Factura Proveedor / Remisión
                </label>
                <Input
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  placeholder="Ej. FACT-9821..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observaciones / Notas
                </label>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs outline-none focus:border-brand-500"
                  placeholder="Notas adicionales de la compra..."
                />
              </div>
            </CardContent>
          </Card>

          {/* BUSCADOR DE PRODUCTOS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-5 w-5 text-brand-600" /> Buscar Artículos
              </CardTitle>
              <CardDescription>
                Busca productos por referencia, SKU o nombre para agregar a la compra
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={busqueda}
                  onChange={(e) => handleBusqueda(e.target.value)}
                  placeholder="Ref, SKU o nombre de prenda…"
                  className="pl-9 h-9"
                />
                {cargandoProductos && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500 animate-spin" />
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {resultados.map((p) => (
                  <div key={p.id} className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-xs">
                    <p className="font-bold text-slate-800">{p.nombre}</p>
                    <p className="text-[11px] text-slate-400 font-mono mb-2">{p.referencia}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.variantes.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => agregarItem(v, p)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] hover:border-brand-500 hover:bg-brand-50 font-semibold"
                        >
                          {v.color.nombre} / T.{v.talla.valor}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: DETALLE DE ÍTEMS Y TOTALES */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Detalle de Artículos Recibidos</CardTitle>
                <CardDescription>
                  Ingresa las cantidades y el costo unitario de compra por prenda
                </CardDescription>
              </div>
              {items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setItems([])}>
                  <Trash2 className="h-4 w-4 mr-1 text-red-500" /> Vaciar
                </Button>
              )}
            </CardHeader>

            <CardContent className="pt-4">
              {items.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No hay artículos agregados"
                  description="Utiliza el buscador para añadir prendas a este documento de compra."
                  className="py-12"
                />
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Artículo / Variante</th>
                        <th className="p-2.5 text-center w-28">Cantidad</th>
                        <th className="p-2.5 text-right w-32">Costo Unit</th>
                        <th className="p-2.5 text-right w-32">Subtotal</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((item) => (
                        <tr key={item.varianteId}>
                          <td className="p-2.5">
                            <p className="font-bold text-slate-800">{item.nombre}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {item.sku} · {item.color} / T.{item.talla}
                            </p>
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => actualizarCantidad(item.varianteId, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-bold text-slate-800">
                                {item.cantidad}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => actualizarCantidad(item.varianteId, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-2.5 text-right">
                            <Input
                              type="number"
                              min={0}
                              step={500}
                              value={item.costoUnitario}
                              onChange={(e) =>
                                actualizarCosto(
                                  item.varianteId,
                                  Number(e.target.value) || 0
                                )
                              }
                              className="h-8 text-right font-bold text-xs"
                            />
                          </td>
                          <td className="p-2.5 text-right font-extrabold text-slate-900">
                            {formatoCOP(item.cantidad * item.costoUnitario)}
                          </td>
                          <td className="p-2.5 text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => eliminarItem(item.varianteId)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TOTALES Y FORMA DE PAGO */}
              <div className="mt-6 pt-4 border-t border-slate-200 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-3 bg-slate-50 p-3 rounded-lg text-xs">
                    <label className="font-bold text-slate-700 block">Forma de Pago del Documento</label>
                    <Select value={metodoPago} onValueChange={setMetodoPago}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRANSFERENCIA">Transferencia Bancaria</SelectItem>
                        <SelectItem value="EFECTIVO">Efectivo de Caja</SelectItem>
                        <SelectItem value="TARJETA">Tarjeta Débito/Crédito</SelectItem>
                        <SelectItem value="OTRO">Crédito Proveedor / Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Referencia de pago / N° boucher..."
                      value={referenciaPago}
                      onChange={(e) => setReferenciaPago(e.target.value)}
                    />
                  </div>

                  <div className="bg-slate-100 p-3 rounded-lg text-xs space-y-1 text-right">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span>{formatoCOP(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 items-center">
                      <span>Impuestos / Flete:</span>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={impuesto}
                        onChange={(e) => setImpuesto(Number(e.target.value) || 0)}
                        className="h-7 w-28 text-right font-semibold text-xs ml-2 inline-block"
                      />
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-300 pt-2 mt-2">
                      <span>TOTAL COMPRA:</span>
                      <span>{formatoCOP(total)}</span>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {exitoMsg && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {exitoMsg}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="justify-end gap-2 border-t border-slate-100 pt-4">
              <Button
                onClick={handleGuardarCompra}
                disabled={pending || items.length === 0}
                className="h-11 px-6 text-sm"
              >
                {pending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                Registrar Compra e Ingresar Inventario
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
