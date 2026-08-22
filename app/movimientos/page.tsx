import type { Metadata } from 'next';
import { listarMovimientos } from '@/lib/actions/inventario';
import MovimientosClient from './MovimientosClient';

export const metadata: Metadata = { title: 'Movimientos | POS System' };

export default async function Page() {
  const movimientos = await listarMovimientos();
  return <MovimientosClient movimientos={movimientos} />;
}
