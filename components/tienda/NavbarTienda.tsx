'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Menu, X, ArrowLeft, Sparkles, User, Users, Gem } from 'lucide-react';
import { formatoCOP } from '@/lib/format';
import OfertaFlashBanner from './OfertaFlashBanner';

interface Sugerencia {
  id: number;
  nombre: string;
  referencia: string;
  precio: number;
}

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
  sugerencias?: Sugerencia[];
  onSeleccionarSugerencia?: (id: number) => void;
  promocionDestacada?: { nombre: string; tipo: string; valor: number; fechaFin: Date | string } | null;
}

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
  sugerencias = [],
  onSeleccionarSugerencia,
  promocionDestacada = null,
}: Props) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [buscadorEnfocado, setBuscadorEnfocado] = useState(false);

  const mostrarSugerencias = buscadorEnfocado && busqueda.trim().length > 0 && sugerencias.length > 0;

  const elegirSugerencia = (id: number) => {
    onSeleccionarSugerencia?.(id);
    setBuscadorEnfocado(false);
    onCambiarBusqueda('');
  };

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10 text-white transition-all">
      <OfertaFlashBanner promocion={promocionDestacada} />
      {/* Barra de anuncios / Promociones */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-white/5 py-1.5 px-4 text-center text-[10.5px] sm:text-[11px] font-semibold tracking-wider uppercase text-zinc-300 flex items-center justify-center gap-2 overflow-hidden">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
        <span>🔥 ENVÍOS A TODA COLOMBIA · PRENDAS 100% GARANTIZADAS · PIDE FÁCIL POR WHATSAPP</span>
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
            <Link
              href="/tienda"
              onClick={() => {
                onSeleccionarCategoria(null);
                onSeleccionarGenero(null);
              }}
              className="flex items-center gap-3 group"
            >
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

          {/* Menú de navegación por Colección / Sexo */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold tracking-widest uppercase">
            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero(null);
                onSeleccionarCategoria(null);
              }}
              className={`transition-colors hover:text-white pb-1 ${
                generoActivo === null && categoriaActiva === null
                  ? 'text-white border-b-2 border-white font-extrabold'
                  : 'text-zinc-400'
              }`}
            >
              Todo
            </button>

            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero('DAMA');
                onSeleccionarCategoria(null);
              }}
              className={`transition-colors hover:text-white pb-1 flex items-center gap-1 ${
                generoActivo === 'DAMA'
                  ? 'text-white border-b-2 border-rose-400 font-extrabold text-rose-300'
                  : 'text-zinc-400'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              <span>Dama</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero('CABALLERO');
                onSeleccionarCategoria(null);
              }}
              className={`transition-colors hover:text-white pb-1 flex items-center gap-1 ${
                generoActivo === 'CABALLERO'
                  ? 'text-white border-b-2 border-sky-400 font-extrabold text-sky-300'
                  : 'text-zinc-400'
              }`}
            >
              <User className="h-3.5 w-3.5 text-sky-400" />
              <span>Caballero</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero('UNISEX');
                onSeleccionarCategoria(null);
              }}
              className={`transition-colors hover:text-white pb-1 flex items-center gap-1 ${
                generoActivo === 'UNISEX'
                  ? 'text-white border-b-2 border-emerald-400 font-extrabold text-emerald-300'
                  : 'text-zinc-400'
              }`}
            >
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span>Unisex</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero('ACCESORIOS');
                onSeleccionarCategoria(null);
              }}
              className={`transition-colors hover:text-white pb-1 flex items-center gap-1 ${
                generoActivo === 'ACCESORIOS'
                  ? 'text-white border-b-2 border-amber-400 font-extrabold text-amber-300'
                  : 'text-zinc-400'
              }`}
            >
              <Gem className="h-3.5 w-3.5 text-amber-400" />
              <span>Accesorios</span>
            </button>
          </nav>

          {/* Acciones derecha: Buscador y Carrito */}
          <div className="flex items-center gap-3">
            {/* Buscador interactivo con sugerencias predictivas */}
            <div className="relative hidden sm:block w-44 md:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar prenda..."
                value={busqueda}
                onChange={(e) => onCambiarBusqueda(e.target.value)}
                onFocus={() => setBuscadorEnfocado(true)}
                onBlur={() => setTimeout(() => setBuscadorEnfocado(false), 150)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all"
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

              {mostrarSugerencias && (
                <div className="absolute top-full mt-2 left-0 w-72 rounded-2xl bg-white text-zinc-900 shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {sugerencias.slice(0, 6).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => elegirSugerencia(s.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-50 text-left border-b border-zinc-100 last:border-0"
                    >
                      <div>
                        <p className="text-xs font-bold line-clamp-1">{s.nombre}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">{s.referencia}</p>
                      </div>
                      <span className="text-xs font-black shrink-0">{formatoCOP(s.precio)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lupa móvil */}
            <button
              type="button"
              onClick={() => setMostrarBuscador(!mostrarBuscador)}
              className="sm:hidden p-2 text-zinc-400 hover:text-white"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Botón Bolsa / Carrito */}
            <button
              type="button"
              onClick={onAbrirBolsa}
              aria-label="Ver bolsa de compras"
              className="relative flex items-center justify-center p-2.5 rounded-full bg-white text-black hover:bg-zinc-200 transition-all shadow-md active:scale-95 group"
            >
              <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {totalItemsEnBolsa > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white shadow-md ring-2 ring-black animate-in zoom-in">
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
                placeholder="Buscar prenda por nombre o referencia..."
                value={busqueda}
                onChange={(e) => onCambiarBusqueda(e.target.value)}
                onFocus={() => setBuscadorEnfocado(true)}
                onBlur={() => setTimeout(() => setBuscadorEnfocado(false), 150)}
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            {mostrarSugerencias && (
              <div className="mt-2 rounded-2xl bg-white text-zinc-900 shadow-2xl border border-zinc-200 overflow-hidden">
                {sugerencias.slice(0, 6).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      elegirSugerencia(s.id);
                      setMostrarBuscador(false);
                    }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-50 text-left border-b border-zinc-100 last:border-0"
                  >
                    <div>
                      <p className="text-xs font-bold line-clamp-1">{s.nombre}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">{s.referencia}</p>
                    </div>
                    <span className="text-xs font-black shrink-0">{formatoCOP(s.precio)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Menú móvil desplegable */}
      {menuMovilAbierto && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Colecciones por Sexo</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onSeleccionarGenero(null);
                  onSeleccionarCategoria(null);
                  setMenuMovilAbierto(false);
                }}
                className={`text-left px-3 py-2 rounded-xl text-xs font-bold ${
                  generoActivo === null && categoriaActiva === null ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                Todo el Catálogo
              </button>

              <button
                type="button"
                onClick={() => {
                  onSeleccionarGenero('DAMA');
                  onSeleccionarCategoria(null);
                  setMenuMovilAbierto(false);
                }}
                className={`text-left px-3 py-2 rounded-xl text-xs font-bold ${
                  generoActivo === 'DAMA' ? 'bg-rose-500 text-white' : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                Dama 👩
              </button>

              <button
                type="button"
                onClick={() => {
                  onSeleccionarGenero('CABALLERO');
                  onSeleccionarCategoria(null);
                  setMenuMovilAbierto(false);
                }}
                className={`text-left px-3 py-2 rounded-xl text-xs font-bold ${
                  generoActivo === 'CABALLERO' ? 'bg-sky-500 text-white' : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                Caballero 👨
              </button>

              <button
                type="button"
                onClick={() => {
                  onSeleccionarGenero('UNISEX');
                  onSeleccionarCategoria(null);
                  setMenuMovilAbierto(false);
                }}
                className={`text-left px-3 py-2 rounded-xl text-xs font-bold ${
                  generoActivo === 'UNISEX' ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                Unisex ⚡
              </button>

              <button
                type="button"
                onClick={() => {
                  onSeleccionarGenero('ACCESORIOS');
                  onSeleccionarCategoria(null);
                  setMenuMovilAbierto(false);
                }}
                className={`text-left px-3 py-2 rounded-xl text-xs font-bold col-span-2 ${
                  generoActivo === 'ACCESORIOS' ? 'bg-amber-500 text-white' : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                Accesorios & Gorras 🎒
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Categorías</p>
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
                    categoriaActiva === cat.nombre ? 'bg-white text-black font-bold' : 'bg-zinc-900 text-zinc-400'
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
