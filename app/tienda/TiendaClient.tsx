'use client';

import { useState, useMemo, useEffect } from 'react';
import { Sparkles, SlidersHorizontal, Package, RefreshCw, Phone, MapPin, X, Heart, ShoppingBag, ArrowRight, Layers, Tag, ChevronRight } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import NavbarTienda from '@/components/tienda/NavbarTienda';
import HeroBanner from '@/components/tienda/HeroBanner';
import TrustBadges from '@/components/tienda/TrustBadges';
import CategoryGrid from '@/components/tienda/CategoryGrid';
import ProductSection from '@/components/tienda/ProductSection';
import FooterTienda from '@/components/tienda/FooterTienda';
import ProductCardTienda, { type ItemBolsa } from '@/components/tienda/ProductCardTienda';
import ProductDetailModal from '@/components/tienda/ProductDetailModal';
import CartDrawerTienda from '@/components/tienda/CartDrawerTienda';
import RecentPurchaseToast from '@/components/tienda/RecentPurchaseToast';
import ExitIntentModal from '@/components/tienda/ExitIntentModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { formatoCOP } from '@/lib/format';

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
  fechaFin: Date | string | null;
}

export interface CuentaBancariaTienda {
  id: number;
  nombre: string;
  tipo: string;
  numeroCuenta: string | null;
  titular: string | null;
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
  cuentasBancarias?: CuentaBancariaTienda[];
  ventasPorProducto?: Record<number, number>;
  actividadReciente?: ActividadReciente[];
  promocionDestacada?: PromocionDestacada | null;
}

