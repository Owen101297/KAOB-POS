'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Check,
  Pencil,
  Plus,
  Ruler,
  SwatchBook,
  Tag,
  X,
} from 'lucide-react';
import type { Bodega, Categoria, Color, GrupoTalla, Marca, Talla } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeading } from '@/components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  actualizarColor,
  actualizarMarca,
  agregarTallaAGrupo,
  guardarBodega,
  guardarCategoria,
  guardarColor,
  guardarGrupoTalla,
  guardarMarca,
  toggleBodega,
  toggleMarca,
} from '@/lib/actions/catalogos';

type GrupoConTallas = GrupoTalla & { tallas: Talla[] };
type CategoriaConPadre = Categoria & { padre: { nombre: string } | null };

interface Props {
  bodegas: Bodega[];
  marcas: Marca[];
  categorias: CategoriaConPadre[];
  colores: Color[];
  grupos: GrupoConTallas[];
}

export default function CatalogosClient({ bodegas, marcas, categorias, colores, grupos }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const refrescar = () => startTransition(() => router.refresh());

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Catálogos"
        description="Bodegas, marcas, categorías, colores y tallas que usan los productos."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <SeccionBodegas bodegas={bodegas} onChange={refrescar} disabled={pending} />
        <SeccionMarcas marcas={marcas} onChange={refrescar} disabled={pending} />
        <SeccionCategorias categorias={categorias} onChange={refrescar} disabled={pending} />
        <SeccionColores colores={colores} onChange={refrescar} disabled={pending} />
        <SeccionGrupos grupos={grupos} onChange={refrescar} disabled={pending} />
      </div>
    </div>
  );
}

// ─────────────────────────── utilidades ──────────────────────

function ErrorMsg({ error }: { error?: string | null }) {
  if (!error) return null;
  return <p className="text-xs font-medium text-red-500">{error}</p>;
}

async function ejecutar(
  accion: () => Promise<{ ok: boolean; error?: string }>,
  onError: (msg: string) => void
) {
  const res = await accion();
  if (!res.ok && res.error) onError(res.error);
  return res.ok;
}

// ─────────────────────────── BODEGAS ─────────────────────────

