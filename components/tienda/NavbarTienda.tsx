'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';

interface Props {
  totalItemsEnBolsa: number;
  onAbrirBolsa: () => void;
  busqueda: string;
  onCambiarBusqueda: (val: string) => void;
  categoriaActiva: string | null;
  onSeleccionarCategoria: (cat: string | null) => void;
  generoActivo: string | null;
  onSeleccionarGenero: (gen: string | null) => void;
  categorias: { id: number; nombre: string }[];
}

const ITEMS = [
  { key: 'ALL', label: 'Todo' },
  { key: 'DAMA', label: 'Dama' },
  { key: 'CABALLERO', label: 'Caballero' },
  { key: 'UNISEX', label: 'Unisex' },
  { key: 'ACCESORIOS', label: 'Accesorios' },
] as const;

/**
 * Navbar editorial (002b): papel hueso translúcido con blur, isotipo y
 * logotipo `currentColor` (transparente, sin aplanar), indicador activo con
 * morfología suave (layoutId) y elevación al hacer scroll. Conserva el
 * contrato de props y los textos que usa la suite E2E ('Todo', 'Ver bolsa
 * de compras').
 */
export default function NavbarTienda({
  totalItemsEnBolsa,
  onAbrirBolsa,
  busqueda,
  onCambiarBusqueda,
  categoriaActiva,
  onSeleccionarCategoria,
  generoActivo,
  onSeleccionarGenero,
  categorias,
}: Props) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activo = (key: string) =>
    (key === 'ALL' && generoActivo === null && !categoriaActiva) || generoActivo === key;

  const handle = (key: string) => {
    if (key === 'ALL') {
      onSeleccionarGenero(null);
      onSeleccionarCategoria(null);
    } else {
      onSeleccionarGenero(key);
      onSeleccionarCategoria(null);
    }
    setMenuMovilAbierto(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 text-ink transition-all duration-300 ${
        scrolled
          ? 'bg-bone-50/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(28,23,18,0.08),0_10px_30px_-18px_rgba(28,23,18,0.25)]'
          : 'bg-bone-50 border-b border-ink/5'
      }`}
    >
      {/* Cinta de anuncio */}
      <div className="bg-ink border-b border-ink-900 py-1.5 px-4 text-center text-[10.5px] sm:text-[11px] font-semibold tracking-[0.18em] uppercase text-bone-200 flex items-center justify-center gap-2 overflow-hidden">
        <span className="h-1.5 w-1.5 rounded-full bg-bronze animate-pulse shrink-0" />
        <span>Lote pequeño · Gran detalle · Despachos a toda Colombia</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>
          {/* Menú móvil */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              className="p-2 rounded-lg text-ink-500 hover:text-ink hover:bg-bone-200/60 transition-colors"
              aria-label="Abrir menú"
            >
              {menuMovilAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Logotipo transparente (currentColor) */}
          <Link
            href="/tienda"
            onClick={() => {
              onSeleccionarCategoria(null);
              onSeleccionarGenero(null);
            }}
            className="flex items-center gap-3 group shrink-0"
          >
            <img
              src="/brand/isotype.svg"
              alt="KAOB"
              className={`rounded-full object-contain transition-transform duration-300 group-hover:scale-[1.04] ${scrolled ? 'h-9 w-9' : 'h-11 w-11'}`}
            />
            <div className="flex flex-col">
              <img
                src="/brand/logo.svg"
                alt="KAOB"
                className={`text-ink transition-all ${scrolled ? 'h-3.5' : 'h-[16px]'}`}
              />
              <span className="text-[9px] font-semibold tracking-[0.42em] text-ink-400 uppercase mt-0.5">
                Modern Wear
              </span>
            </div>
          </Link>

          {/* Isla de colecciones */}
          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-ink/10 bg-bone-100/70 px-2 py-1.5 backdrop-blur">
            {ITEMS.map((it) => {
              const esActivo = activo(it.key);
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => handle(it.key)}
                  className={`relative px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    esActivo ? 'text-bone-50' : 'text-ink-500 hover:text-ink'
                  }`}
                >
                  {esActivo && (
                    <motion.span
                      layoutId="nav-isla-act"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-ink"
                    />
                  )}
                  <span className="relative z-10">{it.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Acciones derecha */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden sm:block w-44 md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Buscar prenda…"
                value={busqueda}
                onChange={(e) => onCambiarBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-bone-100 border border-ink/10 rounded-full text-ink placeholder-ink-400 focus:outline-none focus:border-bronze focus:ring-1 focus:ring-bronze/40 transition-all"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => onCambiarBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMostrarBuscador(!mostrarBuscador)}
              className="sm:hidden p-2 text-ink-500 hover:text-ink"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onAbrirBolsa}
              aria-label="Ver bolsa de compras"
              className="relative flex items-center justify-center p-2.5 rounded-full bg-ink text-bone-50 hover:bg-ink-700 transition-all shadow-md active:scale-95 group"
            >
              <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {totalItemsEnBolsa > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-bronze px-1 text-[10px] font-black text-ink-900 shadow-md ring-2 ring-bone-50">
                  {totalItemsEnBolsa}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Buscador móvil */}
        {mostrarBuscador && (
          <div className="sm:hidden pb-3 animate-in fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Buscar prenda por nombre o referencia…"
                value={busqueda}
                onChange={(e) => onCambiarBusqueda(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-xs bg-bone-100 border border-ink/10 rounded-full text-ink placeholder-ink-400 focus:outline-none focus:border-bronze"
              />
            </div>
          </div>
        )}
      </div>

      {/* Menú móvil desplegable */}
      {menuMovilAbierto && (
        <div className="lg:hidden border-t border-ink/10 bg-bone-50 px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-400 mb-2">
              Colecciones
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {ITEMS.filter((i) => i.key !== 'ALL').map((it) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => handle(it.key)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-bold ${
                    activo(it.key) ? 'bg-ink text-bone-50' : 'bg-bone-100 text-ink-600'
                  }`}
                >
                  {it.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handle('ALL')}
                className={`text-left px-3 py-2 rounded-xl text-xs font-bold col-span-2 ${
                  activo('ALL') ? 'bg-ink text-bone-50' : 'bg-bone-100 text-ink-600'
                }`}
              >
                Todo el Catálogo
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-400 mb-2">
              Categorías
            </p>
            <div className="flex flex-wrap gap-1">
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSeleccionarCategoria(cat.nombre);
                    setMenuMovilAbierto(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                    categoriaActiva === cat.nombre ? 'bg-ink text-bone-50 font-bold' : 'bg-bone-100 text-ink-500'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
