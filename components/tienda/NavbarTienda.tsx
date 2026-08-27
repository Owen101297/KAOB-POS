'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Menu, X, Heart, ChevronDown, Sparkles, User, Users, Gem } from 'lucide-react';
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
  totalWishlist?: number;
  onAbrirWishlist?: () => void;
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
  totalWishlist = 0,
  onAbrirWishlist,
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
  const [dropdownCategoriasAbierto, setDropdownCategoriasAbierto] = useState(false);

  const mostrarSugerencias = buscadorEnfocado && busqueda.trim().length > 0 && sugerencias.length > 0;

  const elegirSugerencia = (id: number) => {
    onSeleccionarSugerencia?.(id);
    setBuscadorEnfocado(false);
    onCambiarBusqueda('');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#09090B] border-b border-zinc-800 text-white transition-all">
      <OfertaFlashBanner promocion={promocionDestacada} />
      
      {/* Barra de anuncios Superior */}
      <div className="bg-zinc-950 border-b border-zinc-800/60 py-2 px-4 text-center text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-300 flex items-center justify-center gap-3 overflow-hidden">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
        <span>ENVÍOS A TODA COLOMBIA • PAGOS SEGUROS CON ADDI, SISTECRÉDITO & PLAN SEPARE • 100% HEAVYWEIGHT COTTON</span>
      </div>

      <div className="max-w-[1520px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Botón Menú Móvil */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Abrir menú"
            >
              {menuMovilAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Logotipo KAOB */}
          <div className="flex items-center gap-3">
            <Link
              href="/tienda"
              onClick={() => {
                onSeleccionarCategoria(null);
                onSeleccionarGenero(null);
              }}
              className="flex items-center gap-3 group"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center shadow-md transition-transform group-hover:scale-105 border border-zinc-800 bg-black shrink-0">
                <img src="/brand/isotype.jpeg" alt="KAOB" className="h-full w-full object-cover" />
              </div>
              <span className="font-extrabold text-xl sm:text-2xl tracking-[0.25em] text-white uppercase font-sans">
                KΛOB
              </span>
            </Link>
          </div>

          {/* Menú de Navegación por Departamento y Categorías Reales */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold tracking-[0.2em] uppercase">
            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero(null);
                onSeleccionarCategoria(null);
              }}
              className={`transition-colors hover:text-white pb-1 ${
                generoActivo === null && categoriaActiva === null
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-400'
              }`}
            >
              TODO EL DROP
            </button>

            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero('CABALLERO');
              }}
              className={`transition-colors hover:text-white pb-1 ${
                generoActivo === 'CABALLERO'
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-400'
              }`}
            >
              MEN
            </button>

            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero('DAMA');
              }}
              className={`transition-colors hover:text-white pb-1 ${
                generoActivo === 'DAMA'
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-400'
              }`}
            >
              WOMEN
            </button>

            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero('UNISEX');
              }}
              className={`transition-colors hover:text-white pb-1 ${
                generoActivo === 'UNISEX'
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-400'
              }`}
            >
              OVERSIZE
            </button>

            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero('ACCESORIOS');
              }}
              className={`transition-colors hover:text-white pb-1 ${
                generoActivo === 'ACCESORIOS'
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-400'
              }`}
            >
              ACCESSORIES
            </button>

            {/* Dropdown Dinámico de Categorías Reales de Inventario */}
            {categorias.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownCategoriasAbierto(!dropdownCategoriasAbierto)}
                  onBlur={() => setTimeout(() => setDropdownCategoriasAbierto(false), 200)}
                  className={`flex items-center gap-1 transition-colors hover:text-white pb-1 ${
                    categoriaActiva ? 'text-white font-bold border-b-2 border-white' : 'text-zinc-400'
                  }`}
                >
                  <span>{categoriaActiva ? `CAT: ${categoriaActiva}` : 'CATEGORÍAS'}</span>
                  <ChevronDown className="w-3 h-3 transition-transform duration-200" />
                </button>

                {dropdownCategoriasAbierto && (
                  <div className="absolute top-full mt-3 left-0 w-64 bg-[#0F0F12] border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="p-2 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
                      Categorías en Inventario:
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      <button
                        type="button"
                        onClick={() => {
                          onSeleccionarCategoria(null);
                          setDropdownCategoriasAbierto(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
                          categoriaActiva === null ? 'bg-white text-black font-bold' : 'text-zinc-300 hover:bg-zinc-900'
                        }`}
                      >
                        Todas las Categorías
                      </button>
                      {categorias.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            onSeleccionarCategoria(cat.nombre);
                            setDropdownCategoriasAbierto(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
                            categoriaActiva === cat.nombre ? 'bg-white text-black font-bold' : 'text-zinc-300 hover:bg-zinc-900'
                          }`}
                        >
                          {cat.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Acciones Derecha: Buscador, Wishlist y Carrito */}
          <div className="flex items-center gap-3.5">
            {/* Buscador interactivo */}
            <div className="relative hidden sm:block w-44 md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="BUSCAR..."
                value={busqueda}
                onChange={(e) => onCambiarBusqueda(e.target.value)}
                onFocus={() => setBuscadorEnfocado(true)}
                onBlur={() => setTimeout(() => setBuscadorEnfocado(false), 150)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-white uppercase tracking-wider transition-all"
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
                <div className="absolute top-full mt-2 left-0 w-72 bg-white text-zinc-900 shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in duration-150 z-50">
                  {sugerencias.slice(0, 6).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => elegirSugerencia(s.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-100 text-left border-b border-zinc-100 last:border-0"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider line-clamp-1">{s.nombre}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">{s.referencia}</p>
                      </div>
                      <span className="text-xs font-black shrink-0">{formatoCOP(s.precio)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lupa en móvil */}
            <button
              type="button"
              onClick={() => setMostrarBuscador(!mostrarBuscador)}
              className="sm:hidden p-2 text-zinc-400 hover:text-white"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Botón Favoritos (Wishlist) */}
            {onAbrirWishlist && (
              <button
                type="button"
                onClick={onAbrirWishlist}
                className="relative p-2 text-zinc-300 hover:text-white transition-colors"
                title="Ver lista de deseos"
              >
                <Heart className="h-5 w-5" />
                {totalWishlist > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center bg-red-600 px-1 text-[9px] font-black text-white rounded-full">
                    {totalWishlist}
                  </span>
                )}
              </button>
            )}

            {/* Botón Bolsa / Carrito */}
            <button
              type="button"
              onClick={onAbrirBolsa}
              aria-label="Ver bolsa de compras"
              className="relative flex items-center justify-center px-4 py-2 bg-white text-black hover:bg-zinc-200 transition-all font-bold text-xs tracking-widest uppercase active:scale-95 group"
            >
              <ShoppingBag className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">BOLSA</span>
              {totalItemsEnBolsa > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-black text-white text-[10px] font-black">
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
                placeholder="BUSCAR PRENDA..."
                value={busqueda}
                onChange={(e) => onCambiarBusqueda(e.target.value)}
                onFocus={() => setBuscadorEnfocado(true)}
                onBlur={() => setTimeout(() => setBuscadorEnfocado(false), 150)}
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-white uppercase"
              />
            </div>

            {mostrarSugerencias && (
              <div className="mt-2 bg-white text-zinc-900 shadow-2xl border border-zinc-200 overflow-hidden">
                {sugerencias.slice(0, 6).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      elegirSugerencia(s.id);
                      setMostrarBuscador(false);
                    }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-100 text-left border-b border-zinc-100 last:border-0"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider line-clamp-1">{s.nombre}</p>
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

      {/* Menú Móvil Desplegable */}
      {menuMovilAbierto && (
        <div className="lg:hidden border-t border-zinc-800 bg-[#09090B] px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Departamentos</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSeleccionarGenero(null);
                  onSeleccionarCategoria(null);
                  setMenuMovilAbierto(false);
                }}
                className={`text-left px-3 py-2 text-xs font-bold uppercase ${
                  generoActivo === null && categoriaActiva === null ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                TODO EL DROP
              </button>

              <button
                type="button"
                onClick={() => {
                  onSeleccionarGenero('CABALLERO');
                  setMenuMovilAbierto(false);
                }}
                className={`text-left px-3 py-2 text-xs font-bold uppercase ${
                  generoActivo === 'CABALLERO' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                MEN
              </button>

              <button
                type="button"
                onClick={() => {
                  onSeleccionarGenero('DAMA');
                  setMenuMovilAbierto(false);
                }}
                className={`text-left px-3 py-2 text-xs font-bold uppercase ${
                  generoActivo === 'DAMA' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                WOMEN
              </button>

              <button
                type="button"
                onClick={() => {
                  onSeleccionarGenero('UNISEX');
                  setMenuMovilAbierto(false);
                }}
                className={`text-left px-3 py-2 text-xs font-bold uppercase ${
                  generoActivo === 'UNISEX' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                OVERSIZE
              </button>
            </div>
          </div>

          {categorias.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Categorías de Inventario</p>
              <div className="flex flex-wrap gap-1">
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSeleccionarCategoria(cat.nombre);
                      setMenuMovilAbierto(false);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider ${
                      categoriaActiva === cat.nombre ? 'bg-white text-black font-bold' : 'bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
