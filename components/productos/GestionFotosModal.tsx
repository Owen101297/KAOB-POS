'use client';

import { useMemo, useRef, useState } from 'react';
import { Upload, X, Star, ChevronLeft, ChevronRight, Loader2, ImageOff } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import {
  eliminarImagenProducto,
  marcarImagenPrincipal,
  reordenarImagenesProducto,
  asignarColorImagen,
} from '@/lib/actions/productos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

interface Props {
  producto: ProductoLista | null;
  onClose: () => void;
  onCambio: () => void;
}

const TIPOS_ACEPTADOS = 'image/jpeg,image/png,image/webp,image/gif';

export default function GestionFotosModal({ producto, onClose, onCambio }: Props) {
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const coloresDisponibles = useMemo(() => {
    if (!producto) return [];
    const map = new Map<number, { id: number; nombre: string; hex: string | null }>();
    producto.variantes.forEach((v) => {
      if (!map.has(v.color.id)) map.set(v.color.id, v.color);
    });
    return Array.from(map.values());
  }, [producto]);

  if (!producto) return null;
  const imagenes = producto.imagenes;

  const subirArchivos = async (files: FileList | File[]) => {
    setError(null);
    setSubiendo(true);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      form.append('productoId', String(producto.id));
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (!data.ok) setError(data.error || 'No se pudo subir una de las imágenes.');
      } catch {
        setError('Error de red al subir la imagen.');
      }
    }
    setSubiendo(false);
    onCambio();
    if (inputRef.current) inputRef.current.value = '';
  };

  const mover = async (indice: number, delta: number) => {
    const destino = indice + delta;
    if (destino < 0 || destino >= imagenes.length) return;
    const copia = [...imagenes];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    await reordenarImagenesProducto(producto.id, copia.map((im) => im.id));
    onCambio();
  };

  const handlePrincipal = async (id: number) => {
    await marcarImagenPrincipal(id);
    onCambio();
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta foto? No se puede deshacer.')) return;
    await eliminarImagenProducto(id);
    onCambio();
  };

  const handleColor = async (id: number, colorId: number | null) => {
    await asignarColorImagen(id, colorId);
    onCambio();
  };

  return (
    <Dialog open={Boolean(producto)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Fotos · {producto.referencia}</DialogTitle>
          <DialogDescription>
            {producto.nombre}. Arrastra o selecciona imágenes (JPG, PNG, WEBP o GIF, máx. 8MB). La primera foto o la
            que marques con la estrella será la portada en la tienda.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            if (e.dataTransfer.files.length) subirArchivos(e.dataTransfer.files);
          }}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
            arrastrando ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={TIPOS_ACEPTADOS}
            multiple
            hidden
            onChange={(e) => e.target.files && subirArchivos(e.target.files)}
          />
          {subiendo ? (
            <div className="flex flex-col items-center gap-2 text-slate-500 text-xs font-semibold py-2">
              <Loader2 className="h-6 w-6 animate-spin" /> Subiendo...
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 text-slate-500 hover:text-slate-700 py-2"
            >
              <Upload className="h-6 w-6" />
              <span className="text-xs font-semibold">Arrastra fotos aquí o haz clic para seleccionar</span>
            </button>
          )}
        </div>

        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

        {imagenes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
            <ImageOff className="h-6 w-6" />
            <p className="text-xs">Aún no hay fotos para este producto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {imagenes.map((img, idx) => (
              <div key={img.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={`/api/media/${img.key}`}
                  alt={img.alt ?? producto.nombre}
                  className="aspect-square w-full object-cover"
                />
                {img.esPrincipal && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black text-white text-[9px] font-bold uppercase tracking-wide">
                    Portada
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/70 p-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    title="Mover a la izquierda"
                    disabled={idx === 0}
                    onClick={() => mover(idx, -1)}
                    className="text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" title="Marcar como portada" onClick={() => handlePrincipal(img.id)} className="text-white">
                    <Star className={`h-3.5 w-3.5 ${img.esPrincipal ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                  <button type="button" title="Eliminar foto" onClick={() => handleEliminar(img.id)} className="text-white hover:text-red-400">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Mover a la derecha"
                    disabled={idx === imagenes.length - 1}
                    onClick={() => mover(idx, 1)}
                    className="text-white disabled:opacity-30"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {coloresDisponibles.length > 0 && (
                  <div className="border-t border-slate-100 bg-white p-1.5">
                    <select
                      value={img.colorId ?? ''}
                      onChange={(e) => handleColor(img.id, e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded border border-slate-200 px-1 py-0.5 text-[10px] text-slate-600"
                    >
                      <option value="">Todos los colores</option>
                      {coloresDisponibles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
