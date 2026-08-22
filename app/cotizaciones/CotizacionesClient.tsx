"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRightLeft,
  Ban,
  Eye,
  Plus,
  Printer,
  RefreshCw,
  Search,
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
import { anularVenta, convertirDocumento, type VentaLista } from "@/lib/actions/ventas";
import { TicketPrintModal } from "@/components/ventas/TicketPrintModal";

type VentaRow = VentaLista & Record<string, unknown>;

interface CotizacionesClientProps {
  cotizacionesIniciales: VentaLista[];
}

export default function CotizacionesClient({ cotizacionesIniciales }: CotizacionesClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<VentaLista | null>(null);

  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalConvertirOpen, setModalConvertirOpen] = useState(false);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [modalPrintOpen, setModalPrintOpen] = useState(false);

  const [metodoPago, setMetodoPago] = useState<string>("EFECTIVO");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cotizacionesFiltradas = useMemo(() => {
    return cotizacionesIniciales.filter((c) => {
      const codigo = `C-${String(c.consecutivo).padStart(4, "0")}`;
      const matchBusqueda =
        !busqueda ||
        codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.cliente?.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.vendedor?.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase());

      const matchEstado = filtroEstado === "TODOS" || c.estado === filtroEstado;

      return matchBusqueda && matchEstado;
    }) as VentaRow[];
  }, [cotizacionesIniciales, busqueda, filtroEstado]);

  async function handleConvertir() {
    if (!cotizacionSeleccionada) return;

    const pagos = [
      {
        metodo: metodoPago,
        monto: cotizacionSeleccionada.total,
        referencia: referenciaPago || undefined,
      },
    ];

    const res = await convertirDocumento(cotizacionSeleccionada.id, "VENTA", pagos);

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setModalConvertirOpen(false);
    setCotizacionSeleccionada(null);
    setErrorMsg(null);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleAnular() {
    if (!cotizacionSeleccionada) return;
    if (!motivoAnulacion.trim()) {
      setErrorMsg("Debes ingresar un motivo de anulación");
      return;
    }

    const res = await anularVenta({
      id: cotizacionSeleccionada.id,
      motivo: motivoAnulacion.trim(),
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setModalAnularOpen(false);
    setMotivoAnulacion("");
    setCotizacionSeleccionada(null);
    setErrorMsg(null);
    startTransition(() => {
      router.refresh();
    });
  }

  const columns = [
    {
      key: "consecutivo",
      label: "Cotización",
      render: (c: VentaRow) => (
        <span className="font-mono font-bold text-slate-900">
          C-{String(c.consecutivo).padStart(4, "0")}
        </span>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      render: (c: VentaRow) => (
        <span className="text-xs text-slate-600">
          {new Date(c.createdAt).toLocaleString("es-CO", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      key: "cliente",
      label: "Cliente",
      render: (c: VentaRow) => (
        <span className="font-medium text-slate-800">
          {c.cliente?.nombre ?? "Cliente General"}
        </span>
      ),
    },
    {
      key: "vendedor",
      label: "Vendedor",
      render: (c: VentaRow) => (
        <span className="text-slate-600">
          {c.vendedor?.nombre ?? "-"}
        </span>
      ),
    },
    {
      key: "items",
      label: "Ítems",
      render: (c: VentaRow) => (
        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
          {c.items.reduce((a, i) => a + i.cantidad, 0)} arts
        </span>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (c: VentaRow) => (
        <span className="font-extrabold text-slate-900">
          {formatoCOP(c.total)}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (c: VentaRow) => {
        if (c.estado === "COMPLETADA") {
          return <Badge variant="success">Convertida a Venta</Badge>;
        }
        if (c.estado === "PENDIENTE") {
          return <Badge variant="warning">Vigente / Pendiente</Badge>;
        }
        return <Badge variant="danger">Anulada</Badge>;
      },
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (c: VentaRow) => (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            title="Ver Detalle"
            onClick={() => {
              setCotizacionSeleccionada(c);
              setModalDetalleOpen(true);
            }}
          >
            <Eye className="h-4 w-4 text-slate-600" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            title="Imprimir Proforma 80mm"
            onClick={() => {
              setCotizacionSeleccionada(c);
              setModalPrintOpen(true);
            }}
          >
            <Printer className="h-4 w-4 text-brand-600" />
          </Button>

          {c.estado === "PENDIENTE" && (
            <Button
              size="icon"
              variant="ghost"
              title="Convertir a Venta"
              onClick={() => {
                setCotizacionSeleccionada(c);
                setErrorMsg(null);
                setReferenciaPago("");
                setModalConvertirOpen(true);
              }}
            >
              <ArrowRightLeft className="h-4 w-4 text-emerald-600" />
            </Button>
          )}

          {c.estado !== "ANULADA" && (
            <Button
              size="icon"
              variant="ghost"
              title="Anular Cotización"
              onClick={() => {
                setCotizacionSeleccionada(c);
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
        title="Cotizaciones"
        description="Generación y conversión de presupuestos a ventas efectivas."
        actions={
          <Link href="/ventas/nueva?tipo=COTIZACION">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nueva Cotización
            </Button>
          </Link>
        }
      />

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por N° Cotización, cliente…"
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
                <SelectItem value="PENDIENTE">Vigentes / Pendientes</SelectItem>
                <SelectItem value="COMPLETADA">Convertidas a Venta</SelectItem>
                <SelectItem value="ANULADA">Anuladas</SelectItem>
              </SelectContent>
            </Select>
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
      </div>

      <DataTable
        columns={columns}
        data={cotizacionesFiltradas}
        pageTitle="Cotizaciones Registradas"
      />

      {/* MODAL DETALLE DE COTIZACIÓN */}
      <Dialog open={modalDetalleOpen} onOpenChange={setModalDetalleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalle de Cotización C-{String(cotizacionSeleccionada?.consecutivo ?? 0).padStart(4, "0")}
            </DialogTitle>
            <DialogDescription>
              Emitida el {cotizacionSeleccionada ? new Date(cotizacionSeleccionada.createdAt).toLocaleString("es-CO") : ""}
            </DialogDescription>
          </DialogHeader>

          {cotizacionSeleccionada && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg">
                <div>
                  <span className="text-slate-500 block">Cliente:</span>
                  <span className="font-semibold text-slate-800">
                    {cotizacionSeleccionada.cliente?.nombre ?? "Cliente General"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vendedor:</span>
                  <span className="font-semibold text-slate-800">
                    {cotizacionSeleccionada.vendedor?.nombre ?? "Sin asignar"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bodega:</span>
                  <span className="font-semibold text-slate-800">
                    {cotizacionSeleccionada.bodega.nombre}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Presupuesto de Ítems ({cotizacionSeleccionada.items.length})
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Artículo</th>
                        <th className="p-2 text-center">Cant</th>
                        <th className="p-2 text-right">Precio Unit</th>
                        <th className="p-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {cotizacionSeleccionada.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2">
                            <div className="font-medium text-slate-800">{item.variante.sku}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.variante.color.nombre} / T.{item.variante.talla.valor}
                            </div>
                          </td>
                          <td className="p-2 text-center font-bold">{item.cantidad}</td>
                          <td className="p-2 text-right">{formatoCOP(item.precioUnitario)}</td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {formatoCOP(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg font-bold text-sm text-slate-900">
                <span>TOTAL PRESUPUESTADO:</span>
                <span>{formatoCOP(cotizacionSeleccionada.total)}</span>
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

      {/* MODAL CONVERTIR A VENTA */}
      <Dialog open={modalConvertirOpen} onOpenChange={setModalConvertirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <ArrowRightLeft className="h-5 w-5" /> Convertir Cotización a Venta
            </DialogTitle>
            <DialogDescription>
              Se validará el stock disponible en la bodega, se descontará el inventario
              y se generará la factura de venta formal C-
              {String(cotizacionSeleccionada?.consecutivo ?? 0).padStart(4, "0")}.
            </DialogDescription>
          </DialogHeader>

          {cotizacionSeleccionada && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>Monto Total Venta:</span>
                  <span>{formatoCOP(cotizacionSeleccionada.total)}</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Al confirmar, los productos serán descontados automáticamente del inventario.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Método de Pago *
                  </label>
                  <Select value={metodoPago} onValueChange={setMetodoPago}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                      <SelectItem value="TARJETA">Tarjeta Débito/Crédito</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Referencia / Comprobante (Opcional)
                  </label>
                  <Input
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                    placeholder="Ej. N° transferencia o boucher..."
                  />
                </div>

                {errorMsg && <p className="text-xs font-semibold text-red-500">{errorMsg}</p>}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalConvertirOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConvertir}
              disabled={pending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {pending ? "Procesando…" : "Validar Stock, Cobrar y Vender"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ANULAR COTIZACIÓN */}
      <Dialog open={modalAnularOpen} onOpenChange={setModalAnularOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Anular Cotización C-
              {String(cotizacionSeleccionada?.consecutivo ?? 0).padStart(4, "0")}
            </DialogTitle>
            <DialogDescription>
              La cotización pasará a estado ANULADA.
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
              placeholder="Ingresa el motivo de anulación…"
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

      {/* TICKET MODAL */}
      <TicketPrintModal
        open={modalPrintOpen}
        onOpenChange={setModalPrintOpen}
        venta={cotizacionSeleccionada}
      />
    </div>
  );
}
