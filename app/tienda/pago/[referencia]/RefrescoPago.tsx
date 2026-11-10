'use client';

import { useEffect } from 'react';

// Estado pendiente/en proceso: recarga la página cada 10 s hasta que el
// webhook o la consulta confirmen el pago definitivo.
export default function RefrescoPago({ intervaloMs = 10000 }: { intervaloMs?: number }) {
  useEffect(() => {
    const t = setTimeout(() => window.location.reload(), intervaloMs);
    return () => clearTimeout(t);
  }, [intervaloMs]);
  return null;
}
