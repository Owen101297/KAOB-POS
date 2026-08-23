"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Gift,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  TrendingDown,
  TrendingUp,
  Users,
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
import {
  ajustarPuntos,
  type MovimientoPuntosLista,
} from "@/lib/actions/fidelizacion";

type PuntosRow = MovimientoPuntosLista & Record<string, unknown>;

interface ClienteItem {
  id: number;
  nombre: string;
  documento: string | null;
}

interface PuntosClientProps {
  movimientosIniciales: MovimientoPuntosLista[];
  clientes: ClienteItem[];
}

export default function PuntosClient({
  movimientosIniciales,
  clientes,
}: PuntosClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [busqueda, setBusqueda] = useState("");
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);

  const [clienteId, setClienteId] = useState<number | "">(clientes[0]?.id ?? "");
  const [tipo, setTipo] = useState<string>("ACUMULACION");
  const [puntos, setPuntos] = useState<number | "">("");
  const [nota, setNota] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const movimientosFiltrados = useMemo(() => {
    return movimientosIniciales.filter(
      (m) =>
        !busqueda ||
        m.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (m.cliente.documento ?? "").includes(busqueda) ||
        (m.referencia ?? "").toLowerCase().includes(busqueda.toLowerCase())
    ) as PuntosRow[];
  }, [movimientosIniciales, busqueda]);

  // Metricas
  const totalEmitidos = movimientosIniciales
    .filter((m) => m.tipo === "ACUMULACION")
    .reduce((a, m) => a + m.puntos, 0);
  const totalRedimidos = movimientosIniciales
    .filter((m) => m.tipo === "REDENCION")
    .reduce((a, m) => a + m.puntos, 0);
  const clientesActivos = new Set(movimientosIniciales.map((m) => m.clienteId)).size;

  async function handleGuardarAjuste() {
    setErrorMsg(null);
    if (!clienteId) {
      setErrorMsg("Selecciona un cliente.");
      return;
    }
    const pts = Number(puntos);
    if (!pts || pts <= 0) {
      setErrorMsg("Ingresa una cantidad de puntos válida mayor a 0.");
      return;
    }

    const res = await ajustarPuntos({
      clienteId: Number(clienteId),
      tipo: tipo as any,
      puntos: pts,
      nota: nota.trim() || undefined,
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setModalAjusteOpen(false);
    setPuntos("");
    setNota("");
    setErrorMsg(null);
    startTransition(() => {
      router.refresh();
    });
  }

  const columns = [
    {
      key: "fecha",
      label: "Fecha",
      render: (m: PuntosRow) => (
        <span className="text-xs text-slate-600">
          {new Date(m.createdAt).toLocaleString("es-CO", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      key: "cliente",
      label: "Cliente",
      render: (m: PuntosRow) => (
        <div>
          <div className="font-bold text-slate-800">{m.cliente.nombre}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {m.cliente.documento ?? "Sin doc"}
          </div>
        </div>
      ),
    },
    {
      key: "tipo",
      label: "Tipo",
      render: (m: PuntosRow) => {
        if (m.tipo === "ACUMULACION") return <Badge variant="success">Acumulación</Badge>;
        if (m.tipo === "REDENCION") return <Badge variant="info">Redención</Badge>;
        return <Badge variant="warning">Ajuste</Badge>;
      },
    },
    {
      key: "puntos",
      label: "Puntos",
      render: (m: PuntosRow) => (
        <span
          className={`font-extrabold text-sm ${
            m.tipo === "ACUMULACION" ? "text-emerald-600" : m.tipo === "REDENCION" ? "text-sky-600" : "text-amber-600"
          }`}
        >
          {m.tipo === "REDENCION" ? `-${m.puntos}` : `+${m.puntos}`} pts
        </span>
      ),
    },
    {
      key: "saldoResultante",
      label: "Saldo Puntos",
      render: (m: PuntosRow) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
          {m.saldoResultante} pts
        </span>
      ),
    },
    {
      key: "nota",
      label: "Detalle / Referencia",
      render: (m: PuntosRow) => (
        <span className="text-xs text-slate-600">{m.nota ?? m.referencia ?? "-"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Puntos y Fidelización de Clientes"
        description="Seguimiento de acumulación de puntos por compras y redención de premios o descuentos."
        actions={
          <Button onClick={() => setModalAjusteOpen(true)} className="gap-2">
            <Sliders className="h-4 w-4" /> Ajustar / Asignar Puntos
          </Button>
        }
      />

      {/* METRICAS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Puntos Acumulados"
          value={totalEmitidos.toLocaleString()}
          icon={<Award className="h-5 w-5 text-emerald-600" />}
          color="brand"
          hint="Emitidos por compras"
        />
        <StatCard
          label="Puntos Redimidos"
          value={totalRedimidos.toLocaleString()}
          icon={<Gift className="h-5 w-5 text-sky-600" />}
          color="sky"
          hint="Utilizados por clientes"
        />
        <StatCard
          label="Clientes Fidelizados"
          value={clientesActivos.toString()}
          icon={<Users className="h-5 w-5 text-violet-600" />}
          color="violet"
          hint="Con saldo de puntos activo"
        />
      </div>

      {/* BUSCADOR Y DATATABLE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente o documento…"
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
        data={movimientosFiltrados}
        pageTitle="Movimientos de Puntos"
      />

      {/* MODAL AJUSTE PUNTOS */}
      <Dialog open={modalAjusteOpen} onOpenChange={setModalAjusteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-700">
              <Award className="h-5 w-5" /> Movimiento Manual de Puntos
            </DialogTitle>
            <DialogDescription>
              Asigna o descuenta puntos de fidelización directamente a la cuenta del cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cliente *</label>
              <Select value={clienteId ? String(clienteId) : ""} onValueChange={(v) => setClienteId(Number(v))}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar cliente…" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre} {c.documento ? `(${c.documento})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Movimiento</label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACUMULACION">Acumular (+)</SelectItem>
                    <SelectItem value="REDENCION">Redimir (-)</SelectItem>
                    <SelectItem value="AJUSTE">Ajuste Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cantidad de Puntos *</label>
                <Input
                  type="number"
                  min={1}
                  value={puntos}
                  onChange={(e) => setPuntos(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Ej. 100"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Motivo / Detalle</label>
              <Input
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej. Bonificación de cumpleaños, cortesía..."
              />
            </div>

            {errorMsg && <p className="font-semibold text-red-500">{errorMsg}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalAjusteOpen(false)}>Cancelar</Button>
            <Button onClick={handleGuardarAjuste} disabled={pending || !puntos}>
              {pending ? "Guardando…" : "Aplicar Movimiento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
