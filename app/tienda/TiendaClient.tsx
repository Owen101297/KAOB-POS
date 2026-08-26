'use client';

import { useState, useMemo, useEffect } from 'react';
import { Sparkles, SlidersHorizontal, Package, RefreshCw, Phone, MapPin, X } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import NavbarTienda from '@/components/tienda/NavbarTienda';
import HeroTienda from '@/components/tienda/HeroTienda';
import CategoryGridBento from '@/components/tienda/CategoryGridBento';
import SocialProofSection from '@/components/tienda/SocialProofSection';
import FooterTienda from '@/components/tienda/FooterTienda';
import ProductCardTienda from '@/components/tienda/ProductCardTienda';
import ProductDetailModal from '@/components/tienda/ProductDetailModal';
import CartDrawerTienda, { type ItemBolsa } from '@/components/tienda/CartDrawerTienda';
import RecentlyViewedTienda from '@/components/tienda/RecentlyViewedTienda';
import RecentPurchaseToast from '@/components/tienda/RecentPurchaseToast';
import ExitIntentModal from '@/components/tienda/ExitIntentModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface ActividadReciente {
  nombre: string;
  producto: string;
  minutosAtras: number;
  ciudad: string;
}

interface PromocionDestacada {
  nombre: string;
  tipo: string;
  valor: number;
  fechaFin: Date | string;
}

interface Props {
  productos: ProductoLista[];
  categorias: { id: number; nombre: string }[];
  configuracion?: {
    nombreTienda?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
  };
  ventasPorProducto?: Record<number, number>;
  actividadReciente?: ActividadReciente[];
  promocionDestacada?: PromocionDestacada | null;
}

