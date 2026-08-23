"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  Edit2,
  Percent,
  Plus,
  Power,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
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
import {
  guardarPromocion,
  togglePromocion,
  type PromocionLista,
} from "@/lib/actions/fidelizacion";

type PromoRow = PromocionLista & Record<string, unknown>;

interface PromocionesClientProps {
  promocionesIniciales: PromocionLista[];
}

export default function PromocionesClient({
  promocionesIniciales,
}: PromocionesClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<string>("PORCENTAJE");
  const [valor, setValor] = useState<number | "">("");
  const [montoMinimo, setMontoMinimo] = useState<number | "">("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [activa, setActiva] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function abrirModalNueva() {
    setEditId(null);
    setNombre("");
    setTipo("PORCENTAJE");
    setValor("");
    setMontoMinimo("");
    setFechaInicio("");
    setFechaFin("");
    setActiva(true);
    setErrorMsg(null);
    setModalOpen(true);
  }

  function abrirModalEditar(p: PromocionLista) {
    setEditId(p.id);
    setNombre(p.nombre);
    setTipo(p.tipo);
    setValor(p.valor);
    setMontoMinimo(p.montoMinimo || "");
    setFechaInicio(p.fechaInicio ? p.fechaInicio.toISOString().split("T")[0] : "");
    setFechaFin(p.fechaFin ? p.fechaFin.toISOString().split("T")[0] : "");
    setActiva(p.activa);
    setErrorMsg(null);
    setModalOpen(true);
  }

  async function handleGuardar() {
    setErrorMsg(null);
    if (!nombre.trim()) {
      setErrorMsg("Ingresa el nombre de la promoción.");
      return;
    }
    const val = Number(valor);
    if (!val || val <= 0) {
      setErrorMsg("Ingresa un valor de descuento válido mayor a 0.");
      return;
    }

    const res = await guardarPromocion({
      id: editId ?? undefined,
      nombre: nombre.trim(),
      tipo: tipo as any,
      valor: val,
      montoMinimo: montoMinimo ? Number(montoMinimo) : 0,
      activa,
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setModalOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleToggle(id: number) {
    await togglePromocion(id);
    startTransition(() => {
      router.refresh();
    });
  }

  const columns = [
    {
      key: "nombre",
      label: "Nombre Promoción",
      render: (p: PromoRow) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-brand-600 shrink-0" />
          <span className="font-bold text-slate-900">{p.nombre}</span>
        </div>
      ),
    },
    {
      key: "tipo",
      label: "Tipo",
      render: (p: PromoRow) => (
        <Badge variant="outline">
          {p.tipo === "PORCENTAJE" ? "Porcentaje %" : "Monto Fijo $"}
        </Badge>
      ),
    },
    {
      key: "valor",
      label: "Descuento",
      render: (p: PromoRow) => (
        <span className="font-extrabold text-sm text-emerald-600">
          {p.tipo === "PORCENTAJE" ? `${p.valor}% OFF` : `${formatoCOP(p.valor)} OFF`}
        </span>
      ),
    },
    {
      key: "montoMinimo",
      label: "Compra Mínima",
      render: (p: PromoRow) => (
        <span className="text-xs text-slate-600">
          {p.montoMinimo > 0 ? formatoCOP(p.montoMinimo) : "Sin mínimo"}
        </span>
      ),
    },
    {
      key: "vigencia",
      label: "Vigencia",
      render: (p: PromoRow) => (
        <span className="text-xs text-slate-500">
          {p.fechaInicio || p.fechaFin
            ? `${p.fechaInicio ? new Date(p.fechaInicio).toLocaleDateString("es-CO") : "Inicio"} - ${
                p.fechaFin ? new Date(p.fechaFin).toLocaleDateString("es-CO") : "Indefinida"
              }`
            : "Permanente"}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (p: PromoRow) =>
        p.activa ? <Badge variant="success">Activa</Badge> : <Badge variant="neutral">Inactiva</Badge>,
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (p: PromoRow) => (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            title="Editar Promoción"
            onClick={() => abrirModalEditar(p as unknown as PromocionLista)}
          >
            <Edit2 className="h-4 w-4 text-slate-600" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            title={p.activa ? "Desactivar" : "Activar"}
            onClick={() => handleToggle(p.id)}
          >
            <Power className={`h-4 w-4 ${p.activa ? "text-red-500" : "text-emerald-500"}`} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Promociones y Descuentos"
        description="Configuración de campañas de descuento aplicables automáticamente en el punto de venta."
        actions={
          <Button onClick={abrirModalNueva} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva Promoción
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={promocionesIniciales as unknown as PromoRow[]}
        pageTitle="Promociones Registradas"
      />

      {/* MODAL CREAR / EDITAR */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-600" />
              {editId ? "Editar Promoción" : "Crear Nueva Promoción"}
            </DialogTitle>
            <DialogDescription>
              Define las condiciones y el beneficio de la promoción para el POS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre de la Campaña *</label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Descuento Fin de Semana, 20% Dama..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Descuento</label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PORCENTAJE">Porcentaje (%)</SelectItem>
                    <SelectItem value="MONTO_FIJO">Monto Fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Valor {tipo === "PORCENTAJE" ? "(%)" : "(COP)"} *
                </label>
                <Input
                  type="number"
                  min={1}
                  value={valor}
                  onChange={(e) => setValor(e.target.value ? Number(e.target.value) : "")}
                  placeholder={tipo === "PORCENTAJE" ? "Ej. 20" : "Ej. 15000"}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monto Mínimo de Compra (opcional)</label>
              <Input
                type="number"
                min={0}
                value={montoMinimo}
                onChange={(e) => setMontoMinimo(e.target.value ? Number(e.target.value) : "")}
                placeholder="Ej. 100000"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha Inicio</label>
                <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha Fin</label>
                <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            </div>

            {errorMsg && <p className="font-semibold text-red-500">{errorMsg}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleGuardar} disabled={pending || !nombre || !valor}>
              {pending ? "Guardando…" : "Guardar Promoción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
