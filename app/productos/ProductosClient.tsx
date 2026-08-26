'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive,
  ArchiveRestore,
  Barcode,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import type { CatalogosCompletos } from '@/lib/actions/catalogos';
import type { Bodega } from '@prisma/client';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import ImpresionEtiquetasModal from '@/components/productos/ImpresionEtiquetasModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useBodega } from '@/components/providers/BodegaProvider';
import { CALIDADES, CALIDAD_LABEL, GENEROS } from '@/lib/constants';
import { formatoCOP } from '@/lib/format';
import {
  actualizarProducto,
  agregarVariantes,
  crearProducto,
  eliminarProducto,
  eliminarMultiplesProductos,
  toggleProductoActivo,
} from '@/lib/actions/productos';

type GrupoConTallas = CatalogosCompletos['grupos'][number];

interface FilaProducto {
  id: number;
  referencia: string;
  nombre: string;
  categoria: string;
  marca: string;
  calidad: string;
  variantes: number;
  stockBodega: number;
  costo: number;
  precio: number;
  activo: boolean;
  [key: string]: unknown;
}

interface Props {
  productos: ProductoLista[];
  catalogos: CatalogosCompletos;
}

export default function ProductosClient({ productos, catalogos }: Props) {
  const router = useRouter();
  const { bodegaActiva } = useBodega();
  const [pending, startTransition] = useTransition();
  const [filtroEstado, setFiltroEstado] = useState('activos');

  const [dialogForm, setDialogForm] = useState(false);
  const [editando, setEditando] = useState<ProductoLista | null>(null);
  const [agregandoA, setAgregandoA] = useState<ProductoLista | null>(null);
  const [abrirEtiquetas, setAbrirEtiquetas] = useState(false);
  const [variantesParaEtiquetas, setVariantesParaEtiquetas] = useState<
    {
      id: number;
      sku: string;
      productoNombre: string;
      referencia: string;
      colorNombre: string;
      tallaValor: string;
      precio: number;
    }[]
  >([]);

  // Selección múltiple
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [modalBulkEliminar, setModalBulkEliminar] = useState(false);
  const [eliminandoBulk, setEliminandoBulk] = useState(false);

  const refrescar = () => startTransition(() => router.refresh());

  const abrirImpresionParaProducto = (prod: ProductoLista) => {
    const vars = prod.variantes.map((v) => ({
      id: v.id,
      sku: v.sku,
      productoNombre: prod.nombre,
      referencia: prod.referencia,
      colorNombre: v.color.nombre,
      tallaValor: v.talla.valor,
      precio: v.precioOverride ?? prod.precioBase,
    }));
    setVariantesParaEtiquetas(vars);
    setAbrirEtiquetas(true);
  };

  const abrirImpresionCatalogo = () => {
    const todas: typeof variantesParaEtiquetas = [];
    productos
      .filter((p) => p.activo)
      .forEach((p) => {
        p.variantes.forEach((v) => {
          todas.push({
            id: v.id,
            sku: v.sku,
            productoNombre: p.nombre,
            referencia: p.referencia,
            colorNombre: v.color.nombre,
            tallaValor: v.talla.valor,
            precio: v.precioOverride ?? p.precioBase,
          });
        });
      });
    setVariantesParaEtiquetas(todas);
    setAbrirEtiquetas(true);
  };

  const filas = useMemo<FilaProducto[]>(
    () =>
      productos
        .filter((p) => (filtroEstado === 'todos' ? true : p.activo))
        .map((p) => ({
          id: p.id,
          referencia: p.referencia,
          nombre: p.nombre,
          categoria: p.categoria?.nombre ?? '—',
          marca: p.marca?.nombre ?? '—',
          calidad: p.calidad ?? '',
          variantes: p.variantes.length,
          stockBodega: bodegaActiva
            ? p.variantes.reduce(
                (acc, v) =>
                  acc + (v.stocks.find((s) => s.bodegaId === bodegaActiva.id)?.cantidad ?? 0),
                0
              )
            : 0,
          costo: p.costo,
          precio: p.precioBase,
          activo: p.activo,
        })),
    [productos, filtroEstado, bodegaActiva]
  );

  const todosSeleccionados = filas.length > 0 && seleccionados.size === filas.length;

  const toggleSeleccionarTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(filas.map((f) => f.id)));
    }
  };

  const toggleSeleccionarFila = (id: number) => {
    const next = new Set(seleccionados);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSeleccionados(next);
  };

  async function handleBulkEliminar() {
    if (seleccionados.size === 0) return;
    setEliminandoBulk(true);
    try {
      const ids = Array.from(seleccionados);
      const res = await eliminarMultiplesProductos(ids);
      if (!res.ok) {
        alert(res.error || 'Error al eliminar productos.');
        return;
      }
      setModalBulkEliminar(false);
      setSeleccionados(new Set());
      refrescar();
      if (res.data.omitidos && res.data.omitidos.length > 0) {
        const msg = `Se eliminaron ${res.data.eliminados} producto(s).\n\nLos siguientes ${res.data.omitidos.length} producto(s) no se pudieron eliminar porque tienen ventas o compras registradas:\n` +
          res.data.omitidos.map((o) => `• ${o.nombre} (${o.referencia}): ${o.motivo}`).join('\n');
        alert(msg);
      }
    } catch (e) {
      alert('Ocurrió un error inesperado al eliminar los productos.');
    } finally {
      setEliminandoBulk(false);
    }
  }

  const columnas = [
    {
      key: 'seleccion',
      label: (
        <input
          type="checkbox"
          checked={todosSeleccionados}
          onChange={toggleSeleccionarTodos}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          title="Seleccionar todos"
        />
      ),
      width: '45px',
      align: 'center' as const,
      render: (row: FilaProducto) => (
        <input
          type="checkbox"
          checked={seleccionados.has(row.id)}
          onChange={() => toggleSeleccionarFila(row.id)}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          aria-label={`Seleccionar ${row.nombre}`}
        />
      ),
    },
    {
      key: 'referencia',
      label: 'Referencia',
      render: (row: FilaProducto) => (
        <span className="font-mono text-xs font-bold text-slate-800">{row.referencia}</span>
      ),
    },
    { key: 'nombre', label: 'Producto' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'marca', label: 'Marca' },
    {
      key: 'calidad',
      label: 'Calidad',
      render: (row: FilaProducto) =>
        row.calidad ? <Badge variant="neutral">{CALIDAD_LABEL[row.calidad as keyof typeof CALIDAD_LABEL]}</Badge> : '—',
    },
    { key: 'variantes', label: 'Var.', align: 'center' as const },
    {
      key: 'stockBodega',
      label: `Stock${bodegaActiva ? ` · ${bodegaActiva.nombre}` : ''}`,
      align: 'right' as const,
      render: (row: FilaProducto) => (
        <span className={row.stockBodega === 0 ? 'font-semibold text-red-500' : 'font-semibold text-slate-700'}>
          {row.stockBodega}
        </span>
      ),
    },
    {
      key: 'costo',
      label: 'Costo',
      align: 'right' as const,
      render: (row: FilaProducto) => formatoCOP(row.costo),
    },
    {
      key: 'precio',
      label: 'Precio',
      align: 'right' as const,
      render: (row: FilaProducto) => (
        <span className="font-semibold text-slate-800">{formatoCOP(row.precio)}</span>
      ),
    },
    {
      key: 'activo',
      label: 'Estado',
      align: 'center' as const,
      render: (row: FilaProducto) =>
        row.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="neutral">Inactivo</Badge>,
    },
    {
      key: 'acciones',
      label: '',
      width: '130px',
      render: (row: FilaProducto) => {
        const original = productos.find((p) => p.id === row.id);
        if (!original) return null;
        return (
          <div className="flex items-center justify-end gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Imprimir etiquetas de ${row.nombre}`}
              title="Imprimir etiquetas de código de barras"
              onClick={() => abrirImpresionParaProducto(original)}
              className="text-slate-600 hover:text-blue-600"
            >
              <Barcode className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label={`Editar ${row.nombre}`} onClick={() => { setEditando(original); setDialogForm(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label={`Agregar variantes a ${row.nombre}`} onClick={() => setAgregandoA(original)}>
              <PackagePlus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={row.activo ? `Desactivar ${row.nombre}` : `Activar ${row.nombre}`}
              title={row.activo ? "Desactivar producto" : "Activar producto"}
              onClick={async () => {
                await toggleProductoActivo(row.id);
                refrescar();
              }}
            >
              {row.activo ? <Archive className="h-4 w-4 text-slate-500" /> : <ArchiveRestore className="h-4 w-4 text-emerald-600" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Eliminar ${row.nombre}`}
              title="Eliminar producto y variantes"
              onClick={async () => {
                if (!confirm(`¿Estás seguro de eliminar el producto "${row.nombre}" (${row.referencia})?\nEsta acción eliminará el producto, sus variantes y stock.`)) {
                  return;
                }
                const res = await eliminarProducto(row.id);
                if (!res.ok) {
                  alert(res.error || "No se pudo eliminar el producto.");
                } else {
                  refrescar();
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
            </Button>
          </div>
        );
      },
    },
  ];

  const productosSeleccionadosLista = useMemo(() => {
    return productos.filter((p) => seleccionados.has(p.id));
  }, [productos, seleccionados]);

  return (
    <div className="space-y-4">
      {/* BARRA FLOTANTE / ALERTA DE SELECCIÓN MÚLTIPLE */}
      {seleccionados.size > 0 && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-900 px-4 py-2.5 rounded-xl shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
              {seleccionados.size}
            </span>
            <span className="text-xs font-semibold">
              {seleccionados.size === 1
                ? '1 producto seleccionado'
                : `${seleccionados.size} productos seleccionados`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSeleccionados(new Set())}
              className="text-xs text-red-700 hover:bg-red-100"
            >
              Deseleccionar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setModalBulkEliminar(true)}
              className="flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar seleccionados ({seleccionados.size})
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columnas}
        data={filas}
        pageTitle="Productos"
        description="Catálogo de prendas con sus variantes color × talla."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={abrirImpresionCatalogo}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Barcode className="h-4 w-4 text-blue-600" />
              Imprimir Etiquetas
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditando(null);
                setDialogForm(true);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-4 w-4" /> Nuevo producto
            </Button>
          </div>
        }
        filters={
          <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v)}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        }
        emptyTitle="Sin productos"
        emptyDescription="Crea tu primer producto o impórtalo desde Excel."
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN MÚLTIPLE */}
      <Dialog open={modalBulkEliminar} onOpenChange={setModalBulkEliminar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Eliminar {seleccionados.size} producto(s)
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará de forma permanente los productos seleccionados, sus variantes y
              existencias asociadas que no tengan historial de ventas.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1 text-xs">
            {productosSeleccionadosLista.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                <span className="font-medium text-slate-800">{p.nombre}</span>
                <span className="font-mono text-slate-500 font-semibold">{p.referencia}</span>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalBulkEliminar(false)}
              disabled={eliminandoBulk}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkEliminar}
              disabled={eliminandoBulk}
            >
              {eliminandoBulk ? 'Eliminando...' : `Sí, eliminar ${seleccionados.size} productos`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogForm} onOpenChange={setDialogForm}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? `Editar ${editando.referencia}` : 'Nuevo producto'}</DialogTitle>
            <DialogDescription>
              {editando
                ? 'Actualiza los datos base. Las variantes no se modifican aquí.'
                : 'Define los datos base y genera las variantes color × talla con stock inicial.'}
            </DialogDescription>
          </DialogHeader>
          <FormProducto
            key={editando?.id ?? 'nuevo'}
            producto={editando}
            catalogos={catalogos}
            bodega={bodegaActiva}
            disabled={pending}
            onListo={() => {
              setDialogForm(false);
              setEditando(null);
              refrescar();
            }}
            onCancelar={() => {
              setDialogForm(false);
              setEditando(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!agregandoA} onOpenChange={(v) => !v && setAgregandoA(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Agregar variantes · {agregandoA?.referencia}</DialogTitle>
            <DialogDescription>
              Combina colores y tallas que aún no existen en el producto.
            </DialogDescription>
          </DialogHeader>
          {agregandoA && (
            <DialogAgregarVariantes
              productoId={agregandoA.id}
              existentes={agregandoA.variantes.map((v) => `${v.colorId}-${v.tallaId}`)}
              catalogos={catalogos}
              bodega={bodegaActiva}
              disabled={pending}
              onListo={() => {
                setAgregandoA(null);
                refrescar();
              }}
              onCancelar={() => setAgregandoA(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ImpresionEtiquetasModal
        open={abrirEtiquetas}
        onClose={() => setAbrirEtiquetas(false)}
        variantes={variantesParaEtiquetas}
      />
    </div>
  );
}

// ───────────────────── formulario crear/editar ─────────────────

function FormProducto({
  producto,
  catalogos,
  bodega,
  disabled,
  onListo,
  onCancelar,
}: {
  producto: ProductoLista | null;
  catalogos: CatalogosCompletos;
  bodega: Bodega | null;
  disabled: boolean;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  // datos base
  const [referencia, setReferencia] = useState(producto?.referencia ?? '');
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
  const [categoriaId, setCategoriaId] = useState(String(producto?.categoriaId ?? ''));
  const [marcaId, setMarcaId] = useState(producto?.marcaId ? String(producto.marcaId) : 'ninguna');
  const [genero, setGenero] = useState<string>(producto?.genero ?? 'ninguna');
  const [material, setMaterial] = useState(producto?.material ?? '');
  const [calidad, setCalidad] = useState<string>(producto?.calidad ?? 'ninguna');
  const [temporada, setTemporada] = useState(producto?.temporada ?? '');
  const [costo, setCosto] = useState(producto ? String(producto.costo) : '0');
  const [precioBase, setPrecioBase] = useState(producto ? String(producto.precioBase) : '0');

  // constructor de variantes (solo creación)
  const [grupoId, setGrupoId] = useState<string>('');
  const [tallasSel, setTallasSel] = useState<Set<number>>(new Set());
  const [coloresSel, setColoresSel] = useState<Set<number>>(new Set());
  const [stocks, setStocks] = useState<Record<string, string>>({});
  const [minimo, setMinimo] = useState('0');

  const grupo = catalogos.grupos.find((g) => String(g.id) === grupoId);
  const combinaciones = useMemo(() => {
    const out: { colorId: number; tallaId: number }[] = [];
    for (const tallaId of tallasSel) {
      for (const colorId of coloresSel) {
        out.push({ colorId, tallaId });
      }
    }
    return out;
  }, [tallasSel, coloresSel]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const base = {
      referencia: referencia.trim().toUpperCase(),
      nombre,
      descripcion,
      categoriaId: Number(categoriaId),
      marcaId: marcaId === 'ninguna' ? null : Number(marcaId),
      genero: genero === 'ninguna' ? null : genero,
      material,
      calidad: calidad === 'ninguna' ? null : calidad,
      temporada,
      costo: Number(costo) || 0,
      precioBase: Number(precioBase) || 0,
    };

    if (producto) {
      const res = await actualizarProducto(producto.id, base);
      if (!res.ok) return setError(res.error);
      onListo();
      return;
    }

    if (!bodega) return setError('No hay bodega activa seleccionada.');
    const variantes = combinaciones.map(({ colorId, tallaId }) => ({
      colorId,
      tallaId,
      stocks: [
        {
          bodegaId: bodega.id,
          cantidad: Number(stocks[`${tallaId}-${colorId}`]) || 0,
          minimo: Number(minimo) || 0,
        },
      ],
    }));
    const res = await crearProducto({ ...base, variantes });
    if (!res.ok) return setError(res.error);
    onListo();
  }

  const sinCatalogos =
    (catalogos?.categorias?.length ?? 0) === 0 ||
    (catalogos?.grupos?.length ?? 0) === 0 ||
    (catalogos?.colores?.length ?? 0) === 0;

  return (
    <form onSubmit={enviar} className="grid gap-4">
      {/* Datos base */}
      <fieldset className="grid gap-3 sm:grid-cols-2" disabled={disabled}>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Referencia *</span>
          <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} required minLength={2} maxLength={24} pattern="[a-zA-Z0-9_-]+" placeholder="CAMI-001" className="uppercase" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Nombre *</span>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={3} maxLength={120} placeholder="Camisa manga larga" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Categoría *</span>
          <Select value={categoriaId || undefined} onValueChange={setCategoriaId} required>
            <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {(catalogos?.categorias ?? []).map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Marca</span>
          <Select value={marcaId || undefined} onValueChange={setMarcaId}>
            <SelectTrigger><SelectValue placeholder="Sin marca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ninguna">Sin marca</SelectItem>
              {(catalogos?.marcas ?? []).map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Género</span>
          <Select value={genero || undefined} onValueChange={setGenero}>
            <SelectTrigger><SelectValue placeholder="Sin género" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ninguna">Sin género</SelectItem>
              {GENEROS.map((g) => (
                <SelectItem key={g.valor} value={g.valor}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Calidad</span>
          <Select value={calidad || undefined} onValueChange={setCalidad}>
            <SelectTrigger><SelectValue placeholder="Sin clasificar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ninguna">Sin clasificar</SelectItem>
              {CALIDADES.map((c) => (
                <SelectItem key={c.valor} value={c.valor}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Material</span>
          <Input value={material} onChange={(e) => setMaterial(e.target.value)} maxLength={120} placeholder="Algodón 100%" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Temporada</span>
          <Input value={temporada} onChange={(e) => setTemporada(e.target.value)} maxLength={40} placeholder="Verano 2026" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Costo (COP) *</span>
          <Input type="number" min={0} value={costo} onChange={(e) => setCosto(e.target.value)} required />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Precio venta (COP) *</span>
          <Input type="number" min={0} value={precioBase} onChange={(e) => setPrecioBase(e.target.value)} required />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-xs font-semibold text-slate-600">Descripción</span>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </fieldset>

      {!producto && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
          <p className="mb-3 text-[13px] font-bold text-slate-700">Variantes color × talla *</p>
          {sinCatalogos ? (
            <p className="text-xs text-red-500">
              Necesitas al menos una categoría, un grupo de tallas y un color en Catálogos antes de crear productos.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-slate-600">Grupo de tallas</span>
                  <Select
                    value={grupoId || undefined}
                    onValueChange={(v) => {
                      setGrupoId(v);
                      setTallasSel(new Set());
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                    <SelectContent>
                      {catalogos.grupos.map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>{g.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <div className="sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-600">Colores ({coloresSel.size})</span>
                  <div className="mt-1 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                    {catalogos.colores.map((c) => {
                      const sel = coloresSel.has(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            const next = new Set(coloresSel);
                            if (sel) next.delete(c.id); else next.add(c.id);
                            setColoresSel(next);
                          }}
                          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            sel ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <span className="h-2.5 w-2.5 rounded-full border border-slate-300" style={{ backgroundColor: c.hex ?? '#e2e8f0' }} />
                          {c.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {grupo && (
                <div className="mt-3">
                  <span className="text-xs font-semibold text-slate-600">Tallas</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {grupo.tallas.map((t) => {
                      const sel = tallasSel.has(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            const next = new Set(tallasSel);
                            if (sel) next.delete(t.id); else next.add(t.id);
                            setTallasSel(next);
                          }}
                          className={`min-w-9 rounded-lg border px-2 py-1 text-xs font-bold transition-colors ${
                            sel ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {t.valor}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {combinaciones.length > 0 && bodega && (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-400">
                        <th className="px-3 py-2">Color \ Talla</th>
                        {[...tallasSel].map((tid) => (
                          <th key={tid} className="px-3 py-2 text-center">
                            {grupo?.tallas.find((t) => t.id === tid)?.valor}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...coloresSel].map((cid) => (
                        <tr key={cid} className="border-t border-slate-100">
                          <td className="px-3 py-1.5 font-semibold text-slate-600">
                            {catalogos.colores.find((c) => c.id === cid)?.nombre}
                          </td>
                          {[...tallasSel].map((tid) => (
                            <td key={tid} className="px-2 py-1.5 text-center">
                              <input
                                type="number"
                                min={0}
                                value={stocks[`${tid}-${cid}`] ?? ''}
                                onChange={(e) => setStocks({ ...stocks, [`${tid}-${cid}`]: e.target.value })}
                                placeholder="0"
                                className="w-16 rounded-md border border-slate-200 px-2 py-1 text-center text-xs outline-none focus:border-brand-400"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
                    <p className="text-[11px] text-slate-400">
                      Stock inicial para «{bodega.nombre}» · {combinaciones.length} variante(s)
                    </p>
                    <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                      Mínimo:
                      <input
                        type="number"
                        min={0}
                        value={minimo}
                        onChange={(e) => setMinimo(e.target.value)}
                        className="w-16 rounded-md border border-slate-200 px-2 py-1 text-center outline-none focus:border-brand-400"
                      />
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" disabled={disabled || sinCatalogos}>
          {producto ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─────────────────── agregar variantes a producto ──────────────

function DialogAgregarVariantes({
  productoId,
  existentes,
  catalogos,
  bodega,
  disabled,
  onListo,
  onCancelar,
}: {
  productoId: number;
  existentes: string[];
  catalogos: CatalogosCompletos;
  bodega: Bodega | null;
  disabled: boolean;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [grupoId, setGrupoId] = useState('');
  const [tallasSel, setTallasSel] = useState<Set<number>>(new Set());
  const [coloresSel, setColoresSel] = useState<Set<number>>(new Set());
  const [cantidad, setCantidad] = useState('0');
  const [minimo, setMinimo] = useState('0');
  const [error, setError] = useState<string | null>(null);

  const grupo = catalogos.grupos.find((g) => String(g.id) === grupoId);

  const combinaciones = useMemo(() => {
    const out: { colorId: number; tallaId: number; clave: string }[] = [];
    for (const tallaId of tallasSel) {
      for (const colorId of coloresSel) {
        const clave = `${colorId}-${tallaId}`;
        if (!existentes.includes(clave)) out.push({ colorId, tallaId, clave });
      }
    }
    return out;
  }, [tallasSel, coloresSel, existentes]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!bodega) return setError('No hay bodega activa.');
    const res = await agregarVariantes({
      productoId,
      combinaciones: combinaciones.map(({ colorId, tallaId }) => ({ colorId, tallaId })),
      stocks: [{ bodegaId: bodega.id, cantidad: Number(cantidad) || 0, minimo: Number(minimo) || 0 }],
    });
    if (!res.ok) return setError(res.error);
    onListo();
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Grupo de tallas</span>
          <Select value={grupoId || undefined} onValueChange={(v) => { setGrupoId(v); setTallasSel(new Set()); }}>
            <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {catalogos.grupos.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>{g.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Cantidad inicial</span>
          <Input type="number" min={0} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Mínimo</span>
          <Input type="number" min={0} value={minimo} onChange={(e) => setMinimo(e.target.value)} />
        </label>
      </div>

      {grupo && (
        <div className="flex flex-wrap gap-1.5">
          {grupo.tallas.map((t) => {
            const sel = tallasSel.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { const n = new Set(tallasSel); if (sel) n.delete(t.id); else n.add(t.id); setTallasSel(n); }}
                className={`min-w-9 rounded-lg border px-2 py-1 text-xs font-bold transition-colors ${
                  sel ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {t.valor}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
        {catalogos.colores.map((c) => {
          const sel = coloresSel.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => { const n = new Set(coloresSel); if (sel) n.delete(c.id); else n.add(c.id); setColoresSel(n); }}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                sel ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-slate-300" style={{ backgroundColor: c.hex ?? '#e2e8f0' }} />
              {c.nombre}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        Se crearán <strong>{combinaciones.length}</strong> variante(s) nuevas{' '}
        {bodega && <>con stock en «{bodega.nombre}»</>}.
      </p>
      {combinaciones.length === 0 && (tallasSel.size > 0 || coloresSel.size > 0) && (
        <p className="text-xs font-semibold text-amber-500">Todas esas combinaciones ya existen.</p>
      )}
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" disabled={disabled || combinaciones.length === 0}>
          <Package className="mr-1 h-4 w-4" /> Agregar {combinaciones.length || ''}
        </Button>
      </DialogFooter>
    </form>
  );
}
