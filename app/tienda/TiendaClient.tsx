'use client';

import { useState, useMemo, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { ProductoTienda } from '@/lib/tienda/public-productos';
import NavbarTienda from '@/components/tienda/NavbarTienda';
import HeroTienda from '@/components/tienda/HeroTienda';
import MarqueeTienda from '@/components/tienda/MarqueeTienda';
import CategoryGridBento from '@/components/tienda/CategoryGridBento';
import SocialProofSection from '@/components/tienda/SocialProofSection';
import FooterTienda from '@/components/tienda/FooterTienda';
import ProductCardTienda from '@/components/tienda/ProductCardTienda';
import ProductDetailModal from '@/components/tienda/ProductDetailModal';
import FeaturedShowcase from '@/components/tienda/FeaturedShowcase';
import CartDrawerTienda, { type ItemBolsa } from '@/components/tienda/CartDrawerTienda';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface Props {
  productos: ProductoTienda[];
  categorias: { id: number; nombre: string }[];
  configuracion?: {
    nombreTienda?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
  };
  /** Pasarelas activas según el servidor (llaves en Coolify, spec 002). */
  pasarelas?: { wompi: boolean; bold: boolean };
}

export default function TiendaClient({ productos, categorias, configuracion, pasarelas }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [generoActivo, setGeneroActivo] = useState<string | null>(null);
  const [orden, setOrden] = useState<'recientes' | 'precio-asc' | 'precio-desc' | 'nombre'>('recientes');
  
  // Bolsa de compras
  const [bolsaAbierta, setBolsaAbierta] = useState(false);
  const [itemsBolsa, setItemsBolsa] = useState<ItemBolsa[]>([]);

  // Modal de Detalle
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoTienda | null>(null);

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
    if (generoActivo === 'DAMA') return 'Edición Dama';
    if (generoActivo === 'CABALLERO') return 'Edición Caballero';
    if (generoActivo === 'UNISEX') return 'Línea Unisex & Urban';
    if (generoActivo === 'ACCESORIOS') return 'Accesorios & Gorras';
    if (categoriaActiva) return `Categoría: ${categoriaActiva}`;
    return 'Catálogo Completo';
  }, [busqueda, generoActivo, categoriaActiva]);

  return (
    <div className="min-h-screen bg-bone-50 font-sans text-ink flex flex-col justify-between selection:bg-ink selection:text-bone-100">
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

      {/* FRANJA DE PROMESAS (marquee editorial) */}
      {!busqueda && <MarqueeTienda />}

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ink/10">
          <div>
            <h2 className="font-display text-2xl sm:text-4xl tracking-tight text-ink">
              {tituloSeccion}
            </h2>
            <p className="text-xs text-ink-400 mt-1.5 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${productosFiltrados.length > 0 ? 'bg-bronze' : 'bg-ink-400/40'}`} />
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bone-100 hover:bg-bone-200 border border-ink/10 text-xs font-bold text-ink-600 transition-colors"
              >
                <span>Limpiar filtros</span>
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-400 whitespace-nowrap">Ordenar:</span>
              <Select value={orden} onValueChange={(v: any) => setOrden(v)}>
                <SelectTrigger className="w-[170px] text-xs h-9 bg-bone-100 border-ink/15 text-ink">
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
          <div className="my-16 text-center border border-ink/10 rounded-3xl bg-bone-100 max-w-lg mx-auto py-14 px-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-bronze/40 bg-bone-50 mx-auto">
              <img src="/brand/isotype.svg" alt="" className="h-12 w-12 opacity-80" />
            </div>
            <h3 className="mt-6 font-display text-2xl tracking-tight text-ink">
              {busqueda ? 'Sin coincidencias' : 'Próximamente, nueva edición'}
            </h3>
            <p className="text-xs text-ink-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {busqueda
                ? `No hay resultados para "${busqueda}". Intenta con otra palabra clave.`
                : 'La confección avanza por lotes pequeños. Escríbenos por WhatsApp y te avisamos cuando esta pieza entre en vitrina.'}
            </p>
            <
              a
              href={`https://wa.me/${(configuracion?.telefono || '573000000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola! Quiero saber cuándo llega la nueva colección a la tienda KAOB.')}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-bone-50 hover:bg-ink-700 transition-colors"
            >
              Avisen por WhatsApp
              <ArrowRight className="h-4 w-4" />
            </a>
            {(busqueda || categoriaActiva || generoActivo) && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setCategoriaActiva(null);
                  setGeneroActivo(null);
                }}
                className="mt-4 mx-auto block text-xs font-semibold text-ink-400 hover:text-ink underline underline-offset-4"
              >
                Ver todo el catálogo
              </button>
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

      {/* ESCAPARATE DEL PRODUCTO DESTACADO (solo si no hay filtros activos) */}
      {!busqueda && !categoriaActiva && !generoActivo && (
        <FeaturedShowcase
          productos={productosFiltrados}
          onVerDetalle={(p) => setProductoSeleccionado(p)}
        />
      )}

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
        pasarelas={pasarelas}
      />
    </div>
  );
}
