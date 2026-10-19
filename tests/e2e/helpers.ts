import type { Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export type E2eState = {
  categoria?: string;
  grupoTallas?: string;
  colorNombre?: string;
  ref?: string;
  nombreProducto?: string;
  sku?: string;
  precio?: number;
  ventaCode?: string;
};

const STATE_FILE = path.join(__dirname, '.e2e-state.json');

export function leerEstado(): E2eState {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as E2eState;
  }
  return {};
}

export function guardarEstado(parcial: E2eState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...leerEstado(), ...parcial }, null, 2));
}

export function uniq(): string {
  return Date.now().toString(36).toUpperCase();
}

// Toma el ÚLTIMO monto de la cadena (los montos COP usan punto como separador de miles).
export function parseCOP(texto: string): number {
  const matches = texto.match(/\d[\d.,]*/g);
  if (!matches?.length) throw new Error(`No hay monto en: ${texto}`);
  const raw = matches[matches.length - 1];
  const val = Number(raw.replace(/[. ]/g, '').replace(/,/g, '.'));
  if (Number.isNaN(val)) throw new Error(`Monto inválido en: ${texto}`);
  return Math.round(val);
}

// Cuadrar el arqueo con la mezcla estándar de billetes colombianos + monedas.
export function repartirArqueo(total: number): number[] {
  const denom = [100000, 50000, 20000, 10000, 5000, 2000, 1000];
  let resto = total;
  const conteo: number[] = [];
  for (const d of denom) {
    const n = Math.floor(resto / d);
    conteo.push(n);
    resto -= n * d;
  }
  conteo.push(resto);
  return conteo;
}

export async function leerEsperadoCaja(page: Page): Promise<number> {
  const card = page.locator('text=Efectivo Esperado en Caja').locator('..').locator('..');
  const texto = await card.textContent();
  if (!texto) throw new Error('No se leyó el esperado en caja');
  return parseCOP(texto);
}

export async function abrirProducto(page: Page, ref: string) {
  await page.goto('/productos');
  await page.getByPlaceholder('Buscar producto, referencia o sku...').first().fill(ref).catch(() => {});
}
