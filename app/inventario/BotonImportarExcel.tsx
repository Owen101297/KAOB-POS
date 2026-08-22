'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { importarExcel } from '@/lib/actions/excel';

interface VistaPrevia {
  totalFilas: number;
  errores: { fila: number; mensaje: string }[];
}

export default function BotonImportarExcel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [modo, setModo] = useState<'sumar' | 'reemplazar'>('reemplazar');
  const [vista, setVista] = useState<VistaPrevia | null>(null);
  const [resumen, setResumen] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrir() {
    setArchivo(null);
    setVista(null);
    setResumen(null);
    setError(null);
    setModo('reemplazar');
    setAbierto(true);
  }

  async function aBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.readAsDataURL(file);
    });
  }

  async function validar() {
    if (!archivo) return;
    setCargando(true);
    setError(null);
    try {
      const base64 = await aBase64(archivo);
      const res = await importarExcel({ base64, modoStock: modo, ejecutar: false });
      if (!res.ok) throw new Error(res.error);
      setVista(res.data.vistaPrevia ?? { totalFilas: 0, errores: [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al leer el archivo.');
    } finally {
      setCargando(false);
    }
  }

  async function confirmar() {
    if (!archivo) return;
    setCargando(true);
    setError(null);
    try {
      const base64 = await aBase64(archivo);
      const res = await importarExcel({ base64, modoStock: modo, ejecutar: true });
      if (!res.ok) throw new Error(res.error);
      setResumen(
        `${res.data.productosCreados} producto(s) creado(s), ${res.data.productosActualizados} actualizado(s), ${res.data.variantesCreadas} variante(s) nueva(s).`
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al importar.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={abrir}>
        <Upload className="h-4 w-4" /> Importar Excel
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar inventario desde Excel</DialogTitle>
            <DialogDescription>
              Usa la plantilla oficial. La importación nunca borra datos: crea o actualiza.
            </DialogDescription>
          </DialogHeader>

          {resumen ? (
            <div className="grid gap-3">
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Importación completada. {resumen}
              </div>
              <DialogFooter>
                <Button onClick={() => setAbierto(false)}>Cerrar</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="grid gap-3">
              <a
                href="/api/excel/plantilla"
                className="flex items-center gap-2 text-[13px] font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                <FileSpreadsheet className="h-4 w-4" /> Descargar plantilla de ejemplo
              </a>

              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  setArchivo(e.target.files?.[0] ?? null);
                  setVista(null);
                  setError(null);
                }}
                className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand-700"
              />

              <fieldset className="grid grid-cols-2 gap-2">
                <label className={`cursor-pointer rounded-lg border p-3 transition-colors ${modo === 'reemplazar' ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200'}`}>
                  <input type="radio" name="modo" checked={modo === 'reemplazar'} onChange={() => setModo('reemplazar')} className="mr-2 accent-brand-500" />
                  <span className="text-xs font-bold text-slate-700">Reemplazar stock</span>
                  <p className="mt-1 text-[11px] text-slate-400">La cantidad del archivo reemplaza la actual.</p>
                </label>
                <label className={`cursor-pointer rounded-lg border p-3 transition-colors ${modo === 'sumar' ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200'}`}>
                  <input type="radio" name="modo" checked={modo === 'sumar'} onChange={() => setModo('sumar')} className="mr-2 accent-brand-500" />
                  <span className="text-xs font-bold text-slate-700">Sumar al stock</span>
                  <p className="mt-1 text-[11px] text-slate-400">Suma las unidades del archivo a las actuales.</p>
                </label>
              </fieldset>

              {vista && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[13px]">
                  <p className="font-bold text-slate-700">{vista.totalFilas} fila(s) listas para importar.</p>
                  {vista.errores.length > 0 ? (
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      <p className="text-xs font-bold text-red-500">{vista.errores.length} error(es):</p>
                      <ul className="mt-1 space-y-0.5">
                        {vista.errores.slice(0, 30).map((err) => (
                          <li key={`${err.fila}-${err.mensaje}`} className="text-[11px] text-red-500">
                            Fila {err.fila}: {err.mensaje}
                          </li>
                        ))}
                        {vista.errores.length > 30 && (
                          <li className="text-[11px] text-slate-400">… y {vista.errores.length - 30} más</li>
                        )}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-emerald-600">Sin errores. Puedes importar.</p>
                  )}
                </div>
              )}

              {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

              <DialogFooter>
                <Button variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
                {!vista ? (
                  <Button onClick={validar} disabled={!archivo || cargando}>
                    {cargando ? 'Validando…' : 'Validar archivo'}
                  </Button>
                ) : (
                  <Button onClick={confirmar} disabled={cargando || vista.errores.length > 0 || vista.totalFilas === 0}>
                    {cargando ? 'Importando…' : `Importar ${vista.totalFilas} fila(s)`}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