function SeccionBodegas({
  bodegas,
  onChange,
  disabled,
}: {
  bodegas: Bodega[];
  onChange: () => void;
  disabled: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Bodega | null>(null);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [principal, setPrincipal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrirNueva() {
    setEditando(null);
    setNombre('');
    setDireccion('');
    setPrincipal(false);
    setError(null);
    setAbierto(true);
  }

  function abrirEdicion(b: Bodega) {
    setEditando(b);
    setNombre(b.nombre);
    setDireccion(b.direccion ?? '');
    setPrincipal(b.esPrincipal);
    setError(null);
    setAbierto(true);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ok = await ejecutar(
      () => guardarBodega({ id: editando?.id, nombre, direccion, esPrincipal: principal }),
      setError
    );
    if (ok) {
      setAbierto(false);
      onChange();
    }
  }

  return (
    <Card>
      <CardHeading
        icon={<Building2 className="h-4 w-4" />}
        titulo="Bodegas / Sedes"
        descripcion="Ubicaciones físicas donde se guarda inventario."
      >
        <Button size="sm" variant="outline" onClick={abrirNueva}>
          <Plus className="h-4 w-4" /> Nueva
        </Button>
      </CardHeading>
      <div className="divide-y divide-slate-100">
        {bodegas.length === 0 ? (
          <EmptyState icon={Building2} title="Sin bodegas" description="Crea tu primera bodega." />
        ) : (
          bodegas.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                  {b.nombre}
                  {b.esPrincipal && <Badge variant="info">Principal</Badge>}
                  {!b.activa && <Badge variant="neutral">Inactiva</Badge>}
                </p>
                {b.direccion && <p className="text-xs text-slate-400">{b.direccion}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" aria-label={`Editar ${b.nombre}`} onClick={() => abrirEdicion(b)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`${b.activa ? 'Desactivar' : 'Activar'} ${b.nombre}`}
                  onClick={() => ejecutar(() => toggleBodega(b.id), setError).then(onChange)}
                >
                  {b.activa ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      <ErrorMsg error={error} />

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar bodega' : 'Nueva bodega'}</DialogTitle>
            <DialogDescription>Las bodegas organizan el stock por ubicación física.</DialogDescription>
          </DialogHeader>
          <form onSubmit={enviar} className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-600">Nombre *</span>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} maxLength={80} placeholder="Ej. Principal, Sede Norte…" />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-600">Dirección</span>
              <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} maxLength={200} />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={principal}
                onChange={(e) => setPrincipal(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-brand-500"
              />
              <span className="text-[13px] text-slate-700">Marcar como bodega principal</span>
            </label>
            <ErrorMsg error={error} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={disabled}>Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─────────────────────────── MARCAS ──────────────────────────

function SeccionMarcas({
  marcas,
  onChange,
  disabled,
}: {
  marcas: Marca[];
  onChange: () => void;
  disabled: boolean;
}) {
  const [nueva, setNueva] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (await ejecutar(() => guardarMarca(nueva), setError)) {
      setNueva('');
      onChange();
    }
  }

  return (
    <Card>
      <CardHeading icon={<Tag className="h-4 w-4" />} titulo="Marcas" descripcion="Etiquetas de marca para productos e informes." />
      <form onSubmit={agregar} className="flex gap-2 px-5 pb-3">
        <Input value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Nueva marca…" maxLength={80} />
        <Button type="submit" size="md" disabled={disabled || nueva.trim().length < 2}>Agregar</Button>
      </form>
      <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
        {marcas.length === 0 ? (
          <EmptyState icon={Tag} title="Sin marcas" className="py-8" />
        ) : (
          marcas.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 px-5 py-2">
              {editId === m.id ? (
                <>
                  <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="h-8 flex-1" autoFocus />
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (await ejecutar(() => actualizarMarca(m.id, editNombre), setError)) {
                      setEditId(null); onChange();
                    }
                  }}>Guardar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancelar</Button>
                </>
              ) : (
                <>
                  <span className={`text-[13px] ${m.activa ? 'font-medium text-slate-800' : 'text-slate-400 line-through'}`}>{m.nombre}</span>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" aria-label={`Editar ${m.nombre}`} onClick={() => { setEditId(m.id); setEditNombre(m.nombre); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={`${m.activa ? 'Desactivar' : 'Activar'} ${m.nombre}`} onClick={() => ejecutar(() => toggleMarca(m.id), setError).then(onChange)}>
                      {m.activa ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      <div className="px-5 pb-3"><ErrorMsg error={error} /></div>
    </Card>
  );
}

// ───────────────────────── CATEGORÍAS ────────────────────────

function SeccionCategorias({
  categorias,
  onChange,
  disabled,
}: {
  categorias: CategoriaConPadre[];
  onChange: () => void;
  disabled: boolean;
}) {
  const [nombre, setNombre] = useState('');
  const [padreId, setPadreId] = useState<string>('ninguna');
  const [error, setError] = useState<string | null>(null);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    const ok = await ejecutar(
      () => guardarCategoria({ nombre, padreId: padreId === 'ninguna' ? null : Number(padreId) }),
      setError
    );
    if (ok) { setNombre(''); setPadreId('ninguna'); onChange(); }
  }

  return (
    <Card>
      <CardHeading icon={<SwatchBook className="h-4 w-4" />} titulo="Categorías" descripcion="Clasificación jerárquica de prendas (ej. Camisas > Camisetas)." />
      <form onSubmit={agregar} className="grid gap-2 px-5 pb-3 sm:grid-cols-[1fr_150px_auto]">
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nueva categoría…" maxLength={80} />
        <Select value={padreId} onValueChange={setPadreId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ninguna">Sin categoría padre</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={disabled || nombre.trim().length < 2}>Agregar</Button>
      </form>
      <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
        {categorias.length === 0 ? (
          <EmptyState icon={SwatchBook} title="Sin categorías" className="py-8" />
        ) : (
          categorias.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-2">
              <span className="text-[13px] font-medium text-slate-800">{c.nombre}</span>
              <span className="text-xs text-slate-400">{c.padre ? `← ${c.padre.nombre}` : 'Raíz'}</span>
            </div>
          ))
        )}
      </div>
      <div className="px-5 pb-3"><ErrorMsg error={error} /></div>
    </Card>
  );
}

// ─────────────────────────── COLORES ─────────────────────────

function SeccionColores({
  colores,
  onChange,
  disabled,
}: {
  colores: Color[];
  onChange: () => void;
  disabled: boolean;
}) {
  const [nombre, setNombre] = useState('');
  const [hex, setHex] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    const ok = await ejecutar(() =>
      editId
        ? actualizarColor(editId, { nombre, hex })
        : guardarColor({ nombre, hex }),
      setError
    );
    if (ok) { setNombre(''); setHex(''); setEditId(null); onChange(); }
  }

  return (
    <Card>
      <CardHeading icon={<SwatchBook className="h-4 w-4" />} titulo="Colores" descripcion="Variantes de color disponibles para los productos." />
      <form onSubmit={agregar} className="grid gap-2 px-5 pb-3 sm:grid-cols-[1fr_120px_auto]">
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={editId ? 'Renombrar color…' : 'Nuevo color…'} maxLength={80} />
        <Input value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#RRGGBB" maxLength={7} />
        <div className="flex gap-2">
          <Button type="submit" disabled={disabled || nombre.trim().length < 2}>{editId ? 'Guardar' : 'Agregar'}</Button>
          {editId && <Button type="button" variant="ghost" onClick={() => { setEditId(null); setNombre(''); setHex(''); }}>Cancelar</Button>}
        </div>
      </form>
      <div className="max-h-60 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
        {colores.length === 0 ? (
          <EmptyState icon={SwatchBook} title="Sin colores" className="py-8" />
        ) : (
          colores.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setEditId(c.id); setNombre(c.nombre); setHex(c.hex ?? ''); }}
              className="flex w-full items-center justify-between px-5 py-2 text-left transition-colors hover:bg-brand-50/40"
            >
              <span className="flex items-center gap-2 text-[13px] font-medium text-slate-800">
                <span className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: c.hex ?? '#e2e8f0' }} />
                {c.nombre}
              </span>
              <Pencil className="h-3.5 w-3.5 text-slate-300" />
            </button>
          ))
        )}
      </div>
      <div className="px-5 pb-3"><ErrorMsg error={error} /></div>
    </Card>
  );
}

// ─────────────────────── GRUPOS DE TALLA ─────────────────────

function SeccionGrupos({
  grupos,
  onChange,
  disabled,
}: {
  grupos: GrupoConTallas[];
  onChange: () => void;
  disabled: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tallasTexto, setTallasTexto] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function agregarTalla(grupoId: number, valor: string) {
    if (!valor.trim()) return;
    if (await ejecutar(() => agregarTallaAGrupo(grupoId, valor), setError)) onChange();
  }

  return (
    <Card>
      <CardHeading
        icon={<Ruler className="h-4 w-4" />}
        titulo="Tallas por grupo"
        descripcion="Ej. Ropa (XS–XXL), Jeans colombiano (26–38), Calzado (34–45)."
      >
        <Button size="sm" variant="outline" onClick={() => { setNombre(''); setTallasTexto(''); setAbierto(true); }}>
          <Plus className="h-4 w-4" /> Nuevo grupo
        </Button>
      </CardHeading>
      <div className="max-h-96 space-y-4 overflow-y-auto px-5 py-4">
        {grupos.length === 0 ? (
          <EmptyState icon={Ruler} title="Sin grupos de talla" description="Crea un grupo para poder definir variantes de productos." className="py-6" />
        ) : (
          grupos.map((g) => (
            <GrupoRow key={g.id} grupo={g} onAgregar={agregarTalla} disabled={disabled} />
          ))
        )}
      </div>
      <div className="px-5 pb-3"><ErrorMsg error={error} /></div>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo grupo de tallas</DialogTitle>
            <DialogDescription>Escribe las tallas separadas por coma, en orden visual.</DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const tallas = tallasTexto.split(',').map((v) => v.trim()).filter(Boolean)
              .map((valor, i) => ({ valor, orden: i }));
            if (tallas.length === 0) { setError('Agrega al menos una talla'); return; }
            const ok = await ejecutar(() => guardarGrupoTalla({ nombre, tallas }), setError);
            if (ok) { setAbierto(false); onChange(); }
          }} className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-600">Nombre del grupo *</span>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Camisetas dama" required minLength={2} maxLength={80} />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-600">Tallas *</span>
              <Input value={tallasTexto} onChange={(e) => setTallasTexto(e.target.value)} placeholder="XS, S, M, L, XL" />
            </label>
            <ErrorMsg error={error} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={disabled}>Crear grupo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function GrupoRow({
  grupo,
  onAgregar,
  disabled,
}: {
  grupo: GrupoConTallas;
  onAgregar: (grupoId: number, valor: string) => Promise<void>;
  disabled: boolean;
}) {
  const [nueva, setNueva] = useState('');
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-bold text-slate-700">{grupo.nombre}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {grupo.tallas.map((t) => (
          <Badge key={t.id} variant="neutral">{t.valor}</Badge>
        ))}
        <span className="ml-1 flex items-center gap-1">
          <Input
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') { await onAgregar(grupo.id, nueva); setNueva(''); }
            }}
            className="h-7 w-20 text-xs"
            placeholder="+ talla"
            disabled={disabled}
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            disabled={disabled || !nueva.trim()}
            onClick={async () => { await onAgregar(grupo.id, nueva); setNueva(''); }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </span>
      </div>
    </div>
  );
}
