'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Menu, X, ArrowLeft, Store, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  totalItemsEnBolsa: number;
  onAbrirBolsa: () => void;
  busqueda: string;
  onCambiarBusqueda: (val: string) => void;
  categoriaActiva: string | null;
  onSeleccionarCategoria: (cat: string | null) => void;
  categorias: { id: number; nombre: string }[];
}

export default function NavbarTienda({
  totalItemsEnBolsa,
  onAbrirBolsa,
  busqueda,
  onCambiarBusqueda,
  categoriaActiva,
  onSeleccionarCategoria,
  categorias,
}: Props) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10 text-white transition-all">
      {/* Banner promocional superior */}
      <div className="bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border-b border-white/5 py-1.5 px-4 text-center text-[11px] font-medium tracking-wider uppercase text-zinc-400">
        <span>Envíos a todo el país · Compra rápida y segura</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Botón menú móvil */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Abrir menú"
            >
              {menuMovilAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Logotipo KAOB MODERN WEAR */}
          <div className="flex items-center gap-3">
            <Link href="/tienda" className="flex items-center gap-3 group">
              <div className="h-11 w-11 rounded-full bg-white p-0.5 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                <img src="/brand/isotype.svg" alt="KAOB" className="h-10 w-10 rounded-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl tracking-[0.25em] text-white font-sans uppercase">
                  KΛOB
                </span>
                <span className="text-[9px] font-semibold tracking-[0.35em] text-zinc-400 uppercase -mt-0.5">
                  MODERN WEAR
                </span>
              </div>
            </Link>
          </div>

          {/* Menú de categorías escritorio */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-wider uppercase">
            <button
              type="button"
              onClick={() => onSeleccionarCategoria(null)}
              className={`transition-colors hover:text-white ${
                categoriaActiva === null ? 'text-white border-b-2 border-white pb-1 font-bold' : 'text-zinc-400'
              }`}
            >
              Todo el Catálogo
            </button>
            {categorias.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSeleccionarCategoria(cat.nombre)}
                className={`transition-colors hover:text-white ${
                  categoriaActiva === cat.nombre
                    ? 'text-white border-b-2 border-white pb-1 font-bold'
                    : 'text-zinc-400'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </nav>

          {/* Acciones derecha: Buscador, POS link, Carrito */}
          <div className="flex items-center gap-3">
            {/* Buscador interactivo */}
            <div className="relative hidden sm:block w-48 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar prenda, referencia..."
                value={busqueda}
                onChange={(e) => onCambiarBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => onCambiarBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Botón lupa móvil */}
            <button
              type="button"
              onClick={() => setMostrarBuscador(!mostrarBuscador)}
              className="sm:hidden p-2 text-zinc-400 hover:text-white"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Acceso al POS */}
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
              title="Ir al panel del POS"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Admin POS</span>
            </Link>

            {/* Botón Bolsa / Carrito */}
            <button
              type="button"
              onClick={onAbrirBolsa}
              aria-label="Ver bolsa de compras"
              className="relative flex items-center justify-center p-2.5 rounded-full bg-white text-black hover:bg-zinc-200 transition-all shadow-md active:scale-95"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItemsEnBolsa > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-black">
                  {totalItemsEnBolsa}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Buscador expandible en móvil */}
        {mostrarBuscador && (
          <div className="sm:hidden pb-3 animate-in fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar prenda o referencia..."
                value={busqueda}
                onChange={(e) => onCambiarBusqueda(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Drawer menú móvil */}
      {menuMovilAbierto && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Categorías</p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                onSeleccionarCategoria(null);
                setMenuMovilAbierto(false);
              }}
              className={`text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                categoriaActiva === null ? 'bg-white text-black' : 'text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              Todo el Catálogo
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSeleccionarCategoria(cat.nombre);
                  setMenuMovilAbierto(false);
                }}
                className={`text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                  categoriaActiva === cat.nombre ? 'bg-white text-black' : 'text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setMenuMovilAbierto(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
            >
              <ArrowLeft className="h-4 w-4" /> Volver al Sistema POS
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
