'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Bodega } from '@prisma/client';

interface BodegaContextValue {
  bodegas: Bodega[];
  bodegaActiva: Bodega | null;
  setBodegaActivaId: (id: number) => void;
}

const BodegaContext = createContext<BodegaContextValue>({
  bodegas: [],
  bodegaActiva: null,
  setBodegaActivaId: () => {},
});

const STORAGE_KEY = 'bodegaActivaId';

export function BodegaProvider({
  bodegas,
  children,
}: {
  bodegas: Bodega[];
  children: React.ReactNode;
}) {
  const [bodegaActivaId, setBodegaActivaId] = useState<number | null>(null);

  // Inicializar: localStorage → bodega principal → primera
  useEffect(() => {
    const guardada = Number(localStorage.getItem(STORAGE_KEY));
    const existe = bodegas.some((b) => b.id === guardada);
    if (existe) {
      setBodegaActivaId(guardada);
    } else {
      const principal = bodegas.find((b) => b.esPrincipal) ?? bodegas[0];
      if (principal) setBodegaActivaId(principal.id);
    }
  }, [bodegas]);

  const value = useMemo<BodegaContextValue>(() => {
    return {
      bodegas,
      bodegaActiva: bodegas.find((b) => b.id === bodegaActivaId) ?? null,
      setBodegaActivaId: (id: number) => {
        setBodegaActivaId(id);
        localStorage.setItem(STORAGE_KEY, String(id));
      },
    };
  }, [bodegas, bodegaActivaId]);

  return <BodegaContext.Provider value={value}>{children}</BodegaContext.Provider>;
}

export function useBodega() {
  return useContext(BodegaContext);
}
