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
  Trash2,
  X,
  AlertTriangle,
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
  actualizarCategoria,
  actualizarColor,
  actualizarGrupoTalla,
  actualizarMarca,
  agregarTallaAGrupo,
  eliminarCategoria,
  eliminarColor,
  eliminarGrupoTalla,
  eliminarMarca,
  eliminarTalla,
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
        title="Catálogos del Sistema"
        description="Gestiona bodegas, marcas, categorías, colores y grupos de tallas para tus prendas."
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
  return (
    <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-700 border border-red-200">
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
      <span>{error}</span>
    </div>
  );
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
  const [editId, setEditId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [principal, setPrincipal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrirModal(b?: Bodega) {
    setError(null);
    if (b) {
      setEditId(b.id);
      setNombre(b.nombre);
      setDireccion(b.direccion ?? '');
      setPrincipal(b.esPrincipal);
    } else {
      setEditId(null);
      setNombre('');
      setDireccion('');
      setPrincipal(false);
    }
    setAbierto(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ok = await ejecutar(
      () => guardarBodega({ id: editId, nombre, direccion, esPrincipal: principal }),
      setError
    );
    if (ok) {
      setAbierto(false);
      onChange();
    }
  }

  return (
    <Card className="bg-white border border-slate-200 shadow-xs">
      <CardHeading
        icon={<Building2 className="h-4 w-4 text-brand-600" />}
        titulo="Bodegas y Puntos de Venta"
        descripcion="Ubicaciones de almacenamiento y despacho de inventario."
      >
        <Button size="sm" onClick={() => abrirModal()} disabled={disabled}>
          <Plus className="h-4 w-4" /> Nueva bodega
        </Button>
      </CardHeading>
      <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
        {bodegas.length === 0 ? (
          <EmptyState icon={Building2} title="Sin bodegas" className="py-8" />
        ) : (
          bodegas.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-bold ${b.activa ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                    {b.nombre}
                  </span>
                  {b.esPrincipal && <Badge variant="success">Principal</Badge>}
                </div>
                {b.direccion && <p className="text-xs text-slate-500">{b.direccion}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => abrirModal(b)}>
                  <Pencil className="h-3.5 w-3.5 text-slate-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={b.activa ? 'Desactivar' : 'Activar'}
                  onClick={() => ejecutar(() => toggleBodega(b.id), setError).then(onChange)}
                >
                  {b.activa ? <X className="h-3.5 w-3.5 text-red-500" /> : <Check className="h-3.5 w-3.5 text-emerald-600" />}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      {error && <div className="px-5 pb-3"><ErrorMsg error={error} /></div>}

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar bodega' : 'Nueva bodega'}</DialogTitle>
            <DialogDescription>Configura los datos del punto de almacenamiento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={guardar} className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-bold uppercase text-slate-700">Nombre *</span>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                minLength={2}
                maxLength={80}
                placeholder="Ej. Principal, Sede Centro…"
                className="bg-white border-slate-300 text-slate-900 font-medium"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-bold uppercase text-slate-700">Dirección</span>
              <Input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                maxLength={200}
                placeholder="Ej. Cra 7 # 12-34 Local 102"
                className="bg-white border-slate-300 text-slate-900 font-medium"
              />
            </label>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={principal}
                onChange={(e) => setPrincipal(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-brand-600"
              />
              <span className="text-xs font-bold text-slate-800">Marcar como bodega principal por defecto</span>
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
    setError(null);
    if (await ejecutar(() => guardarMarca(nueva), setError)) {
      setNueva('');
      onChange();
    }
  }

  async function borrar(id: number, nombre: string) {
    if (!confirm(`¿Deseas eliminar la marca "${nombre}"?`)) return;
    setError(null);
    if (await ejecutar(() => eliminarMarca(id), setError)) {
      onChange();
    }
  }

  return (
    <Card className="bg-white border border-slate-200 shadow-xs">
      <CardHeading
        icon={<Tag className="h-4 w-4 text-brand-600" />}
        titulo="Marcas"
        descripcion="Etiquetas de fabricante para productos e informes."
      />
      <form onSubmit={agregar} className="flex gap-2 px-5 pb-3">
        <Input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Nueva marca…"
          maxLength={80}
          className="bg-white border-slate-300 text-slate-900 font-medium"
        />
        <Button type="submit" size="md" disabled={disabled || nueva.trim().length < 2}>
          <Plus className="h-4 w-4" /> Agregar
        </Button>
      </form>
      <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
        {marcas.length === 0 ? (
          <EmptyState icon={Tag} title="Sin marcas" className="py-8" />
        ) : (
          marcas.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 px-5 py-2.5 hover:bg-slate-50">
              {editId === m.id ? (
                <>
                  <Input
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="h-8 flex-1 bg-white border-slate-300 text-slate-900 font-medium"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      setError(null);
                      if (await ejecutar(() => actualizarMarca(m.id, editNombre), setError)) {
                        setEditId(null);
                        onChange();
                      }
                    }}
                  >
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <span className={`text-[13px] ${m.activa ? 'font-bold text-slate-800' : 'text-slate-400 line-through'}`}>
                    {m.nombre}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Editar ${m.nombre}`}
                      onClick={() => { setEditId(m.id); setEditNombre(m.nombre); }}
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`${m.activa ? 'Desactivar' : 'Activar'} ${m.nombre}`}
                      onClick={() => ejecutar(() => toggleMarca(m.id), setError).then(onChange)}
                    >
                      {m.activa ? <X className="h-3.5 w-3.5 text-amber-500" /> : <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Eliminar ${m.nombre}`}
                      onClick={() => borrar(m.id, m.nombre)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      {error && <div className="px-5 pb-3"><ErrorMsg error={error} /></div>}
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
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPadreId, setEditPadreId] = useState<string>('ninguna');
  const [error, setError] = useState<string | null>(null);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ok = await ejecutar(
      () => guardarCategoria({ nombre, padreId: padreId === 'ninguna' ? null : Number(padreId) }),
      setError
    );
    if (ok) {
      setNombre('');
      setPadreId('ninguna');
      onChange();
    }
  }

  async function guardarEdicion() {
    if (!editId) return;
    setError(null);
    const ok = await ejecutar(
      () =>
        actualizarCategoria(editId, {
          nombre: editNombre,
          padreId: editPadreId === 'ninguna' ? null : Number(editPadreId),
        }),
      setError
    );
    if (ok) {
      setEditId(null);
      onChange();
    }
  }

  async function borrar(id: number, catNombre: string) {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${catNombre}"?`)) return;
    setError(null);
    const ok = await ejecutar(() => eliminarCategoria(id), setError);
    if (ok) onChange();
  }

  return (
    <Card className="bg-white border border-slate-200 shadow-xs">
      <CardHeading
        icon={<SwatchBook className="h-4 w-4 text-brand-600" />}
        titulo="Categorías"
        descripcion="Clasificación jerárquica de prendas (ej. Camisas, Jeans, Chaquetas)."
      />
      <form onSubmit={agregar} className="grid gap-2 px-5 pb-3 sm:grid-cols-[1fr_150px_auto]">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nueva categoría…"
          maxLength={80}
          className="bg-white border-slate-300 text-slate-900 font-medium"
        />
        <select
          value={padreId}
          onChange={(e) => setPadreId(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="ninguna">Sin categoría padre</option>
          {categorias.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nombre}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={disabled || nombre.trim().length < 2}>
          <Plus className="h-4 w-4" /> Agregar
        </Button>
      </form>
      <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
        {categorias.length === 0 ? (
          <EmptyState icon={SwatchBook} title="Sin categorías" className="py-8" />
        ) : (
          categorias.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 px-5 py-2.5 hover:bg-slate-50">
              {editId === c.id ? (
                <div className="flex w-full items-center gap-2">
                  <Input
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="h-8 flex-1 bg-white border-slate-300 text-slate-900 font-medium"
                    autoFocus
                  />
                  <select
                    value={editPadreId}
                    onChange={(e) => setEditPadreId(e.target.value)}
                    className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 shadow-2xs"
                  >
                    <option value="ninguna">Raíz (Sin padre)</option>
                    {categorias
                      .filter((cat) => cat.id !== c.id)
                      .map((cat) => (
                        <option key={cat.id} value={String(cat.id)}>
                          {cat.nombre}
                        </option>
                      ))}
                  </select>
                  <Button size="sm" onClick={guardarEdicion}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-slate-800">{c.nombre}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      {c.padre ? `← ${c.padre.nombre}` : 'Principal'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Editar ${c.nombre}`}
                      onClick={() => {
                        setEditId(c.id);
                        setEditNombre(c.nombre);
                        setEditPadreId(c.padreId ? String(c.padreId) : 'ninguna');
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Eliminar ${c.nombre}`}
                      onClick={() => borrar(c.id, c.nombre)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      {error && <div className="px-5 pb-3"><ErrorMsg error={error} /></div>}
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
    setError(null);
    const ok = await ejecutar(() =>
      editId
        ? actualizarColor(editId, { nombre, hex })
        : guardarColor({ nombre, hex }),
      setError
    );
    if (ok) {
      setNombre('');
      setHex('');
      setEditId(null);
      onChange();
    }
  }

  async function borrar(id: number, colNombre: string) {
    if (!confirm(`¿Estás seguro de eliminar el color "${colNombre}"?`)) return;
    setError(null);
    const ok = await ejecutar(() => eliminarColor(id), setError);
    if (ok) onChange();
  }

  return (
    <Card className="bg-white border border-slate-200 shadow-xs">
      <CardHeading
        icon={<SwatchBook className="h-4 w-4 text-brand-600" />}
        titulo="Colores"
        descripcion="Variantes de color y swatches visuales para el catálogo POS."
      />
      <form onSubmit={agregar} className="grid gap-2 px-5 pb-3 sm:grid-cols-[1fr_120px_auto]">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={editId ? 'Renombrar color…' : 'Nuevo color…'}
          maxLength={80}
          className="bg-white border-slate-300 text-slate-900 font-medium"
        />
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={hex.startsWith('#') && hex.length === 7 ? hex : '#000000'}
            onChange={(e) => setHex(e.target.value)}
            className="h-9 w-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
          />
          <Input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="#RRGGBB"
            maxLength={7}
            className="bg-white border-slate-300 text-slate-900 font-mono text-xs uppercase"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={disabled || nombre.trim().length < 2}>
            {editId ? 'Guardar' : 'Agregar'}
          </Button>
          {editId && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditId(null);
                setNombre('');
                setHex('');
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
      <div className="max-h-60 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
        {colores.length === 0 ? (
          <EmptyState icon={SwatchBook} title="Sin colores" className="py-8" />
        ) : (
          colores.map((c) => (
            <div
              key={c.id}
              className="flex w-full items-center justify-between px-5 py-2.5 hover:bg-slate-50"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-5 w-5 rounded-full border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: c.hex ?? '#e2e8f0' }}
                />
                <span className="text-[13px] font-bold text-slate-800">{c.nombre}</span>
                {c.hex && <span className="font-mono text-xs text-slate-400">{c.hex}</span>}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Editar"
                  onClick={() => {
                    setEditId(c.id);
                    setNombre(c.nombre);
                    setHex(c.hex ?? '');
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 text-slate-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Eliminar"
                  onClick={() => borrar(c.id, c.nombre)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      {error && <div className="px-5 pb-3"><ErrorMsg error={error} /></div>}
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
    setError(null);
    if (await ejecutar(() => agregarTallaAGrupo(grupoId, valor), setError)) onChange();
  }

  async function borrarTalla(tallaId: number, valor: string) {
    if (!confirm(`¿Eliminar la talla "${valor}" de este grupo?`)) return;
    setError(null);
    if (await ejecutar(() => eliminarTalla(tallaId), setError)) onChange();
  }

  async function renombrarGrupo(id: number, actualNombre: string) {
    const nuevo = prompt('Nuevo nombre para el grupo de tallas:', actualNombre);
    if (!nuevo || nuevo.trim() === actualNombre) return;
    setError(null);
    if (await ejecutar(() => actualizarGrupoTalla(id, nuevo.trim()), setError)) onChange();
  }

  async function borrarGrupo(id: number, grupoNombre: string) {
    if (!confirm(`¿Estás seguro de eliminar el grupo de tallas "${grupoNombre}" y todas sus tallas?`)) return;
    setError(null);
    if (await ejecutar(() => eliminarGrupoTalla(id), setError)) onChange();
  }

  return (
    <Card className="bg-white border border-slate-200 shadow-xs">
      <CardHeading
        icon={<Ruler className="h-4 w-4 text-brand-600" />}
        titulo="Tallas por Grupo"
        descripcion="Ej. Ropa (XS–XXL), Jeans (28–38), Calzado (34–45)."
      >
        <Button
          size="sm"
          onClick={() => {
            setNombre('');
            setTallasTexto('');
            setError(null);
            setAbierto(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo grupo
        </Button>
      </CardHeading>
      <div className="max-h-96 space-y-4 overflow-y-auto px-5 py-4 divide-y divide-slate-100">
        {grupos.length === 0 ? (
          <EmptyState
            icon={Ruler}
            title="Sin grupos de talla"
            description="Crea un grupo para poder definir variantes de productos."
            className="py-6"
          />
        ) : (
          grupos.map((g) => (
            <div key={g.id} className="pt-3 first:pt-0">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black text-slate-900">{g.nombre}</span>
                  <span className="text-xs text-slate-400 font-semibold">({g.tallas.length} tallas)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Renombrar grupo ${g.nombre}`}
                    onClick={() => renombrarGrupo(g.id, g.nombre)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Eliminar grupo ${g.nombre}`}
                    onClick={() => borrarGrupo(g.id, g.nombre)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Tallas listadas con botón de eliminar individual */}
              <GrupoRow
                grupo={g}
                onAgregar={agregarTalla}
                onBorrarTalla={borrarTalla}
                disabled={disabled}
              />
            </div>
          ))
        )}
      </div>
      {error && <div className="px-5 pb-3"><ErrorMsg error={error} /></div>}

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Nuevo Grupo de Tallas</DialogTitle>
            <DialogDescription>
              Escribe el nombre del grupo y sus tallas separadas por coma.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              const tallas = tallasTexto
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean)
                .map((valor, i) => ({ valor, orden: i }));
              if (tallas.length === 0) {
                setError('Agrega al menos una talla (ej. S, M, L)');
                return;
              }
              const ok = await ejecutar(() => guardarGrupoTalla({ nombre, tallas }), setError);
              if (ok) {
                setAbierto(false);
                onChange();
              }
            }}
            className="grid gap-3"
          >
            <label className="grid gap-1">
              <span className="text-xs font-bold uppercase text-slate-700">Nombre del grupo *</span>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Ropa Superior, Jeans Caballero…"
                required
                minLength={2}
                maxLength={80}
                className="bg-white border-slate-300 text-slate-900 font-medium"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-bold uppercase text-slate-700">Tallas separadas por coma *</span>
              <Input
                value={tallasTexto}
                onChange={(e) => setTallasTexto(e.target.value)}
                placeholder="XS, S, M, L, XL, XXL"
                className="bg-white border-slate-300 text-slate-900 font-medium"
              />
            </label>
            <ErrorMsg error={error} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={disabled}>
                Crear grupo
              </Button>
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
  onBorrarTalla,
  disabled,
}: {
  grupo: GrupoConTallas;
  onAgregar: (grupoId: number, valor: string) => Promise<void>;
  onBorrarTalla: (tallaId: number, valor: string) => Promise<void>;
  disabled: boolean;
}) {
  const [nueva, setNueva] = useState('');

  return (
    <div className="flex flex-wrap items-center gap-2">
      {grupo.tallas.map((t) => (
        <span
          key={t.id}
          className="group inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-800 shadow-2xs hover:border-slate-300"
        >
          <span>{t.valor}</span>
          <button
            type="button"
            title={`Eliminar talla ${t.valor}`}
            onClick={() => onBorrarTalla(t.id, t.valor)}
            className="text-slate-400 hover:text-red-600 transition-colors p-0.5 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <span className="flex items-center gap-1">
        <Input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              await onAgregar(grupo.id, nueva);
              setNueva('');
            }
          }}
          className="h-8 w-24 text-xs font-bold bg-white border-slate-300 text-slate-900"
          placeholder="+ talla"
          disabled={disabled}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2"
          disabled={disabled || !nueva.trim()}
          onClick={async () => {
            await onAgregar(grupo.id, nueva);
            setNueva('');
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </span>
    </div>
  );
}
