import type { Metadata } from 'next';
import { listarStock } from '@/lib/actions/inventario';
import { listarBodegas } from '@/lib/actions/catalogos';
import InventarioClient from './InventarioClient';

export const metadata: Metadata = { title: 'Stock por Bodega | POS System' };

export default async function Page() {
  const [stock, bodegas] = await Promise.all([listarStock(), listarBodegas()]);
  return <InventarioClient stock={stock} bodegas={bodegas} />;
}
