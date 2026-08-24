"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Ban,
  Boxes,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  Gift,
  Loader2,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  UserCheck,
  Wallet,
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
import { buscarProductosPOS, type ProductoPOS } from "@/lib/actions/ventas";
import {
  cancelarPlanSepare,
  crearPlanSepare,
  registrarAbonoSepare,
  type PlanSepareLista,
} from "@/lib/actions/fidelizacion";

type PlanSepareRow = PlanSepareLista & Record<string, unknown>;

interface ClienteItem {
  id: number;
  nombre: string;
  documento: string | null;
}

interface BodegaItem {
  id: number;
  nombre: string;
}

interface PlanSepareClientProps {
  planesIniciales: PlanSepareLista[];
  clientes: ClienteItem[];
  bodegas: BodegaItem[];
}

export default function PlanSepareClient({
  planesIniciales,
  clientes,
  bodegas,
}: PlanSepareClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");

  const [planSeleccionado, setPlanSeleccionado] = useState<PlanSepareLista | null>(null);

  // Modales
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [modalAbonoOpen, setModalAbonoOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  // Formulario Nuevo Plan
  const [clienteId, setClienteId] = useState<number | "">(clientes[0]?.id ?? "");
  const [bodegaId, setBodegaId] = useState<number>(bodegas[0]?.id ?? 1);
  const [diasLimite, setDiasLimite] = useState<number>(30);
  const [itemsNuevo, setItemsNuevo] = useState<
    { varianteId: number; sku: string; nombre: string; color: string; talla: string; cantidad: number; precioUnitario: number }[]
  >([]);
  const [abonoInicial, setAbonoInicial] = useState<number | "">("");
  const [metodoAbono, setMetodoAbono] = useState<string>("EFECTIVO");
  const [notaNuevo, setNotaNuevo] = useState("");

  // Buscador productos en nuevo plan
  const [busquedaProd, setBusquedaProd] = useState("");
  const [resultadosProd, setResultadosProd] = useState<ProductoPOS[]>([]);
  const [cargandoProd, setCargandoProd] = useState(false);

  // Formulario Abono
  const [montoAbono, setMontoAbono] = useState<number | "">("");
  const [metodoAbonoReg, setMetodoAbonoReg] = useState<string>("EFECTIVO");
  const [referenciaAbonoReg, setReferenciaAbonoReg] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoMsg, setExitoMsg] = useState<string | null>(null);

  const now = new Date();

  const totalPlan = useMemo(
    () => itemsNuevo.reduce((a, i) => a + i.cantidad * i.precioUnitario, 0),
    [itemsNuevo]
  );

  const planesFiltrados = useMemo(() => {
    return planesIniciales.filter((p) => {
      const codigo = `PS-${String(p.consecutivo).padStart(4, "0")}`;
      const matchBusqueda =
        !busqueda ||
        codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.cliente.documento ?? "").includes(busqueda);

      const matchEstado = filtroEstado === "TODOS" || p.estado === filtroEstado;

      return matchBusqueda && matchEstado;
    }) as PlanSepareRow[];
  }, [planesIniciales, busqueda, filtroEstado]);

  // Métricas
  const totalEnSepare = planesIniciales.reduce((a, p) => a + p.total, 0);
  const totalSaldoPendiente = planesIniciales
    .filter((p) => p.estado === "ACTIVO")
    .reduce((a, p) => a + p.saldoPendiente, 0);
  const planesActivos = planesIniciales.filter((p) => p.estado === "ACTIVO").length;
  const planesEntregados = planesIniciales.filter((p) => p.estado === "ENTREGADO").length;

  const debounceRef = useRef<NodeJS.Timeout>();
  const handleBusquedaProd = (value: string) => {
    setBusquedaProd(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCargandoProd(true);
      try {
        const res = (await buscarProductosPOS(value, bodegaId)) as ProductoPOS[];
        setResultadosProd(res);
      } catch {
        setResultadosProd([]);
      } finally {
        setCargandoProd(false);
      }
    }, 150);
  };

  function agregarItemNuevo(v: ProductoPOS["variantes"][number], p: ProductoPOS) {
    setItemsNuevo((prev) => {
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
          cantidad: 1,
          precioUnitario: v.precioOverride ?? p.precioBase,
        },
      ];
    });
    setBusquedaProd("");
    setResultadosProd([]);
  }

  async function handleCrearPlan() {
    setErrorMsg(null);
    if (!clienteId) {
      setErrorMsg("Selecciona un cliente.");
      return;
    }
    if (itemsNuevo.length === 0) {
      setErrorMsg("Agrega al menos un artículo para apartar.");
      return;
    }

    const res = await crearPlanSepare({
      clienteId: Number(clienteId),
      bodegaId,
      diasLimite,
      items: itemsNuevo.map((i) => ({
        varianteId: i.varianteId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
      abonoInicial: abonoInicial ? Number(abonoInicial) : 0,
      metodoAbono: metodoAbono as any,
      nota: notaNuevo.trim() || undefined,
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setModalNuevoOpen(false);
    setItemsNuevo([]);
    setAbonoInicial("");
    setNotaNuevo("");
    setErrorMsg(null);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleRegistrarAbono() {
    if (!planSeleccionado) return;
    const monto = Number(montoAbono);
    if (!monto || monto <= 0) {
      setErrorMsg("Ingresa un monto válido.");
      return;
    }
    if (monto > planSeleccionado.saldoPendiente) {
      setErrorMsg(`El abono supera el saldo pendiente (${formatoCOP(planSeleccionado.saldoPendiente)}).`);
      return;
    }

    const res = await registrarAbonoSepare({
      planSepareId: planSeleccionado.id,
      monto,
      metodo: metodoAbonoReg as any,
      referencia: referenciaAbonoReg.trim() || undefined,
      bodegaId: planSeleccionado.bodegaId,
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setModalAbonoOpen(false);
    setMontoAbono("");
    setReferenciaAbonoReg("");
    setPlanSeleccionado(null);
    setErrorMsg(null);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleCancelarPlan() {
    if (!planSeleccionado) return;
    if (!motivoCancelacion.trim()) {
      setErrorMsg("Ingresa un motivo de cancelación.");
      return;
    }

    const res = await cancelarPlanSepare(planSeleccionado.id, motivoCancelacion.trim());
    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setModalCancelarOpen(false);
    setMotivoCancelacion("");
    setPlanSeleccionado(null);
    setErrorMsg(null);
    startTransition(() => {
      router.refresh();
    });
  }

  const columns = [
    {
      key: "consecutivo",
      label: "N° Separe",
      render: (p: PlanSepareRow) => (
        <span className="font-mono font-bold text-slate-900">
          PS-{String(p.consecutivo).padStart(4, "0")}
        </span>
      ),
    },
    {
      key: "cliente",
      label: "Cliente",
      render: (p: PlanSepareRow) => (
        <div>
          <div className="font-bold text-slate-800">{p.cliente.nombre}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {p.cliente.documento ?? "Sin documento"}
          </div>
        </div>
      ),
    },
    {
      key: "bodega",
      label: "Bodega",
      render: (p: PlanSepareRow) => (
        <span className="text-xs font-semibold text-slate-700">{p.bodega.nombre}</span>
      ),
    },
    {
      key: "vencimiento",
      label: "Fecha Límite",
      render: (p: PlanSepareRow) => {
        const fecLim = new Date(p.fechaLimite);
        const esVencido = p.estado === "ACTIVO" && fecLim < now;
        return (
          <div>
            <div className="text-xs font-semibold">{fecLim.toLocaleDateString("es-CO")}</div>
            {p.estado === "ACTIVO" && (
              <span className={`text-[11px] font-bold ${esVencido ? "text-red-600" : "text-amber-600"}`}>
                {esVencido ? "¡Vencido!" : "Vigente"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "total",
      label: "Total Apartado",
      render: (p: PlanSepareRow) => (
        <span className="font-semibold text-slate-700">{formatoCOP(p.total)}</span>
      ),
    },
    {
      key: "saldoPendiente",
      label: "Saldo Pendiente",
      render: (p: PlanSepareRow) => (
        <span className={`font-extrabold text-sm ${p.saldoPendiente > 0 ? "text-slate-900" : "text-emerald-600"}`}>
          {formatoCOP(p.saldoPendiente)}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (p: PlanSepareRow) => {
        if (p.estado === "ENTREGADO") return <Badge variant="success">Liquidado / Entregado</Badge>;
        if (p.estado === "CANCELADO") return <Badge variant="danger">Cancelado</Badge>;
        return <Badge variant="warning">Activo</Badge>;
      },
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (p: PlanSepareRow) => (
        <div className="flex items-center gap-1">
          {p.estado === "ACTIVO" && (
            <Button
              size="sm"
              className="h-8 gap-1 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setPlanSeleccionado(p);
                setMontoAbono(p.saldoPendiente);
                setErrorMsg(null);
                setModalAbonoOpen(true);
              }}
            >
              <DollarSign className="h-3.5 w-3.5" /> Abonar
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            title="Ver Detalle"
            onClick={() => {
              setPlanSeleccionado(p);
              setModalDetalleOpen(true);
            }}
          >
            <Eye className="h-4 w-4 text-slate-600" />
          </Button>

          {p.estado === "ACTIVO" && (
            <Button
              size="icon"
              variant="ghost"
              title="Cancelar Plan y Revertir Stock"
              onClick={() => {
                setPlanSeleccionado(p);
                setMotivoCancelacion("");
                setErrorMsg(null);
                setModalCancelarOpen(true);
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
        title="Plan Separe / Apartados"
        description="Apartado de mercancía con reserva física de inventario y registro de abonos parciales."
        actions={
          <Button onClick={() => setModalNuevoOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Plan Separe
          </Button>
        }
      />

      {/* METRICAS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Apartados"
          value={formatoCOP(totalEnSepare)}
          icon={<Boxes className="h-5 w-5 text-brand-600" />}
          color="brand"
          hint="Monto total histórico"
        />
        <StatCard
          label="Saldo por Cobrar"
          value={formatoCOP(totalSaldoPendiente)}
          icon={<Wallet className="h-5 w-5 text-amber-600" />}
          color="amber"
          hint="Saldo pendiente en planes activos"
        />
        <StatCard
          label="Planes Activos"
          value={planesActivos.toString()}
          icon={<Clock className="h-5 w-5 text-sky-600" />}
          color="sky"
          hint="Prendas actualmente reservadas"
        />
        <StatCard
          label="Planes Entregados"
          value={planesEntregados.toString()}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          color="violet"
          hint="Liquidados y retirados"
        />
      </div>

      {/* FILTROS Y DATATABLE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, documento o PS-xxxx…"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-48">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los estados</SelectItem>
                <SelectItem value="ACTIVO">Activos</SelectItem>
                <SelectItem value="ENTREGADO">Entregados / Liquidados</SelectItem>
                <SelectItem value="CANCELADO">Cancelados</SelectItem>
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
        data={planesFiltrados}
        pageTitle="Listado de Planes Separe"
      />

      {/* MODAL NUEVO PLAN SEPARE */}
      <Dialog open={modalNuevoOpen} onOpenChange={setModalNuevoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Plan Separe</DialogTitle>
            <DialogDescription>
              Aparta prendas para el cliente con reserva de inventario en bodega.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cliente *</label>
                <Select value={clienteId ? String(clienteId) : ""} onValueChange={(v) => setClienteId(Number(v))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar cliente…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre} {c.documento ? `(${c.documento})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bodega de Reserva *</label>
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plazo Límite (Días)</label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={diasLimite}
                  onChange={(e) => setDiasLimite(Number(e.target.value) || 30)}
                />
              </div>
            </div>

            {/* BUSCADOR PRODUCTOS */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Añadir Prendas al Apartado</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={busquedaProd}
                  onChange={(e) => handleBusquedaProd(e.target.value)}
                  placeholder="Buscar por referencia, SKU o nombre…"
                  className="pl-9 h-9"
                />
                {cargandoProd && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500 animate-spin" />}
              </div>

              {resultadosProd.length > 0 && (
                <div className="max-h-40 overflow-y-auto mt-2 space-y-1 border border-slate-200 p-2 rounded-lg bg-slate-50">
                  {resultadosProd.map((p) => (
                    <div key={p.id} className="p-1">
                      <span className="font-bold text-slate-800">{p.nombre}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.variantes.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => agregarItemNuevo(v, p)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] hover:bg-brand-50"
                          >
                            {v.color.nombre} / T.{v.talla.valor} ({formatoCOP(v.precioOverride ?? p.precioBase)})
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TABLA ITEMS */}
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-44 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Prenda</th>
                    <th className="p-2 text-center">Cant</th>
                    <th className="p-2 text-right">Precio</th>
                    <th className="p-2 text-right">Subtotal</th>
                    <th className="p-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {itemsNuevo.map((i) => (
                    <tr key={i.varianteId}>
                      <td className="p-2 font-medium text-slate-800">
                        {i.nombre} ({i.color} / T.{i.talla})
                      </td>
                      <td className="p-2 text-center font-bold">{i.cantidad}</td>
                      <td className="p-2 text-right">{formatoCOP(i.precioUnitario)}</td>
                      <td className="p-2 text-right font-bold">{formatoCOP(i.cantidad * i.precioUnitario)}</td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => setItemsNuevo((prev) => prev.filter((it) => it.varianteId !== i.varianteId))}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {itemsNuevo.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                        Sin prendas agregadas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cuota Inicial / Abono (opcional)</label>
                <Input
                  type="number"
                  min={0}
                  max={totalPlan}
                  value={abonoInicial}
                  onChange={(e) => setAbonoInicial(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Ej. 30000"
                />
              </div>
              <div className="text-right flex flex-col justify-center">
                <span className="text-slate-500 text-xs">Total del Apartado:</span>
                <span className="text-base font-extrabold text-slate-900">{formatoCOP(totalPlan)}</span>
              </div>
            </div>

            {errorMsg && <p className="font-semibold text-red-500">{errorMsg}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalNuevoOpen(false)}>Cancelar</Button>
            <Button onClick={handleCrearPlan} disabled={pending || itemsNuevo.length === 0}>
              {pending ? "Guardando…" : "Crear Plan Separe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL REGISTRAR ABONO */}
      <Dialog open={modalAbonoOpen} onOpenChange={setModalAbonoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-700 flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Registrar Abono Plan Separe
            </DialogTitle>
            <DialogDescription>
              {planSeleccionado && (
                <>Plan <strong>PS-{String(planSeleccionado.consecutivo).padStart(4, "0")}</strong> · Cliente: <strong>{planSeleccionado.cliente.nombre}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          {planSeleccionado && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block">Saldo Pendiente:</span>
                  <span className="font-extrabold text-base text-slate-900">{formatoCOP(planSeleccionado.saldoPendiente)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Total Plan:</span>
                  <span className="font-semibold text-slate-700">{formatoCOP(planSeleccionado.total)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monto a Abonar (COP) *</label>
                <Input
                  type="number"
                  min={1}
                  max={planSeleccionado.saldoPendiente}
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value ? Number(e.target.value) : "")}
                  className="text-base font-extrabold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Método de Pago</label>
                  <Select value={metodoAbonoReg} onValueChange={setMetodoAbonoReg}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">Efectivo de Caja</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferencia / Nequi</SelectItem>
                      <SelectItem value="TARJETA">Tarjeta Débito/Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Referencia</label>
                  <Input
                    value={referenciaAbonoReg}
                    onChange={(e) => setReferenciaAbonoReg(e.target.value)}
                    placeholder="Voucher o N°..."
                  />
                </div>
              </div>

              {errorMsg && <p className="font-semibold text-red-500">{errorMsg}</p>}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalAbonoOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegistrarAbono} disabled={pending || !montoAbono} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {pending ? "Guardando…" : "Guardar Abono"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DETALLE */}
      <Dialog open={modalDetalleOpen} onOpenChange={setModalDetalleOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Detalle Plan Separe PS-{String(planSeleccionado?.consecutivo ?? 0).padStart(4, "0")}
            </DialogTitle>
          </DialogHeader>

          {planSeleccionado && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg">
                <div>
                  <span className="text-slate-500 block">Cliente:</span>
                  <span className="font-bold text-slate-800">{planSeleccionado.cliente.nombre}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha Límite:</span>
                  <span className="font-semibold text-slate-800">{new Date(planSeleccionado.fechaLimite).toLocaleDateString("es-CO")}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-1">Prendas Reservadas</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Prenda</th>
                        <th className="p-2 text-center">Cant</th>
                        <th className="p-2 text-right">Precio</th>
                        <th className="p-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {planSeleccionado.items.map((i) => (
                        <tr key={i.id}>
                          <td className="p-2">{i.variante.producto.nombre} ({i.variante.color.nombre} / T.{i.variante.talla.valor})</td>
                          <td className="p-2 text-center font-bold">{i.cantidad}</td>
                          <td className="p-2 text-right">{formatoCOP(i.precioUnitario)}</td>
                          <td className="p-2 text-right font-bold">{formatoCOP(i.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg font-extrabold text-sm">
                <span>Saldo Pendiente:</span>
                <span>{formatoCOP(planSeleccionado.saldoPendiente)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Imprimir Comprobante
            </Button>
            <Button variant="ghost" onClick={() => setModalDetalleOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CANCELAR */}
      <Dialog open={modalCancelarOpen} onOpenChange={setModalCancelarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Cancelar Plan Separe
            </DialogTitle>
            <DialogDescription>
              Las prendas reservadas serán devueltas inmediatamente al stock de la bodega.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <label className="block font-semibold text-slate-700">Motivo de Cancelación *</label>
            <textarea
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-red-500"
              placeholder="Ingresa la razón de la cancelación..."
            />
            {errorMsg && <p className="font-semibold text-red-500">{errorMsg}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalCancelarOpen(false)}>Volver</Button>
            <Button variant="destructive" onClick={handleCancelarPlan} disabled={pending || !motivoCancelacion.trim()}>
              {pending ? "Cancelando…" : "Confirmar Cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