export default function TiendaClient({
  productos,
  categorias,
  configuracion,
  cuentasBancarias = [],
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

  // Wishlist (Lista de Deseos)
  const [wishlistAbierto, setWishlistAbierto] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  // Modal de Detalle
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoLista | null>(null);

  // Vistos recientemente
  const [vistosIds, setVistosIds] = useState<number[]>([]);

  // Cargar carrito y wishlist guardados en localStorage
  useEffect(() => {
    try {
      const cart = localStorage.getItem('kaob_cart_items');
      if (cart) setItemsBolsa(JSON.parse(cart));
      
      const wish = localStorage.getItem('kaob_wishlist');
      if (wish) setWishlistIds(JSON.parse(wish));

      const vistos = localStorage.getItem('kaob_vistos');
      if (vistos) setVistosIds(JSON.parse(vistos));
    } catch {
      // Ignorar error de parse
    }
  }, []);

  // Guardar carrito
  useEffect(() => {
    try {
      localStorage.setItem('kaob_cart_items', JSON.stringify(itemsBolsa));
    } catch {}
  }, [itemsBolsa]);

  // Guardar wishlist
  useEffect(() => {
    try {
      localStorage.setItem('kaob_wishlist', JSON.stringify(wishlistIds));
    } catch {}
  }, [wishlistIds]);

  const toggleWishlist = (productoId: number) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productoId);
      if (exists) return prev.filter((id) => id !== productoId);
      return [...prev, productoId];
    });
  };

  const abrirDetalleProducto = (producto: ProductoLista) => {
    setProductoSeleccionado(producto);
    setVistosIds((prev) => {
      const siguiente = [producto.id, ...prev.filter((id) => id !== producto.id)].slice(0, 8);
      try {
        localStorage.setItem('kaob_vistos', JSON.stringify(siguiente));
      } catch {}
      return siguiente;
    });
  };

  const scrollAlCatalogo = () => {
    setTimeout(() => {
      const el = document.getElementById('catalogo-productos');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  // Sugerencias predictivas
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
        precio: p.precioBase,
      }));
  }, [productos, busqueda]);

  const handleSeleccionarSugerencia = (productoId: number) => {
    const prod = productos.find((p) => p.id === productoId);
    if (prod) {
      abrirDetalleProducto(prod);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // MATRIZ BIDIMENSIONAL DINÁMICA: GÉNERO × CATEGORÍA DE INVENTARIO
  // ───────────────────────────────────────────────────────────────────────────

  // 1. Productos filtrados por Género Macro
  const productosPorGenero = useMemo(() => {
    if (!generoActivo) return productos.filter((p) => p.activo);
    if (generoActivo === 'DAMA') {
      return productos.filter(
        (p) =>
          p.activo &&
          (p.genero === 'DAMA' ||
            (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes('dama')) ||
            p.nombre.toLowerCase().includes('dama') ||
            p.nombre.toLowerCase().includes('mujer'))
      );
    }
    if (generoActivo === 'CABALLERO') {
      return productos.filter(
        (p) =>
          p.activo &&
          (p.genero === 'CABALLERO' ||
            (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes('caballero')) ||
            p.nombre.toLowerCase().includes('caballero') ||
            p.nombre.toLowerCase().includes('hombre'))
      );
    }
    if (generoActivo === 'UNISEX') {
      return productos.filter(
        (p) =>
          p.activo &&
          (p.genero === 'UNISEX' ||
            (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes('unisex')) ||
            !p.genero)
      );
    }
    if (generoActivo === 'ACCESORIOS') {
      return productos.filter(
        (p) =>
          p.activo &&
          ((p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes('accesorio')) ||
            (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes('gorra')) ||
            p.nombre.toLowerCase().includes('gorra') ||
            p.nombre.toLowerCase().includes('cap') ||
            p.nombre.toLowerCase().includes('morral') ||
            p.nombre.toLowerCase().includes('accesorio'))
      );
    }
    return productos.filter((p) => p.activo);
  }, [productos, generoActivo]);

  // 2. Subcategorías reales dinámicas que tienen productos en el género actual
  const subcategoriasDinamicas = useMemo(() => {
    const map = new Map<string, number>();
    productosPorGenero.forEach((p) => {
      const nombreCat = p.categoria?.nombre;
      if (nombreCat) {
        map.set(nombreCat, (map.get(nombreCat) || 0) + 1);
      }
    });

    return Array.from(map.entries()).map(([nombre, conteo]) => ({
      nombre,
      conteo,
    }));
  }, [productosPorGenero]);

  // 3. Filtrado completo aplicando Género + Categoría + Búsqueda + Orden
  const productosFiltrados = useMemo(() => {
    let list = [...productosPorGenero];

    // Filtrar por Categoría
    if (categoriaActiva) {
      list = list.filter((p) => p.categoria?.nombre === categoriaActiva);
    }

    // Filtrar por Búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.referencia.toLowerCase().includes(q) ||
          (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes(q)) ||
          p.variantes.some((v) => v.color.nombre.toLowerCase().includes(q))
      );
    }

    // Ordenamiento
    if (orden === 'precio-asc') {
      list.sort((a, b) => a.precioBase - b.precioBase);
    } else if (orden === 'precio-desc') {
      list.sort((a, b) => b.precioBase - a.precioBase);
    } else if (orden === 'nombre') {
      list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return list;
  }, [productosPorGenero, categoriaActiva, busqueda, orden]);

  // New Arrivals
  const newArrivals = useMemo(() => {
    return [...productos.filter((p) => p.activo)].slice(0, 6);
  }, [productos]);

  // Best Sellers
  const bestSellers = useMemo(() => {
    return [...productos.filter((p) => p.activo)]
      .sort((a, b) => (ventasPorProducto[b.id] ?? 0) - (ventasPorProducto[a.id] ?? 0))
      .slice(0, 6);
  }, [productos, ventasPorProducto]);

  // Productos en Wishlist
  const productosWishlist = useMemo(() => {
    return productos.filter((p) => wishlistIds.includes(p.id));
  }, [productos, wishlistIds]);

  // Manejadores de Bolsa
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

  const GENERO_LABEL: Record<string, string> = {
    CABALLERO: 'MEN / CABALLERO',
    DAMA: 'WOMEN / DAMA',
    UNISEX: 'OVERSIZE & UNISEX',
    ACCESORIOS: 'ACCESSORIES',
  };

  const hayFiltroActivo = Boolean(busqueda || categoriaActiva || generoActivo);

  const limpiarFiltros = () => {
    setGeneroActivo(null);
    setCategoriaActiva(null);
    setBusqueda('');
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] font-sans text-zinc-950 flex flex-col justify-between selection:bg-black selection:text-white">
      
      {/* NAVBAR */}
      <NavbarTienda
        totalItemsEnBolsa={totalItemsEnBolsa}
        onAbrirBolsa={() => setBolsaAbierta(true)}
        totalWishlist={wishlistIds.length}
        onAbrirWishlist={() => setWishlistAbierto(true)}
        busqueda={busqueda}
        onCambiarBusqueda={(val) => {
          setBusqueda(val);
          if (val) scrollAlCatalogo();
        }}
        categoriaActiva={categoriaActiva}
        onSeleccionarCategoria={(cat) => {
          setCategoriaActiva(cat);
          scrollAlCatalogo();
        }}
        generoActivo={generoActivo}
        onSeleccionarGenero={(gen) => {
          setGeneroActivo(gen);
          setCategoriaActiva(null);
          scrollAlCatalogo();
        }}
        categorias={categorias}
        sugerencias={sugerenciasBusqueda}
        onSeleccionarSugerencia={handleSeleccionarSugerencia}
        promocionDestacada={promocionDestacada ? { ...promocionDestacada, fechaFin: promocionDestacada.fechaFin ?? '' } : null}
      />

      {/* ────────────────── SECCIÓN 1: HERO BANNER COMPACTO ────────────────── */}
      <HeroBanner
        onExplorarClick={scrollAlCatalogo}
        onCategoriaClick={(gen) => {
          setGeneroActivo(gen);
          setCategoriaActiva(null);
          scrollAlCatalogo();
        }}
      />

      {/* ────────────────── SECCIÓN 2: 4 COLECCIONES MACRO & SUBCATEGORÍAS ────────────────── */}
      <CategoryGrid
        generoActivo={generoActivo}
        categoriaActiva={categoriaActiva}
        onSelectCategory={(cat, gen) => {
          setGeneroActivo(gen);
          setCategoriaActiva(cat);
        }}
        subcategoriasDinamicas={subcategoriasDinamicas}
        totalProductosGenero={productosPorGenero.length}
        productos={productos}
      />

      {/* ────────────────── SECCIÓN 3: CATÁLOGO PRINCIPAL COMPACTO ────────────────── */}
      <main id="catalogo-productos" className="max-w-[1520px] mx-auto px-4 sm:px-8 py-8 flex-1 w-full scroll-mt-24">
        
        {/* Barra Superior del Catálogo: Título, Filtros Activos y Orden */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 mb-6 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-bold tracking-[0.25em] text-zinc-400 uppercase">
                {generoActivo ? GENERO_LABEL[generoActivo] || generoActivo : 'COLECCIÓN COMPLETA'}
              </span>
              {categoriaActiva && (
                <>
                  <span className="text-zinc-300">/</span>
                  <span className="text-[9.5px] font-bold tracking-[0.2em] text-zinc-900 uppercase">
                    {categoriaActiva}
                  </span>
                </>
              )}
            </div>
            
            <h2 className="font-serif text-xl sm:text-3xl font-light text-zinc-950 uppercase mt-0.5">
              {busqueda
                ? `Resultados: "${busqueda}"`
                : categoriaActiva
                ? categoriaActiva
                : generoActivo
                ? `Prendas de ${GENERO_LABEL[generoActivo] || generoActivo}`
                : 'Todo el Drop'}
            </h2>
            
            <p className="text-[11px] text-zinc-500 font-light mt-0.5">
              {productosFiltrados.length === 1
                ? '1 prenda disponible en atelier'
                : `${productosFiltrados.length} prendas disponibles en atelier`}
            </p>
          </div>

          {/* Acciones Rápidas: Limpiar Filtros y Ordenar */}
          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            {hayFiltroActivo && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-black hover:text-white text-[11px] font-bold uppercase tracking-wider text-zinc-800 transition-colors rounded-sm"
              >
                <span>Limpiar</span>
                <X className="h-3 w-3" />
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">ORDEN:</span>
              <Select value={orden} onValueChange={(v: any) => setOrden(v)}>
                <SelectTrigger className="w-[145px] sm:w-[160px] text-xs h-8 bg-white border-zinc-300 rounded-none font-medium">
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

        {/* Cuadrícula de Productos de Alta Densidad */}
        {productosFiltrados.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
            <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="font-serif text-lg font-light text-zinc-800 uppercase">
              No encontramos prendas con los filtros seleccionados
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Intenta seleccionando otra categoría o limpiando la búsqueda.
            </p>
            <Button
              onClick={limpiarFiltros}
              className="mt-4 bg-black text-white text-xs font-bold tracking-widest uppercase rounded-none px-6 py-2"
            >
              VER TODAS LAS PRENDAS
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 lg:gap-4">
            {productosFiltrados.map((producto) => (
              <ProductCardTienda
                key={producto.id}
                producto={producto}
                onAgregarABolsa={agregarABolsa}
                onVerDetalle={abrirDetalleProducto}
                vendidosRecientes={ventasPorProducto[producto.id] ?? 0}
                isWishlisted={wishlistIds.includes(producto.id)}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        )}
      </main>

      {/* ────────────────── SECCIÓN 4: BEST SELLERS (Solo si no hay filtro específico) ────────────────── */}
      {!hayFiltroActivo && bestSellers.length > 0 && (
        <ProductSection
          title="BEST SELLERS"
          eyebrow="COMMUNITY FAVORITES"
          subtitle="Las piezas más solicitadas por la comunidad KΛOB en toda Colombia."
          productos={bestSellers}
          ventasPorProducto={ventasPorProducto}
          onAgregarABolsa={agregarABolsa}
          onVerDetalle={abrirDetalleProducto}
          onVerTodos={scrollAlCatalogo}
          wishlistIds={wishlistIds}
          onToggleWishlist={toggleWishlist}
        />
      )}

      {/* ────────────────── SECCIÓN 5: VALUE PROPOSITION & TRUST BADGES ────────────────── */}
      <TrustBadges />

      {/* ────────────────── FOOTER OFICIAL ────────────────── */}
      <FooterTienda
        categorias={categorias}
        onSeleccionarCategoria={(cat) => {
          setCategoriaActiva(cat);
          scrollAlCatalogo();
        }}
        onSeleccionarGenero={(gen) => {
          setGeneroActivo(gen);
          setCategoriaActiva(null);
          scrollAlCatalogo();
        }}
        telefonoWhatsApp={configuracion?.telefono}
      />

      {/* ────────────────── MODALES Y DRAWERS ────────────────── */}
      
      {/* Drawer de Bolsa de Compras */}
      <CartDrawerTienda
        abierto={bolsaAbierta}
        onCerrar={() => setBolsaAbierta(false)}
        items={itemsBolsa}
        onActualizarCantidad={actualizarCantidadItem}
        onEliminarItem={eliminarItem}
        onVaciarBolsa={() => setItemsBolsa([])}
        telefonoWhatsAppTienda={configuracion?.telefono}
        cuentasBancarias={cuentasBancarias}
      />

      {/* Modal de Detalle de Producto */}
      <ProductDetailModal
        producto={productoSeleccionado}
        abierto={Boolean(productoSeleccionado)}
        onCerrar={() => setProductoSeleccionado(null)}
        onAgregarABolsa={agregarABolsa}
      />

      {/* Modal de Lista de Deseos (Wishlist) */}
      <Dialog open={wishlistAbierto} onOpenChange={setWishlistAbierto}>
        <DialogContent className="max-w-2xl bg-white text-zinc-950 rounded-none border border-zinc-200 p-6">
          <DialogHeader className="border-b border-zinc-100 pb-4">
            <DialogTitle className="font-serif text-2xl font-light uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <span>Lista de Deseos ({productosWishlist.length})</span>
            </DialogTitle>
          </DialogHeader>

          {productosWishlist.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <p className="text-sm">No tienes prendas guardadas en tu wishlist.</p>
              <Button
                onClick={() => setWishlistAbierto(false)}
                className="mt-4 bg-black text-white text-xs font-bold tracking-widest uppercase rounded-none"
              >
                EXPLORAR CATÁLOGO
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto py-3">
              {productosWishlist.map((p) => (
                <ProductCardTienda
                  key={p.id}
                  producto={p}
                  onAgregarABolsa={agregarABolsa}
                  onVerDetalle={(prod) => {
                    setWishlistAbierto(false);
                    abrirDetalleProducto(prod);
                  }}
                  isWishlisted={true}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notificaciones de Compra Reciente */}
      <RecentPurchaseToast actividad={actividadReciente} />

      {/* Modal de Intención de Salida */}
      <ExitIntentModal
        totalItemsEnBolsa={totalItemsEnBolsa}
        resumenCarrito={itemsBolsa.map((i) => `${i.cantidad}x ${i.nombre} (${i.tallaValor})`).join(', ')}
      />
    </div>
  );
}
