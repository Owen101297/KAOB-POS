'use client';

import { useState, useMemo, useEffect } from 'react';
import { Sparkles, SlidersHorizontal, Package, RefreshCw, Phone, MapPin, X, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import NavbarTienda from '@/components/tienda/NavbarTienda';
import HeroBanner from '@/components/tienda/HeroBanner';
import TrustBadges from '@/components/tienda/TrustBadges';
import CategoryGrid from '@/components/tienda/CategoryGrid';
import ProductSection from '@/components/tienda/ProductSection';
import SplitBanner from '@/components/tienda/SplitBanner';
import JournalSection from '@/components/tienda/JournalSection';
import NewsletterForm from '@/components/tienda/NewsletterForm';
import FooterTienda from '@/components/tienda/FooterTienda';
import ProductCardTienda, { type ItemBolsa } from '@/components/tienda/ProductCardTienda';
import ProductDetailModal from '@/components/tienda/ProductDetailModal';
import CartDrawerTienda from '@/components/tienda/CartDrawerTienda';
import RecentlyViewedTienda from '@/components/tienda/RecentlyViewedTienda';
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

    if (categoriaActiva) {
      list = list.filter((p) => p.categoria?.nombre === categoriaActiva);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.referencia.toLowerCase().includes(q) ||
          (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes(q))
      );
    }

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

  // New Arrivals (productos más recientes)
  const newArrivals = useMemo(() => {
    return [...productos.filter((p) => p.activo)].slice(0, 6);
  }, [productos]);

  // Best Sellers (ordenados por mayor venta)
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

  const handleExplorarCatalogo = () => {
    const el = document.getElementById('catalogo-prendas');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const hayFiltroActivo = Boolean(busqueda || categoriaActiva || generoActivo);

  return (
    <div className="min-h-screen bg-[#FFFFFF] font-sans text-zinc-950 flex flex-col justify-between selection:bg-black selection:text-white">
      
      {/* NAVBAR */}
      <NavbarTienda
        totalItemsEnBolsa={totalItemsEnBolsa}
        onAbrirBolsa={() => setBolsaAbierta(true)}
        totalWishlist={wishlistIds.length}
        onAbrirWishlist={() => setWishlistAbierto(true)}
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        categoriaActiva={categoriaActiva}
        onSeleccionarCategoria={setCategoriaActiva}
        generoActivo={generoActivo}
        onSeleccionarGenero={setGeneroActivo}
        categorias={categorias}
        sugerencias={sugerenciasBusqueda}
        onSeleccionarSugerencia={handleSeleccionarSugerencia}
        promocionDestacada={promocionDestacada ? { ...promocionDestacada, fechaFin: promocionDestacada.fechaFin ?? '' } : null}
      />

      {/* ────────────────── JERARQUÍA EDITORIAL DE 9 SECCIONES ────────────────── */}
      {!hayFiltroActivo ? (
        <>
          {/* SECCIÓN 1: HERO BANNER (50/50 Grid Editorial) */}
          <HeroBanner
            onExplorarClick={handleExplorarCatalogo}
            onCategoriaClick={(cat) => setCategoriaActiva(cat)}
          />

          {/* SECCIÓN 2: VALUE PROPOSITION BAR (Trust Badges 3 Columnas) */}
          <TrustBadges />

          {/* SECCIÓN 3: CATEGORY SHOWCASE (Grid 4 Columnas 3:4) */}
          <CategoryGrid
            onSelectCategory={(cat, gen) => {
              if (cat) setCategoriaActiva(cat);
              if (gen) setGeneroActivo(gen);
              handleExplorarCatalogo();
            }}
          />

          {/* SECCIÓN 4: NEW ARRIVALS (Grid 6 Columnas) */}
          <ProductSection
            title="NEW ARRIVALS"
            eyebrow="LATEST DROPS // 2026"
            subtitle="Las siluetas más recientes incorporadas a nuestra vitrina oficial."
            productos={newArrivals}
            ventasPorProducto={ventasPorProducto}
            onAgregarABolsa={agregarABolsa}
            onVerDetalle={abrirDetalleProducto}
            onVerTodos={handleExplorarCatalogo}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
          />

          {/* SECCIÓN 5: EDITORIAL FEATURE BANNER (Campaña Asimétrica) */}
          <SplitBanner onExplorarClick={handleExplorarCatalogo} />

          {/* SECCIÓN 6: BEST SELLERS (Grid 6 Columnas) */}
          <ProductSection
            title="BEST SELLERS"
            eyebrow="COMMUNITY ESSENTIALS"
            subtitle="Las prendas con mayor demanda y rotación de nuestro atelier."
            productos={bestSellers}
            ventasPorProducto={ventasPorProducto}
            onAgregarABolsa={agregarABolsa}
            onVerDetalle={abrirDetalleProducto}
            onVerTodos={handleExplorarCatalogo}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
          />

          {/* SECCIÓN 7: JOURNAL / BLOG EDITORIAL (3 Columnas) */}
          <JournalSection />

          {/* SECCIÓN 8: NEWSLETTER / LEAD CAPTURE BAR */}
          <NewsletterForm />
        </>
      ) : (
        /* VISTA DE FILTRADO Y BÚSQUEDA DEL CATÁLOGO */
        <main id="catalogo-prendas" className="max-w-[1520px] mx-auto px-4 sm:px-8 py-12 flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-400 uppercase block mb-1">
                EXPLORADOR DE COLECCIÓN
              </span>
              <h1 className="font-serif text-2xl sm:text-4xl font-light text-zinc-950 uppercase">
                {busqueda
                  ? `RESULTADOS PARA "${busqueda}"`
                  : generoActivo
                  ? `COLECCIÓN ${generoActivo}`
                  : categoriaActiva
                  ? `CATEGORÍA: ${categoriaActiva}`
                  : 'CATÁLOGO COMPLETO'}
              </h1>
              <p className="text-xs text-zinc-500 font-light mt-1">
                {productosFiltrados.length === 1
                  ? '1 prenda encontrada'
                  : `${productosFiltrados.length} prendas disponibles`}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setGeneroActivo(null);
                  setCategoriaActiva(null);
                  setBusqueda('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-black hover:text-white text-xs font-bold uppercase tracking-wider text-zinc-950 transition-colors"
              >
                <span>LIMPIAR FILTROS</span>
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 whitespace-nowrap">ORDEN:</span>
                <Select value={orden} onValueChange={(v: any) => setOrden(v)}>
                  <SelectTrigger className="w-[170px] text-xs h-9 bg-white border-zinc-300 rounded-none">
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

          {/* Grid de Productos Filtrados */}
          {productosFiltrados.length === 0 ? (
            <div className="my-20 text-center p-12 bg-zinc-50 border border-zinc-200 max-w-lg mx-auto">
              <Package className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-950 uppercase tracking-wider">No se encontraron prendas</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto font-light">
                Intenta con otra palabra clave o restablece los filtros.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setBusqueda('');
                  setCategoriaActiva(null);
                  setGeneroActivo(null);
                }}
                className="mt-5 text-xs font-bold uppercase tracking-[0.2em] rounded-none px-6 py-4"
              >
                VER TODO EL CATÁLOGO
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
              {productosFiltrados.map((prod) => (
                <ProductCardTienda
                  key={prod.id}
                  producto={prod}
                  onAgregarABolsa={agregarABolsa}
                  onVerDetalle={abrirDetalleProducto}
                  vendidosRecientes={ventasPorProducto[prod.id] ?? 0}
                  isWishlisted={wishlistIds.includes(prod.id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* VISTOS RECIENTEMENTE */}
      <RecentlyViewedTienda productos={productos} idsVistos={vistosIds} onVerDetalle={abrirDetalleProducto} />

      {/* SECCIÓN 9: FOOTER ARQUITECTÓNICO (Centrado, Enlaces & SVGs de Pago) */}
      <FooterTienda
        categorias={categorias}
        onSeleccionarCategoria={setCategoriaActiva}
        onSeleccionarGenero={setGeneroActivo}
        telefonoWhatsApp={configuracion?.telefono || '573000000000'}
      />

      {/* MODAL DE VISTA RÁPIDA / DETALLE DE PRODUCTO */}
      <ProductDetailModal
        producto={productoSeleccionado}
        abierto={Boolean(productoSeleccionado)}
        onCerrar={() => setProductoSeleccionado(null)}
        onAgregarABolsa={agregarABolsa}
      />

      {/* DRAWER DE LA BOLSA DE COMPRAS */}
      <CartDrawerTienda
        abierto={bolsaAbierta}
        onCerrar={() => setBolsaAbierta(false)}
        items={itemsBolsa}
        onActualizarCantidad={actualizarCantidadItem}
        onEliminarItem={eliminarItem}
        onVaciarBolsa={() => setItemsBolsa([])}
        telefonoWhatsAppTienda={configuracion?.telefono || '573000000000'}
      />

      {/* MODAL DE LISTA DE DESEOS (WISHLIST) */}
      {wishlistAbierto && (
        <Dialog open={wishlistAbierto} onOpenChange={setWishlistAbierto}>
          <DialogContent className="max-w-xl bg-white border border-zinc-200 text-zinc-950 p-6">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl font-light uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <span>TUS FAVORITOS ({productosWishlist.length})</span>
              </DialogTitle>
            </DialogHeader>

            {productosWishlist.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <p className="text-xs font-light">Aún no has guardado ninguna prenda en tus favoritos.</p>
                <p className="text-[11px] text-zinc-400 mt-1">Haz clic en el corazón en cualquier tarjeta para guardarla.</p>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-zinc-100 space-y-2">
                {productosWishlist.map((p) => (
                  <div key={p.id} className="pt-3 flex items-center justify-between gap-3">
                    <div
                      onClick={() => {
                        abrirDetalleProducto(p);
                        setWishlistAbierto(false);
                      }}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center font-serif font-bold text-xs">
                        {p.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">{p.nombre}</p>
                        <p className="text-xs font-black text-zinc-950">{formatoCOP(p.precioBase)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.id)}
                      className="text-zinc-400 hover:text-red-600 text-xs p-1"
                      title="Eliminar de favoritos"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* PRUEBA SOCIAL REAL EN TIEMPO REAL */}
      <RecentPurchaseToast actividad={actividadReciente} />

      {/* MODAL EXIT-INTENT PARA CUPÓN DE BIENVENIDA */}
      <ExitIntentModal totalItemsEnBolsa={totalItemsEnBolsa} resumenCarrito={resumenCarrito} />
    </div>
  );
}
