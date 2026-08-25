'use client';

import { useState, useMemo, useEffect } from 'react';
import { Sparkles, SlidersHorizontal, Package, RefreshCw, Phone, MapPin } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import NavbarTienda from '@/components/tienda/NavbarTienda';
import HeroTienda from '@/components/tienda/HeroTienda';
import ProductCardTienda from '@/components/tienda/ProductCardTienda';
import ProductDetailModal from '@/components/tienda/ProductDetailModal';
import CartDrawerTienda, { type ItemBolsa } from '@/components/tienda/CartDrawerTienda';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface Props {
  productos: ProductoLista[];
  categorias: { id: number; nombre: string }[];
  configuracion?: {
    nombreTienda?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
  };
}

export default function TiendaClient({ productos, categorias, configuracion }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [orden, setOrden] = useState<'recientes' | 'precio-asc' | 'precio-desc' | 'nombre'>('recientes');
  
  // Bolsa de compras
  const [bolsaAbierta, setBolsaAbierta] = useState(false);
  const [itemsBolsa, setItemsBolsa] = useState<ItemBolsa[]>([]);

  // Modal de Detalle
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoLista | null>(null);

  // Cargar carrito guardado en localStorage
  useEffect(() => {
    try {
      const guardado = localStorage.getItem('kaob_cart_items');
      if (guardado) {
        setItemsBolsa(JSON.parse(guardado));
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

  // Filtrado y Ordenamiento
  const productosFiltrados = useMemo(() => {
    let list = productos.filter((p) => p.activo);

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
  }, [productos, categoriaActiva, busqueda, orden]);

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

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col justify-between">
      {/* NAVBAR */}
      <NavbarTienda
        totalItemsEnBolsa={totalItemsEnBolsa}
        onAbrirBolsa={() => setBolsaAbierta(true)}
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        categoriaActiva={categoriaActiva}
        onSeleccionarCategoria={setCategoriaActiva}
        categorias={categorias}
      />

      {/* HERO BANNER */}
      {!busqueda && (
        <HeroTienda
          onExplorar={() => {
            const el = document.getElementById('catalogo-prendas');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          categorias={categorias}
          categoriaSeleccionada={categoriaActiva}
          onSeleccionarCategoria={setCategoriaActiva}
        />
      )}

      {/* CATÁLOGO DE PRODUCTOS */}
      <main id="catalogo-prendas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Cabecera del Catálogo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900">
                {categoriaActiva ? `Colección: ${categoriaActiva}` : 'Catálogo Completo'}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {productosFiltrados.length === 1
                ? '1 prenda disponible en vitrina'
                : `${productosFiltrados.length} prendas disponibles en vitrina`}
            </p>
          </div>

          {/* Ordenar */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 whitespace-nowrap">Ordenar por:</span>
            <Select value={orden} onValueChange={(v: any) => setOrden(v)}>
              <SelectTrigger className="w-[180px] text-xs h-9 bg-white">
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

        {/* Rejilla de Productos */}
        {productosFiltrados.length === 0 ? (
          <div className="my-16 text-center p-8 bg-white rounded-3xl border border-zinc-200 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-zinc-900">No se encontraron prendas</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {busqueda
                ? `No hay resultados para "${busqueda}". Intenta con otra palabra clave.`
                : 'No hay productos disponibles en esta categoría actualmente.'}
            </p>
            {(busqueda || categoriaActiva) && (
              <Button
                variant="outline"
                onClick={() => {
                  setBusqueda('');
                  setCategoriaActiva(null);
                }}
                className="mt-4 text-xs font-bold uppercase tracking-wider rounded-full"
              >
                Limpiar filtros
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
                onVerDetalle={(p) => setProductoSeleccionado(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* FOOTER OFICIAL KAOB */}
      <footer className="bg-black text-white border-t border-zinc-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Columna Marca */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <img src="/brand/isotype.svg" alt="KAOB" className="h-9 w-9 rounded-full" />
                <span className="font-extrabold text-lg tracking-[0.25em] uppercase">KΛOB</span>
              </div>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                Moda contemporánea, cortes premium y telas seleccionadas para el estilo diario. Catálogo integrado con inventario en tiempo real.
              </p>
              <p className="text-[11px] text-zinc-500">
                © {new Date().getFullYear()} KAOB MODERN WEAR. Todos los derechos reservados.
              </p>
            </div>

            {/* Categorías */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">Colecciones</p>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                {categorias.slice(0, 5).map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoriaActiva(cat.nombre);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-white transition-colors"
                    >
                      {cat.nombre}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contacto & Pedidos */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">Atención al Cliente</p>
              <div className="space-y-2 text-xs text-zinc-400">
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-brand-400" />
                  <span>Pedidos por WhatsApp</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-sky-400" />
                  <span>Envíos a todo el país</span>
                </p>
                <p className="text-[11px] text-zinc-500 pt-2">
                  Sistema POS & Tienda Oficial
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALES */}
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
    </div>
  );
}
