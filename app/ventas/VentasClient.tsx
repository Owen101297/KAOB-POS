"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Ban,
  Eye,
  FileText,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
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
import { anularVenta, type VentaLista } from "@/lib/actions/ventas";
import { TicketPrintModal } from "@/components/ventas/TicketPrintModal";

type VentaRow = VentaLista & Record<string, unknown>;

interface VentasClientProps {
  ventasIniciales: VentaLista[];
  statsIniciales: {
    ventas: { total: number; cantidad: number };
    remisiones: { total: number; cantidad: number };
    cotizaciones: { cantidad: number };
  };
}

export default function VentasClient({ ventasIniciales, statsIniciales }: VentasClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaLista | null>(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [modalPrintOpen, setModalPrintOpen] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtrado de ventas
  const ventasFiltradas = useMemo(() => {
    return ventasIniciales.filter((v) => {
      const codigo = `V-${String(v.consecutivo).padStart(4, "0")}`;
      const matchBusqueda =
        !busqueda ||
        codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (v.cliente?.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (v.vendedor?.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase());

      const matchEstado = filtroEstado === "TODOS" || v.estado === filtroEstado;

      return matchBusqueda && matchEstado;
    }) as VentaRow[];
  }, [ventasIniciales, busqueda, filtroEstado]);

  // Ticket promedio
  const ticketPromedio = useMemo(() => {
    return statsIniciales.ventas.cantidad > 0
      ? Math.round(statsIniciales.ventas.total / statsIniciales.ventas.cantidad)
      : 0;
  }, [statsIniciales]);

  async function handleAnular() {
    if (!ventaSeleccionada) return;
    if (!motivoAnulacion.trim()) {
      setErrorMsg("Debes ingresar un motivo de anulación");
      return;
    }

    const res = await anularVenta({
      id: ventaSeleccionada.id,
      motivo: motivoAnulacion.trim(),
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setModalAnularOpen(false);
    setMotivoAnulacion("");
    setVentaSeleccionada(null);
    setErrorMsg(null);
    startTransition(() => {
      router.refresh();
    });
  }

  const columns = [
    {
      key: "consecutivo",
      label: "Factura",
      render: (v: VentaRow) => (
        <span className="font-mono font-bold text-slate-900">
          V-{String(v.consecutivo).padStart(4, "0")}
        </span>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      render: (v: VentaRow) => (
        <span className="text-xs text-slate-600">
          {new Date(v.createdAt).toLocaleString("es-CO", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      key: "cliente",
      label: "Cliente",
      render: (v: VentaRow) => (
        <span className="font-medium text-slate-800">
          {v.cliente?.nombre ?? "Cliente General"}
        </span>
      ),
    },
    {
      key: "vendedor",
      label: "Vendedor",
      render: (v: VentaRow) => (
        <span className="text-slate-600">
          {v.vendedor?.nombre ?? "-"}
        </span>
      ),
    },
    {
      key: "items",
      label: "Ítems",
      render: (v: VentaRow) => (
        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
          {v.items.reduce((a, i) => a + i.cantidad, 0)} arts
        </span>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (v: VentaRow) => (
        <span className="font-extrabold text-slate-900">
          {formatoCOP(v.total)}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (v: VentaRow) => {
        if (v.estado === "COMPLETADA") {
          return <Badge variant="success">Completada</Badge>;
        }
        if (v.estado === "PENDIENTE") {
          return <Badge variant="warning">Pendiente</Badge>;
        }
        return <Badge variant="danger">Anulada</Badge>;
      },
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (v: VentaRow) => (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            title="Ver Detalle"
            onClick={() => {
              setVentaSeleccionada(v);
              setModalDetalleOpen(true);
            }}
          >
            <Eye className="h-4 w-4 text-slate-600" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            title="Imprimir Ticket 80mm"
            onClick={() => {
              setVentaSeleccionada(v);
              setModalPrintOpen(true);
            }}
          >
            <Printer className="h-4 w-4 text-brand-600" />
          </Button>

          {v.estado !== "ANULADA" && (
            <Button
              size="icon"
              variant="ghost"
              title="Anular Venta"
              onClick={() => {
                setVentaSeleccionada(v);
                setErrorMsg(null);
                setMotivoAnulacion("");
                setModalAnularOpen(true);
              }}
            >
              <Ban className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Histórico de Ventas"
        description="Consulta, reimpresión de comanda y anulación de ventas procesadas."
        actions={
          <Link href="/ventas/nueva">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nueva Venta
            </Button>
          </Link>
        }
      />

      {/* METRICAS DEL DÍA */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ventas del Día"
          value={formatoCOP(statsIniciales.ventas.total)}
          hint={`${statsIniciales.ventas.cantidad} transacciones completadas`}
          icon={<ShoppingBag className="h-5 w-5" />}
          color="brand"
        />
        <StatCard
          label="Ticket Promedio"
          value={formatoCOP(ticketPromedio)}
          hint="Promedio por venta hoy"
          icon={<TrendingUp className="h-5 w-5" />}
          color="sky"
        />
        <StatCard
          label="Remisiones Hoy"
          value={formatoCOP(statsIniciales.remisiones.total)}
          hint={`${statsIniciales.remisiones.cantidad} remisiones emitidas`}
          icon={<Receipt className="h-5 w-5" />}
          color="amber"
        />
        <StatCard
          label="Cotizaciones Hoy"
          value={String(statsIniciales.cotizaciones.cantidad)}
          hint="Cotizaciones generadas hoy"
          icon={<FileText className="h-5 w-5" />}
          color="violet"
        />
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por N° Factura, cliente, vendedor…"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-44">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los estados</SelectItem>
                <SelectItem value="COMPLETADA">Completadas</SelectItem>
                <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                <SelectItem value="ANULADA">Anuladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            title="Refrescar lista"
            onClick={() => startTransition(() => router.refresh())}
          >
            <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* TABLA DE VENTAS */}
      <DataTable
        columns={columns}
        data={ventasFiltradas}
        pageTitle="Ventas Registradas"
      />

      {/* MODAL DETALLE DE VENTA */}
      <Dialog open={modalDetalleOpen} onOpenChange={setModalDetalleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalle de Venta V-{String(ventaSeleccionada?.consecutivo ?? 0).padStart(4, "0")}
            </DialogTitle>
            <DialogDescription>
              Procesada el {ventaSeleccionada ? new Date(ventaSeleccionada.createdAt).toLocaleString("es-CO") : ""}
            </DialogDescription>
          </DialogHeader>

          {ventaSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg text-xs">
                <div>
                  <span className="text-slate-500 block">Cliente:</span>
                  <span className="font-semibold text-slate-800">
                    {ventaSeleccionada.cliente?.nombre ?? "Cliente General"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vendedor:</span>
                  <span className="font-semibold text-slate-800">
                    {ventaSeleccionada.vendedor?.nombre ?? "Sin asignar"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bodega:</span>
                  <span className="font-semibold text-slate-800">
                    {ventaSeleccionada.bodega.nombre}
                  </span>
                </div>
              </div>

              {/* DESGLOSE ÍTEMS */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Ítems Vendidos ({ventaSeleccionada.items.length})
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Artículo</th>
                        <th className="p-2 text-center">Cant</th>
                        <th className="p-2 text-right">Precio Unit</th>
                        <th className="p-2 text-right">Desc</th>
                        <th className="p-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {ventaSeleccionada.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2">
                            <div className="font-medium text-slate-800">{item.variante.sku}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.variante.color.nombre} / T.{item.variante.talla.valor}
                            </div>
                          </td>
                          <td className="p-2 text-center font-bold">{item.cantidad}</td>
                          <td className="p-2 text-right">{formatoCOP(item.precioUnitario)}</td>
                          <td className="p-2 text-right text-red-500">
                            {item.descuento > 0 ? `-${formatoCOP(item.descuento)}` : "-"}
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {formatoCOP(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DESGLOSE DE PAGOS Y TOTALES */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Métodos de Pago</span>
                  {ventaSeleccionada.pagos.map((pago) => (
                    <div key={pago.id} className="flex justify-between text-slate-600">
                      <span>{pago.metodo} {pago.referencia ? `(${pago.referencia})` : ""}</span>
                      <span className="font-semibold">{formatoCOP(pago.monto)}</span>
                    </div>
                  ))}
                  {ventaSeleccionada.pagos.length === 0 && (
                    <span className="text-slate-400 italic">Sin registros de pago detallados</span>
                  )}
                </div>

                <div className="bg-slate-100 p-3 rounded-lg space-y-1 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatoCOP(ventaSeleccionada.subtotal)}</span>
                  </div>
                  {ventaSeleccionada.descuento > 0 && (
                    <div className="flex justify-between text-red-600 font-semibold">
                      <span>Descuento global:</span>
                      <span>-{formatoCOP(ventaSeleccionada.descuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-300 pt-1 mt-1">
                    <span>TOTAL:</span>
                    <span>{formatoCOP(ventaSeleccionada.total)}</span>
                  </div>
                </div>
              </div>

              {ventaSeleccionada.nota && (
                <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-lg">
                  <span className="font-bold">Observación:</span> {ventaSeleccionada.nota}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setModalDetalleOpen(false);
                setModalPrintOpen(true);
              }}
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir Comprobante
            </Button>
            <Button variant="ghost" onClick={() => setModalDetalleOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ANULAR VENTA */}
      <Dialog open={modalAnularOpen} onOpenChange={setModalAnularOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Anular Venta V-
              {String(ventaSeleccionada?.consecutivo ?? 0).padStart(4, "0")}
            </DialogTitle>
            <DialogDescription>
              Esta acción revertirá el stock de los productos vendidos e incrementará el inventario
              en la bodega correspondientes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Motivo de anulación *
            </label>
            <textarea
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Ingresa la razón por la cual se anula la venta (ej. devolución por garantía, error de digitación)…"
            />
            {errorMsg && <p className="text-xs font-semibold text-red-500">{errorMsg}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalAnularOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleAnular}
              disabled={pending || !motivoAnulacion.trim()}
            >
              {pending ? "Anulando…" : "Confirmar Anulación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL IMPRESIÓN DE TICKET */}
      <TicketPrintModal
        open={modalPrintOpen}
        onOpenChange={setModalPrintOpen}
        venta={ventaSeleccionada}
      />
    </div>
  );
}