export default function TiendaClient({
  productos,
  categorias,
  configuracion,
  ventasPorProducto = {},
  actividadReciente = [],
  promocionDestacada = null,
}: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [generoActivo, setGeneroActivo] = useState<string | null>(null);
  const [orden, setOrden] = useState<'recientes' | 'precio-asc' | 'precio-desc' | 'nombre'>('recientes');
  
  // Bolsa de compras
  const [bolsaAbierta, setBolsaAbierta] = useState(false);
  const [itemsBolsa, setItemsBolsa] = useState<ItemBolsa[]>([]);

  // Modal de Detalle
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoLista | null>(null);

  // Vistos recientemente
  const [vistosIds, setVistosIds] = useState<number[]>([]);

  // Cargar carrito guardado en localStorage
  useEffect(() => {
    try {
      const guardado = localStorage.getItem('kaob_cart_items');
      if (guardado) {
        setItemsBolsa(JSON.parse(guardado));
      }
      const vistos = localStorage.getItem('kaob_vistos');
      if (vistos) {
        setVistosIds(JSON.parse(vistos));
      }
    } catch {
      // Ignorar error de JSON parse
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem('kaob_cart_items', JSON.stringify(itemsBolsa));
    } catch {
      // Ignorar
    }
  }, [itemsBolsa]);

  const abrirDetalleProducto = (producto: ProductoLista) => {
    setProductoSeleccionado(producto);
    setVistosIds((prev) => {
      const siguiente = [producto.id, ...prev.filter((id) => id !== producto.id)].slice(0, 8);
      try {
        localStorage.setItem('kaob_vistos', JSON.stringify(siguiente));
      } catch {
        // Ignorar
      }
      return siguiente;
    });
  };

  // Sugerencias de búsqueda predictiva para el navbar
  const sugerenciasBusqueda = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase().trim();
    return productos
      .filter((p) => p.activo)
      .filter((p) => p.nombre.toLowerCase().includes(q) || p.referencia.toLowerCase().includes(q))
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        referencia: p.referencia,
        precio: p.variantes[0]?.precioOverride ?? p.precioBase,
      }));
  }, [productos, busqueda]);

  const handleSeleccionarSugerencia = (id: number) => {
    const producto = productos.find((p) => p.id === id);
    if (producto) abrirDetalleProducto(producto);
  };

  const resumenCarrito = useMemo(() => {
    if (itemsBolsa.length === 0) return undefined;
    return itemsBolsa.map((it) => `${it.cantidad}x ${it.nombre} (${it.tallaValor}/${it.colorNombre})`).join('; ');
  }, [itemsBolsa]);

  // Filtrado y Ordenamiento
  const productosFiltrados = useMemo(() => {
    let list = productos.filter((p) => p.activo);

    // Filtrar por Sexo / Colección
    if (generoActivo) {
      if (generoActivo === 'DAMA') {
        list = list.filter(
          (p) =>
            p.genero === 'DAMA' ||
            (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes('dama')) ||
            p.nombre.toLowerCase().includes('dama') ||
            p.nombre.toLowerCase().includes('mujer')
        );
      } else if (generoActivo === 'CABALLERO') {
        list = list.filter(
          (p) =>
            p.genero === 'CABALLERO' ||
            (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes('caballero')) ||
            p.nombre.toLowerCase().includes('caballero') ||
            p.nombre.toLowerCase().includes('hombre')
        );
      } else if (generoActivo === 'UNISEX') {
        list = list.filter(
          (p) =>
            p.genero === 'UNISEX' ||
            (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes('unisex')) ||
            !p.genero
        );
      } else if (generoActivo === 'ACCESORIOS') {
        list = list.filter(
          (p) =>
            (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes('accesorio')) ||
            (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes('gorra')) ||
            p.nombre.toLowerCase().includes('gorra') ||
            p.nombre.toLowerCase().includes('cap') ||
            p.nombre.toLowerCase().includes('morral') ||
            p.nombre.toLowerCase().includes('accesorio')
        );
      }
    }

    // Filtrar por Categoría
    if (categoriaActiva) {
      list = list.filter((p) => p.categoria?.nombre === categoriaActiva);
    }

    // Filtrar por Búsqueda de texto
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.referencia.toLowerCase().includes(q) ||
          (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes(q))
      );
    }

    // Ordenamiento
    const copy = [...list];
    if (orden === 'precio-asc') {
      copy.sort((a, b) => a.precioBase - b.precioBase);
    } else if (orden === 'precio-desc') {
      copy.sort((a, b) => b.precioBase - a.precioBase);
    } else if (orden === 'nombre') {
      copy.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return copy;
  }, [productos, generoActivo, categoriaActiva, busqueda, orden]);

  // Manejadores de Carrito
  const agregarABolsa = (nuevoItem: ItemBolsa) => {
    setItemsBolsa((prev) => {
      const idx = prev.findIndex((it) => it.varianteId === nuevoItem.varianteId);
      if (idx >= 0) {
        const next = [...prev];
        const cantActual = next[idx].cantidad;
        const nuevaCant = Math.min(cantActual + nuevoItem.cantidad, nuevoItem.stockDisponible);
        next[idx] = { ...next[idx], cantidad: nuevaCant };
        return next;
      }
      return [...prev, nuevoItem];
    });
  };

  const actualizarCantidadItem = (varianteId: number, delta: number) => {
    setItemsBolsa((prev) => {
      return prev
        .map((it) => {
          if (it.varianteId === varianteId) {
            const nueva = it.cantidad + delta;
            return nueva > 0 ? { ...it, cantidad: Math.min(nueva, it.stockDisponible) } : null;
          }
          return it;
        })
        .filter(Boolean) as ItemBolsa[];
    });
  };

  const eliminarItem = (varianteId: number) => {
    setItemsBolsa((prev) => prev.filter((it) => it.varianteId !== varianteId));
  };

  const totalItemsEnBolsa = itemsBolsa.reduce((acc, it) => acc + it.cantidad, 0);

  const handleExplorar = () => {
    const el = document.getElementById('catalogo-prendas');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const tituloSeccion = useMemo(() => {
    if (busqueda) return `Resultados para "${busqueda}"`;
    if (generoActivo === 'DAMA') return 'Colección Dama 👩';
    if (generoActivo === 'CABALLERO') return 'Colección Caballero 👨';
    if (generoActivo === 'UNISEX') return 'Línea Unisex & Urban ⚡';
    if (generoActivo === 'ACCESORIOS') return 'Accesorios & Gorras 🎒';
    if (categoriaActiva) return `Categoría: ${categoriaActiva}`;
    return 'Catálogo Completo';
  }, [busqueda, generoActivo, categoriaActiva]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col justify-between selection:bg-zinc-900 selection:text-white">
      {/* NAVBAR */}
      <NavbarTienda
        totalItemsEnBolsa={totalItemsEnBolsa}
        onAbrirBolsa={() => setBolsaAbierta(true)}
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        categoriaActiva={categoriaActiva}
        onSeleccionarCategoria={setCategoriaActiva}
        generoActivo={generoActivo}
        onSeleccionarGenero={setGeneroActivo}
        categorias={categorias}
        sugerencias={sugerenciasBusqueda}
        onSeleccionarSugerencia={handleSeleccionarSugerencia}
        promocionDestacada={promocionDestacada}
      />

      {/* HERO BANNER EDITORIAL */}
      {!busqueda && (
        <HeroTienda
          onExplorar={handleExplorar}
          onSeleccionarGenero={setGeneroActivo}
          categorias={categorias}
          categoriaSeleccionada={categoriaActiva}
          onSeleccionarCategoria={setCategoriaActiva}
        />
      )}

      {/* BENTO GRID DE COLECCIONES POR GÉNERO */}
      {!busqueda && (
        <CategoryGridBento
          onSeleccionarGenero={setGeneroActivo}
          generoSeleccionado={generoActivo}
        />
      )}

      {/* CATÁLOGO DE PRODUCTOS */}
      <main id="catalogo-prendas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex-1 w-full">
        {/* Cabecera del Catálogo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900">
                {tituloSeccion}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {productosFiltrados.length === 1
                ? '1 prenda disponible en vitrina'
                : `${productosFiltrados.length} prendas disponibles en vitrina`}
            </p>
          </div>

          {/* Filtros Activos & Ordenamiento */}
          <div className="flex items-center gap-3 flex-wrap">
            {(generoActivo || categoriaActiva || busqueda) && (
              <button
                type="button"
                onClick={() => {
                  setGeneroActivo(null);
                  setCategoriaActiva(null);
                  setBusqueda('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-200 hover:bg-zinc-300 text-xs font-bold text-zinc-800 transition-colors"
              >
                <span>Limpiar filtros</span>
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 whitespace-nowrap">Ordenar:</span>
              <Select value={orden} onValueChange={(v: any) => setOrden(v)}>
                <SelectTrigger className="w-[170px] text-xs h-9 bg-white border-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recientes">Más recientes</SelectItem>
                  <SelectItem value="precio-asc">Menor precio</SelectItem>
                  <SelectItem value="precio-desc">Mayor precio</SelectItem>
                  <SelectItem value="nombre">Nombre A - Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Rejilla de Productos */}
        {productosFiltrados.length === 0 ? (
          <div className="my-16 text-center p-10 bg-white rounded-3xl border border-zinc-200 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-zinc-900">No se encontraron prendas</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              {busqueda
                ? `No hay resultados para "${busqueda}". Intenta con otra palabra clave.`
                : 'No hay productos disponibles en esta sección actualmente.'}
            </p>
            {(busqueda || categoriaActiva || generoActivo) && (
              <Button
                variant="outline"
                onClick={() => {
                  setBusqueda('');
                  setCategoriaActiva(null);
                  setGeneroActivo(null);
                }}
                className="mt-5 text-xs font-bold uppercase tracking-wider rounded-full"
              >
                Ver todo el catálogo
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosFiltrados.map((prod) => (
              <ProductCardTienda
                key={prod.id}
                producto={prod}
                onAgregarABolsa={agregarABolsa}
                onVerDetalle={abrirDetalleProducto}
                vendidosRecientes={ventasPorProducto[prod.id] ?? 0}
              />
            ))}
          </div>
        )}
      </main>

      {/* VISTOS RECIENTEMENTE */}
      <RecentlyViewedTienda productos={productos} idsVistos={vistosIds} onVerDetalle={abrirDetalleProducto} />

      {/* SECCIÓN SOCIAL PROOF Y GARANTÍAS */}
      <SocialProofSection />

      {/* FOOTER OFICIAL */}
      <FooterTienda
        categorias={categorias}
        onSeleccionarCategoria={setCategoriaActiva}
        onSeleccionarGenero={setGeneroActivo}
        telefonoWhatsApp={configuracion?.telefono || '573000000000'}
      />

      {/* MODALES INTERACTIVOS */}
      <ProductDetailModal
        producto={productoSeleccionado}
        abierto={Boolean(productoSeleccionado)}
        onCerrar={() => setProductoSeleccionado(null)}
        onAgregarABolsa={agregarABolsa}
      />

      <CartDrawerTienda
        abierto={bolsaAbierta}
        onCerrar={() => setBolsaAbierta(false)}
        items={itemsBolsa}
        onActualizarCantidad={actualizarCantidadItem}
        onEliminarItem={eliminarItem}
        onVaciarBolsa={() => setItemsBolsa([])}
        telefonoWhatsAppTienda={configuracion?.telefono || '573000000000'}
      />

      {/* PRUEBA SOCIAL EN TIEMPO REAL (basada en pedidos reales) */}
      <RecentPurchaseToast actividad={actividadReciente} />

      {/* RECUPERACIÓN DE VISITANTES QUE VAN A ABANDONAR LA TIENDA */}
      <ExitIntentModal totalItemsEnBolsa={totalItemsEnBolsa} resumenCarrito={resumenCarrito} />
    </div>
  );
}
