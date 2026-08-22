const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatoCOP(valor: number | null | undefined): string {
  return copFormatter.format(valor ?? 0);
}

export function formatoNumero(valor: number | null | undefined): string {
  return new Intl.NumberFormat("es-CO").format(valor ?? 0);
}

export function formatoFecha(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatoFechaHora(fecha: Date | string): string {
  return new Date(fecha).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Convierte texto "12.500" o "12500" o "$12.500" a entero COP */
export function parseCOP(texto: string): number {
  if (!texto) return 0;
  return Number.parseInt(texto.replace(/[^\d]/g, ""), 10) || 0;
}
