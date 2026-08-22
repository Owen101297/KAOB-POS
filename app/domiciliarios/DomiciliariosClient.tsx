"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Plus, Search, Truck, MapPin } from "lucide-react";
import type { Domiciliario } from "@prisma/client";
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
import { guardarDomiciliario, listarDomiciliarios, toggleDomiciliario } from "@/lib/actions/contactos";

interface FilaDomiciliario {
  id: number;
  nombre: string;
  telefono: string;
  activo: boolean;
  [key: string]: unknown;
}

export default function DomiciliariosClient({ domiciliarios }: { domiciliarios: Domiciliario[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState("activos");
  const [busqueda, setBusqueda] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editando, setEditando] = useState<Domiciliario | null>(null);

  const refrescar = () => startTransition(() => router.refresh());

  const filas = useMemo<FilaDomiciliario[]>(
    () =>
      domiciliarios
        .filter((d) => (filtro === "todos" ? true : d.activo))
        .filter((d) =>
          busqueda ? `${d.nombre} ${d.telefono ?? ""}`.toLowerCase().includes(busqueda.toLowerCase()) : true
        )
        .map((d) => ({
          id: d.id,
          nombre: d.nombre,
          telefono: d.telefono ?? "—",
          activo: d.activo,
        })),
    [domiciliarios, filtro, busqueda]
  );

  const columnas = [
    {
      key: "nombre",
      label: "Domiciliario",
      render: (row: FilaDomiciliario) => <span className="font-medium text-slate-800">{row.nombre}</span>,
    },
    { key: "telefono", label: "Teléfono" },
    {
      key: "activo",
      label: "Estado",
      align: "center" as const,
      render: (row: FilaDomiciliario) =>
        row.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="neutral">Inactivo</Badge>,
    },
    {
      key: "acciones",
      label: "",
      width: "70px",
      render: (row: FilaDomiciliario) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="icon" variant="ghost" aria-label={`Editar ${row.nombre}`} onClick={() => { setEditando(domiciliarios.find((d) => d.id === row.id)!); setDialog(true); }}>
            <Search className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={row.activo ? `Desactivar ${row.nombre}` : `Activar ${row.nombre}`}
            onClick={() => toggleDomiciliario(row.id).then(refrescar)}
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
        title="Domiciliarios"
        description="Gestiona domiciliarios para entregas a domicilio."
        actions={<Button onClick={abrirNuevo}><Plus className="h-4 w-4" /> Nuevo domiciliario</Button>}
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
        emptyTitle="Sin domiciliarios"
        emptyDescription="Registra domiciliarios para usar en ventas con entrega."
      />

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? `Editar ${editando.nombre}` : "Nuevo domiciliario"}</DialogTitle>
            <DialogDescription>Datos para entregas a domicilio.</DialogDescription>
          </DialogHeader>
          <FormDomiciliario
            domiciliario={editando}
            disabled={pending}
            onListo={() => { setDialog(false); setEditando(null); refrescar(); }}
            onCancelar={() => { setDialog(false); setEditando(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormDomiciliario({
  domiciliario,
  disabled,
  onListo,
  onCancelar,
}: {
  domiciliario: Domiciliario | null;
  disabled: boolean;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState(domiciliario?.nombre ?? "");
  const [telefono, setTelefono] = useState(domiciliario?.telefono ?? "");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await guardarDomiciliario({
      id: domiciliario?.id,
      nombre,
      telefono: telefono || null,
    });
    if (!res.ok) return setError(res.error);
    onListo();
  }

  return (
    <form onSubmit={enviar} className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Nombre *</span>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} maxLength={80} placeholder="Carlos Domínguez" />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Teléfono</span>
        <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={20} placeholder="300 987 6543" />
      </label>
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" disabled={disabled}>{domiciliario ? "Guardar" : "Crear"}</Button>
      </DialogFooter>
    </form>
  );
}