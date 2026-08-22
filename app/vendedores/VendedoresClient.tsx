"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Plus, Search, User, DollarSign } from "lucide-react";
import type { Vendedor } from "@prisma/client";
import DataTable from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { formatoCOP } from "@/lib/format";
import { guardarVendedor, listarVendedores, toggleVendedor } from "@/lib/actions/contactos";

interface FilaVendedor {
  id: number;
  nombre: string;
  telefono: string;
  comisionPct: number;
  activo: boolean;
  [key: string]: unknown;
}

export default function VendedoresClient({ vendedores }: { vendedores: Vendedor[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState("activos");
  const [busqueda, setBusqueda] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editando, setEditando] = useState<Vendedor | null>(null);

  const refrescar = () => startTransition(() => router.refresh());

  const filas = useMemo<FilaVendedor[]>(
    () =>
      vendedores
        .filter((v) => (filtro === "todos" ? true : v.activo))
        .filter((v) =>
          busqueda
            ? `${v.nombre} ${v.telefono ?? ""}`.toLowerCase().includes(busqueda.toLowerCase())
            : true
        )
        .map((v) => ({
          id: v.id,
          nombre: v.nombre,
          telefono: v.telefono ?? "—",
          comisionPct: v.comisionPct,
          activo: v.activo,
        })),
    [vendedores, filtro, busqueda]
  );

  const columnas = [
    {
      key: "nombre",
      label: "Vendedor",
      render: (row: FilaVendedor) => <span className="font-medium text-slate-800">{row.nombre}</span>,
    },
    { key: "telefono", label: "Teléfono" },
    {
      key: "comisionPct",
      label: "Comisión %",
      align: "center" as const,
      render: (row: FilaVendedor) => `${row.comisionPct.toFixed(2)}%`,
    },
    {
      key: "activo",
      label: "Estado",
      align: "center" as const,
      render: (row: FilaVendedor) =>
        row.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="neutral">Inactivo</Badge>,
    },
    {
      key: "acciones",
      label: "",
      width: "70px",
      render: (row: FilaVendedor) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="icon" variant="ghost" aria-label={`Editar ${row.nombre}`} onClick={() => { setEditando(vendedores.find((v) => v.id === row.id)!); setDialog(true); }}>
            <Search className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={row.activo ? `Desactivar ${row.nombre}` : `Activar ${row.nombre}`}
            onClick={() => toggleVendedor(row.id).then(refrescar)}
          >
            {row.activo ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ];

  const abrirNuevo = () => {
    setEditando(null);
    setDialog(true);
  };

  return (
    <div>
      <PageHeader
        title="Vendedores"
        description="Gestiona vendedores y sus comisiones para reportes."
        actions={<Button onClick={abrirNuevo}><Plus className="h-4 w-4" /> Nuevo vendedor</Button>}
      />

      <DataTable
        columns={columnas}
        data={filas}
        filters={
          <>
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o teléfono…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-9 w-64 pl-9"
              />
            </div>
          </>
        }
        emptyTitle="Sin vendedores"
        emptyDescription="Registra vendedores para asignarlos en ventas y comisiones."
      />

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? `Editar ${editando.nombre}` : "Nuevo vendedor"}</DialogTitle>
            <DialogDescription>La comisión se usa para calcular incentivos en reportes.</DialogDescription>
          </DialogHeader>
          <FormVendedor
            vendedor={editando}
            disabled={pending}
            onListo={() => { setDialog(false); setEditando(null); refrescar(); }}
            onCancelar={() => { setDialog(false); setEditando(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormVendedor({
  vendedor,
  disabled,
  onListo,
  onCancelar,
}: {
  vendedor: Vendedor | null;
  disabled: boolean;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState(vendedor?.nombre ?? "");
  const [telefono, setTelefono] = useState(vendedor?.telefono ?? "");
  const [comisionPct, setComisionPct] = useState(vendedor ? String(vendedor.comisionPct) : "0");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await guardarVendedor({
      id: vendedor?.id,
      nombre,
      telefono: telefono || null,
      comisionPct: Number(comisionPct) || 0,
    });
    if (!res.ok) return setError(res.error);
    onListo();
  }

  return (
    <form onSubmit={enviar} className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Nombre *</span>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} maxLength={80} placeholder="María González" />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Teléfono</span>
        <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={20} placeholder="300 123 4567" />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Comisión %</span>
        <Input type="number" step="0.01" min={0} max={100} value={comisionPct} onChange={(e) => setComisionPct(e.target.value)} placeholder="5.00" />
      </label>
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" disabled={disabled}>{vendedor ? "Guardar" : "Crear"}</Button>
      </DialogFooter>
    </form>
  );
}