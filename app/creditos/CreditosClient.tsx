"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
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
import {
  obtenerEstadoCuentaCliente,
  registrarAbono,
  type CreditoLista,
} from "@/lib/actions/credito";

type CreditoRow = CreditoLista & Record<string, unknown>;

interface BodegaItem {
  id: number;
  nombre: string;
}

interface CreditosClientProps {
  creditosIniciales: CreditoLista[];
  resumenCartera: {
    totalCartera: number;
    totalMoroso: number;
    clientesEnMora: number;
    creditosActivos: number;
  };
  bodegas: BodegaItem[];
}

export default function CreditosClient({
  creditosIniciales,
  resumenCartera,
  bodegas,
}: CreditosClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");

  const [creditoSeleccionado, setCreditoSeleccionado] = useState<CreditoLista | null>(null);

  // Modal Registrar Abono
  const [modalAbonoOpen, setModalAbonoOpen] = useState(false);
  const [montoAbono, setMontoAbono] = useState<number | "">("");
  const [metodoPago, setMetodoPago] = useState<string>("EFECTIVO");
  const [referenciaAbono, setReferenciaAbono] = useState("");
  const [notaAbono, setNotaAbono] = useState("");
  const [bodegaId, setBodegaId] = useState<number>(bodegas[0]?.id ?? 1);
  const [errorAbono, setErrorAbono] = useState<string | null>(null);
  const [exitoAbono, setExitoAbono] = useState<string | null>(null);

  // Modal Estado de Cuenta Cliente
  const [modalEstadoCuentaOpen, setModalEstadoCuentaOpen] = useState(false);
  const [cargandoEstadoCuenta, setCargandoEstadoCuenta] = useState(false);
  const [estadoCuentaData, setEstadoCuentaData] = useState<any | null>(null);

  // Modal Comprobante Ticket 80mm
  const [modalTicketOpen, setModalTicketOpen] = useState(false);
  const [datosTicket, setDatosTicket] = useState<any | null>(null);

  const now = new Date();

  const creditosFiltrados = useMemo(() => {
    return creditosIniciales.filter((c) => {
      const codigo = `CR-${String(c.consecutivo).padStart(4, "0")}`;
      const matchBusqueda =
        !busqueda ||
        codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.cliente.documento ?? "").includes(busqueda);

      let matchEstado = true;
      if (filtroEstado === "PENDIENTE") matchEstado = c.estado === "PENDIENTE";
      else if (filtroEstado === "PAGADO") matchEstado = c.estado === "PAGADO";
      else if (filtroEstado === "VENCIDOS") {
        matchEstado = c.estado === "PENDIENTE" && new Date(c.fechaVencimiento) < now;
      }

      return matchBusqueda && matchEstado;
    }) as CreditoRow[];
  }, [creditosIniciales, busqueda, filtroEstado, now]);

  async function handleAbrirEstadoCuenta(clienteId: number) {
    setCargandoEstadoCuenta(true);
    setModalEstadoCuentaOpen(true);
    try {
      const data = await obtenerEstadoCuentaCliente(clienteId);
      setEstadoCuentaData(data);
    } catch {
      setEstadoCuentaData(null);
    } finally {
      setCargandoEstadoCuenta(false);
    }
  }

  async function handleGuardarAbono() {
    setErrorAbono(null);
    setExitoAbono(null);

    if (!creditoSeleccionado) return;
    const monto = Number(montoAbono);
    if (!monto || monto <= 0) {
      setErrorAbono("Ingresa un monto de abono válido mayor a 0.");
      return;
    }
    if (monto > creditoSeleccionado.saldoPendiente) {
      setErrorAbono(`El abono (${formatoCOP(monto)}) supera el saldo pendiente (${formatoCOP(creditoSeleccionado.saldoPendiente)}).`);
      return;
    }

    const res = await registrarAbono({
      creditoId: creditoSeleccionado.id,
      monto,
      metodo: metodoPago as any,
      referencia: referenciaAbono.trim() || undefined,
      nota: notaAbono.trim() || undefined,
      bodegaId,
    });

    if (!res.ok) {
      setErrorAbono(res.error);
      return;
    }

    setExitoAbono("✅ Abono registrado exitosamente.");
    setDatosTicket({
      codigoCredito: `CR-${String(creditoSeleccionado.consecutivo).padStart(4, "0")}`,
      cliente: creditoSeleccionado.cliente.nombre,
      montoAbonado: monto,
      nuevoSaldo: res.data.nuevoSaldo,
      fecha: new Date().toLocaleString("es-CO"),
      metodo: metodoPago,
      referencia: referenciaAbono,
    });

    setTimeout(() => {
      setModalAbonoOpen(false);
      setModalTicketOpen(true);
      setMontoAbono("");
      setReferenciaAbono("");
      setNotaAbono("");
      setCreditoSeleccionado(null);
      setErrorAbono(null);
      setExitoAbono(null);
      startTransition(() => {
        router.refresh();
      });
    }, 800);
  }

  const columns = [
    {
      key: "consecutivo",
      label: "N° Crédito",
      render: (c: CreditoRow) => (
        <span className="font-mono font-bold text-slate-900">
          CR-{String(c.consecutivo).padStart(4, "0")}
        </span>
      ),
    },
    {
      key: "cliente",
      label: "Cliente",
      render: (c: CreditoRow) => (
        <div>
          <div className="font-bold text-slate-800">{c.cliente.nombre}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {c.cliente.tipoDoc}: {c.cliente.documento ?? "Sin doc"}
          </div>
        </div>
      ),
    },
    {
      key: "vencimiento",
      label: "Vencimiento",
      render: (c: CreditoRow) => {
        const fecVenc = new Date(c.fechaVencimiento);
        const esVencido = c.estado === "PENDIENTE" && fecVenc < now;
        const diffDays = Math.ceil((fecVenc.getTime() - now.getTime()) / (1000 * 3600 * 24));

        return (
          <div>
            <div className="text-xs font-semibold text-slate-700">
              {fecVenc.toLocaleDateString("es-CO")}
            </div>
            {c.estado === "PAGADO" ? (
              <span className="text-[11px] text-emerald-600 font-bold">PAGADO COMPLETO</span>
            ) : esVencido ? (
              <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Vencido hace {Math.abs(diffDays)} días
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-600">
                Vence en {diffDays} días
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "total",
      label: "Total Crédito",
      render: (c: CreditoRow) => (
        <span className="font-semibold text-slate-700">{formatoCOP(c.montoTotal)}</span>
      ),
    },
    {
      key: "saldoPendiente",
      label: "Saldo Pendiente",
      render: (c: CreditoRow) => (
        <span className={`font-extrabold text-sm ${c.saldoPendiente > 0 ? "text-slate-900" : "text-emerald-600"}`}>
          {formatoCOP(c.saldoPendiente)}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (c: CreditoRow) => {
        const esVencido = c.estado === "PENDIENTE" && new Date(c.fechaVencimiento) < now;
        if (c.estado === "PAGADO") return <Badge variant="success">Pagado</Badge>;
        if (esVencido) return <Badge variant="danger">Vencido</Badge>;
        return <Badge variant="warning">Pendiente</Badge>;
      },
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (c: CreditoRow) => (
        <div className="flex items-center gap-1">
          {c.estado === "PENDIENTE" && (
            <Button
              size="sm"
              className="h-8 gap-1 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setCreditoSeleccionado(c);
                setMontoAbono(c.saldoPendiente);
                setErrorAbono(null);
                setExitoAbono(null);
                setModalAbonoOpen(true);
              }}
            >
              <DollarSign className="h-3.5 w-3.5" /> Abonar
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            title="Ver Estado de Cuenta del Cliente"
            onClick={() => handleAbrirEstadoCuenta(c.clienteId)}
          >
            <FileText className="h-4 w-4 text-brand-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Crédito y Cartera de Clientes"
        description="Gestión integral de ventas a crédito, saldos pendientes, alertas de mora y cobro de abonos."
      />

      {/* METRICAS CARTERA */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Cartera por Cobrar"
          value={formatoCOP(resumenCartera.totalCartera)}
          icon={<Wallet className="h-5 w-5 text-sky-600" />}
          color="sky"
          hint="Saldo total pendiente de cobro"
        />
        <StatCard
          label="Cartera Vencida (Mora)"
          value={formatoCOP(resumenCartera.totalMoroso)}
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
          color="red"
          hint="Créditos pasados de la fecha límite"
        />
        <StatCard
          label="Clientes en Mora"
          value={resumenCartera.clientesEnMora.toString()}
          icon={<Users className="h-5 w-5 text-amber-600" />}
          color="amber"
          hint="Clientes con facturas vencidas"
        />
        <StatCard
          label="Créditos Activos"
          value={resumenCartera.creditosActivos.toString()}
          icon={<UserCheck className="h-5 w-5 text-violet-600" />}
          color="violet"
          hint="Cuentas pendientes por liquidar"
        />
      </div>

      {/* FILTROS Y DATATABLE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, documento, N° Crédito…"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-48">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Estado Cartera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los créditos</SelectItem>
                <SelectItem value="PENDIENTE">Pendientes por pagar</SelectItem>
                <SelectItem value="VENCIDOS">Vencidos (Morosos)</SelectItem>
                <SelectItem value="PAGADO">Pagados completos</SelectItem>
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
        data={creditosFiltrados}
        pageTitle="Listado de Créditos de Cartera"
      />

      {/* MODAL REGISTRAR ABONO */}
      <Dialog open={modalAbonoOpen} onOpenChange={setModalAbonoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <DollarSign className="h-5 w-5" /> Registrar Abono a Crédito
            </DialogTitle>
            <DialogDescription>
              {creditoSeleccionado && (
                <>
                  Crédito <strong>CR-{String(creditoSeleccionado.consecutivo).padStart(4, "0")}</strong> · Cliente: <strong>{creditoSeleccionado.cliente.nombre}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {creditoSeleccionado && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block">Saldo Pendiente Actual:</span>
                  <span className="font-extrabold text-base text-slate-900">
                    {formatoCOP(creditoSeleccionado.saldoPendiente)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Total Original:</span>
                  <span className="font-semibold text-slate-700">
                    {formatoCOP(creditoSeleccionado.montoTotal)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Monto a Abonar (COP) *
                </label>
                <Input
                  type="number"
                  min={1}
                  max={creditoSeleccionado.saldoPendiente}
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value ? Number(e.target.value) : "")}
                  className="text-base font-extrabold text-slate-900"
                  placeholder="Ej. 50000"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Método de Pago *
                  </label>
                  <Select value={metodoPago} onValueChange={setMetodoPago}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">Efectivo de Caja</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferencia / Nequi / Daviplata</SelectItem>
                      <SelectItem value="TARJETA">Tarjeta Débito/Crédito</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Caja Destino
                  </label>
                  <Select value={String(bodegaId)} onValueChange={(v) => setBodegaId(Number(v))}>
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  N° Referencia / Voucher (opcional)
                </label>
                <Input
                  value={referenciaAbono}
                  onChange={(e) => setReferenciaAbono(e.target.value)}
                  placeholder="Ej. Nequi Ref #9821..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas adicionales
                </label>
                <Input
                  value={notaAbono}
                  onChange={(e) => setNotaAbono(e.target.value)}
                  placeholder="Ej. Pago parcial acordado..."
                />
              </div>

              {errorAbono && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorAbono}
                </div>
              )}

              {exitoAbono && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {exitoAbono}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalAbonoOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarAbono}
              disabled={pending || !montoAbono}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Guardar Abono
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ESTADO DE CUENTA CLIENTE */}
      <Dialog open={modalEstadoCuentaOpen} onOpenChange={setModalEstadoCuentaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-600" /> Estado de Cuenta del Cliente
            </DialogTitle>
            <DialogDescription>
              Resumen de cupo asignado, créditos vigentes e historial de abonos.
            </DialogDescription>
          </DialogHeader>

          {cargandoEstadoCuenta ? (
            <div className="py-12 flex justify-center items-center gap-2 text-slate-500 text-xs">
              <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> Cargando estado de cuenta…
            </div>
          ) : estadoCuentaData ? (
            <div className="space-y-4 text-xs">
              {/* CABECERA CLIENTE */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {estadoCuentaData.cliente.nombre}
                    </h3>
                    <p className="text-slate-500 text-xs font-mono">
                      {estadoCuentaData.cliente.tipoDoc}: {estadoCuentaData.cliente.documento ?? "Sin doc"}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-500 block">Teléfono:</span>
                    <span className="font-semibold">{estadoCuentaData.cliente.telefono ?? "-"}</span>
                  </div>
                </div>

                {/* BARRAS DE CUPO */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Cupo Asignado: {formatoCOP(estadoCuentaData.cliente.cupoCredito)}</span>
                    <span className="text-red-600">Saldo Pendiente: {formatoCOP(estadoCuentaData.saldoPendienteTotal)}</span>
                    <span className="text-emerald-600">Disponible: {formatoCOP(estadoCuentaData.cupoDisponible)}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-red-500 h-full"
                      style={{
                        width: `${Math.min(
                          100,
                          estadoCuentaData.cliente.cupoCredito > 0
                            ? (estadoCuentaData.saldoPendienteTotal / estadoCuentaData.cliente.cupoCredito) * 100
                            : 0
                        )}%`,
                      }}
                    />
                    <div
                      className="bg-emerald-500 h-full"
                      style={{
                        width: `${Math.max(
                          0,
                          estadoCuentaData.cliente.cupoCredito > 0
                            ? (estadoCuentaData.cupoDisponible / estadoCuentaData.cliente.cupoCredito) * 100
                            : 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* TIMELINE DE CRÉDITOS */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Histórico de Créditos del Cliente</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Crédito</th>
                        <th className="p-2">Vencimiento</th>
                        <th className="p-2 text-right">Monto</th>
                        <th className="p-2 text-right">Saldo</th>
                        <th className="p-2 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {estadoCuentaData.creditos.map((c: any) => (
                        <tr key={c.id}>
                          <td className="p-2 font-mono font-bold text-slate-900">
                            CR-{String(c.consecutivo).padStart(4, "0")}
                          </td>
                          <td className="p-2">{new Date(c.fechaVencimiento).toLocaleDateString("es-CO")}</td>
                          <td className="p-2 text-right">{formatoCOP(c.montoTotal)}</td>
                          <td className="p-2 text-right font-bold">{formatoCOP(c.saldoPendiente)}</td>
                          <td className="p-2 text-center">
                            {c.estado === "PAGADO" ? (
                              <Badge variant="success">Pagado</Badge>
                            ) : (
                              <Badge variant="warning">Pendiente</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir Estado de Cuenta
            </Button>
            <Button variant="ghost" onClick={() => setModalEstadoCuentaOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL COMPROBANTE ABONO TICKET 80MM */}
      <Dialog open={modalTicketOpen} onOpenChange={setModalTicketOpen}>
        <DialogContent className="max-w-xs p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-sm font-bold">
              Comprobante de Abono
            </DialogTitle>
          </DialogHeader>

          {datosTicket && (
            <div className="font-mono text-[11px] space-y-2 border p-3 rounded bg-white">
              <div className="text-center font-bold border-b pb-1">
                RECIBO DE ABONO A CARTERA
              </div>
              <div className="flex justify-between">
                <span>Crédito:</span>
                <span className="font-bold">{datosTicket.codigoCredito}</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="font-bold truncate max-w-[120px]">{datosTicket.cliente}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha:</span>
                <span>{datosTicket.fecha}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>MONTO ABONADO:</span>
                <span>{formatoCOP(datosTicket.montoAbonado)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700">
                <span>NUEVO SALDO:</span>
                <span>{formatoCOP(datosTicket.nuevoSaldo)}</span>
              </div>
              <div className="text-center text-[10px] text-slate-500 border-t pt-2 mt-2">
                ¡Gracias por su pago puntual!
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button size="sm" className="w-full" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Imprimir Recibo 80mm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
