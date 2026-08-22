"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  Loader2,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { formatoCOP } from "@/lib/format";
import { buscarProductosPOS, type ProductoPOS } from "@/lib/actions/ventas";
import { crearOrdenCompra, type OrdenCompraLista } from "@/lib/actions/compras";

type OrdenRow = OrdenCompraLista & Record<string, unknown>;

interface ProveedorItem {
  id: number;
  nombre: string;
}

interface BodegaItem {
  id: number;
  nombre: string;
}

interface OrdenesCompraClientProps {
  ordenesIniciales: OrdenCompraLista[];
  proveedores: ProveedorItem[];
  bodegas: BodegaItem[];
}

export default function OrdenesCompraClient({
  ordenesIniciales,
  proveedores,
  bodegas,
}: OrdenesCompraClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [busqueda, setBusqueda] = useState("");
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenCompraLista | null>(null);

  const [modalNuevaOpen, setModalNuevaOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  // Formulario nueva orden
  const [proveedorId, setProveedorId] = useState<number | "">(proveedores[0]?.id ?? "");
  const [bodegaId, setBodegaId] = useState<number>(bodegas[0]?.id ?? 1);
  const [nota, setNota] = useState("");
  const [detalles, setDetalles] = useState<
    { varianteId: number; sku: string; nombre: string; color: string; talla: string; cantidad: number; costoEstimado: number }[]
  >([]);

  // Búsqueda variantes en modal
  const [busquedaVar, setBusquedaVar] = useState("");
  const [resultadosVar, setResultadosVar] = useState<ProductoPOS[]>([]);
  const [cargandoVar, setCargandoVar] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ordenesFiltradas = useMemo(() => {
    return ordenesIniciales.filter((o) => {
      const codigo = `OC-${String(o.consecutivo).padStart(4, "0")}`;
      const matchBusqueda =
        !busqueda ||
        codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (o.proveedor?.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase());
      return matchBusqueda;
    }) as OrdenRow[];
  }, [ordenesIniciales, busqueda]);

  const debounceRef = useRef<NodeJS.Timeout>();
  const handleBusquedaVar = (value: string) => {
    setBusquedaVar(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.length < 2) {
      setResultadosVar([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setCargandoVar(true);
      try {
        const res = (await buscarProductosPOS(value, bodegaId, false)) as ProductoPOS[];
        setResultadosVar(res);
      } catch {
        setResultadosVar([]);
      } finally {
        setCargandoVar(false);
      }
    }, 250);
  };

  function agregarDetalle(
    v: ProductoPOS["variantes"][number],
    p: ProductoPOS
  ) {
    setDetalles((prev) => {
      const existe = prev.find((d) => d.varianteId === v.id);
      if (existe) {
        return prev.map((d) =>
          d.varianteId === v.id ? { ...d, cantidad: d.cantidad + 1 } : d
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
          cantidad: 1,
          costoEstimado: p.costo,
        },
      ];
    });
    setBusquedaVar("");
    setResultadosVar([]);
  }

  async function handleCrearOrden() {
    setErrorMsg(null);
    if (!proveedorId) {
      setErrorMsg("Selecciona un proveedor.");
      return;
    }
    if (detalles.length === 0) {
      setErrorMsg("Agrega al menos un artículo a la orden.");
      return;
    }

    const res = await crearOrdenCompra({
      proveedorId: Number(proveedorId),
      bodegaId,
      detalles: detalles.map((d) => ({
        varianteId: d.varianteId,
        cantidad: d.cantidad,
        costoEstimado: d.costoEstimado,
      })),
      nota: nota.trim() || undefined,
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setModalNuevaOpen(false);
    setDetalles([]);
    setNota("");
    setErrorMsg(null);
    startTransition(() => {
      router.refresh();
    });
  }

  const columns = [
    {
      key: "consecutivo",
      label: "Orden N°",
      render: (o: OrdenRow) => (
        <span className="font-mono font-bold text-slate-900">
          OC-{String(o.consecutivo).padStart(4, "0")}
        </span>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      render: (o: OrdenRow) => (
        <span className="text-xs text-slate-600">
          {new Date(o.createdAt).toLocaleString("es-CO", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      key: "proveedor",
      label: "Proveedor",
      render: (o: OrdenRow) => (
        <span className="font-medium text-slate-800">
          {o.proveedor?.nombre ?? "-"}
        </span>
      ),
    },
    {
      key: "bodega",
      label: "Bodega Destino",
      render: (o: OrdenRow) => (
        <span className="text-slate-600 text-xs font-semibold">
          {o.bodega?.nombre ?? "-"}
        </span>
      ),
    },
    {
      key: "detalles",
      label: "Ítems",
      render: (o: OrdenRow) => (
        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
          {o.detalles.reduce((a, d) => a + d.cantidad, 0)} arts
        </span>
      ),
    },
    {
      key: "total",
      label: "Total Estimado",
      render: (o: OrdenRow) => (
        <span className="font-extrabold text-slate-900">
          {formatoCOP(o.total)}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (o: OrdenRow) => {
        if (o.estado === "RECIBIDA") return <Badge variant="success">Recibida</Badge>;
        if (o.estado === "PENDIENTE") return <Badge variant="warning">Pendiente</Badge>;
        return <Badge variant="danger">Cancelada</Badge>;
      },
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (o: OrdenRow) => (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            title="Ver Detalle"
            onClick={() => {
              setOrdenSeleccionada(o);
              setModalDetalleOpen(true);
            }}
          >
            <Eye className="h-4 w-4 text-slate-600" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            title="Imprimir Orden"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 text-brand-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Órdenes de Compra"
        description="Generación y seguimiento de solicitudes de reabastecimiento a proveedores."
        actions={
          <Button onClick={() => setModalNuevaOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva Orden de Compra
          </Button>
        }
      />

      {/* FILTRO */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por Orden N°, proveedor…"
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          title="Refrescar"
          onClick={() => startTransition(() => router.refresh())}
        >
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={ordenesFiltradas}
        pageTitle="Órdenes Registradas"
      />

      {/* MODAL NUEVA ÓRDEN DE COMPRA */}
      <Dialog open={modalNuevaOpen} onOpenChange={setModalNuevaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
            <DialogDescription>
              Genera una solicitud preliminar de reabastecimiento para el proveedor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Proveedor *
                </label>
                <Select
                  value={proveedorId ? String(proveedorId) : ""}
                  onValueChange={(v) => setProveedorId(v ? Number(v) : "")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar proveedor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bodega Destino *
                </label>
                <Select
                  value={String(bodegaId)}
                  onValueChange={(v) => setBodegaId(Number(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegas.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* BÚSQUEDA PRODUCTOS */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Añadir Artículos a la Orden
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={busquedaVar}
                  onChange={(e) => handleBusquedaVar(e.target.value)}
                  placeholder="Buscar por referencia, SKU o nombre…"
                  className="pl-9 h-9"
                />
                {cargandoVar && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500 animate-spin" />
                )}
              </div>

              {resultadosVar.length > 0 && (
                <div className="max-h-40 overflow-y-auto mt-2 space-y-1 border border-slate-200 p-2 rounded-lg bg-slate-50">
                  {resultadosVar.map((p) => (
                    <div key={p.id} className="p-1">
                      <span className="font-bold text-slate-800">{p.nombre}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.variantes.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => agregarDetalle(v, p)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] hover:bg-brand-50"
                          >
                            {v.color.nombre} / T.{v.talla.valor}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ÍTEMS EN ORDEN */}
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Artículo</th>
                    <th className="p-2 text-center">Cant</th>
                    <th className="p-2 text-right">Costo Est.</th>
                    <th className="p-2 text-right">Subtotal</th>
                    <th className="p-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {detalles.map((d) => (
                    <tr key={d.varianteId}>
                      <td className="p-2 font-medium text-slate-800">
                        {d.nombre} ({d.color} / T.{d.talla})
                      </td>
                      <td className="p-2 text-center font-bold">{d.cantidad}</td>
                      <td className="p-2 text-right">{formatoCOP(d.costoEstimado)}</td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        {formatoCOP(d.cantidad * d.costoEstimado)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setDetalles((prev) =>
                              prev.filter((item) => item.varianteId !== d.varianteId)
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {detalles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                        Sin artículos agregados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nota</label>
              <Input
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Observaciones de la orden..."
              />
            </div>

            {errorMsg && <p className="font-semibold text-red-500">{errorMsg}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalNuevaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearOrden} disabled={pending || detalles.length === 0}>
              {pending ? "Creando…" : "Crear Orden de Compra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DETALLE DE ÓRDEN DE COMPRA */}
      <Dialog open={modalDetalleOpen} onOpenChange={setModalDetalleOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Orden de Compra OC-{String(ordenSeleccionada?.consecutivo ?? 0).padStart(4, "0")}
            </DialogTitle>
            <DialogDescription>
              Emitida el {ordenSeleccionada ? new Date(ordenSeleccionada.createdAt).toLocaleString("es-CO") : ""}
            </DialogDescription>
          </DialogHeader>

          {ordenSeleccionada && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg">
                <div>
                  <span className="text-slate-500 block">Proveedor:</span>
                  <span className="font-bold text-slate-800">
                    {ordenSeleccionada.proveedor?.nombre ?? "Desconocido"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bodega:</span>
                  <span className="font-semibold text-slate-800">
                    {ordenSeleccionada.bodega.nombre}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Artículo</th>
                      <th className="p-2 text-center">Cant</th>
                      <th className="p-2 text-right">Costo Est.</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ordenSeleccionada.detalles.map((d) => (
                      <tr key={d.id}>
                        <td className="p-2 font-medium text-slate-800">
                          {d.variante.producto?.nombre ?? d.variante.sku} ({d.variante.color.nombre} / T.{d.variante.talla.valor})
                        </td>
                        <td className="p-2 text-center font-bold">{d.cantidad}</td>
                        <td className="p-2 text-right">{formatoCOP(d.costoEstimado)}</td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          {formatoCOP(d.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg font-extrabold text-sm text-slate-900">
                <span>TOTAL ESTIMADO:</span>
                <span>{formatoCOP(ordenSeleccionada.total)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setModalDetalleOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
