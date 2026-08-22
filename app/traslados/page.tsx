import type { Metadata } from 'next';
import { listarTraslados, listarStock } from '@/lib/actions/inventario';
import { listarBodegas } from '@/lib/actions/catalogos';
import TrasladosClient from './TrasladosClient';

export const metadata: Metadata = { title: 'Traslados | POS System' };

export default async function Page() {
  const [traslados, stock, bodegas] = await Promise.all([
    listarTraslados(),
    listarStock(),
    listarBodegas(true),
  ]);
  return <TrasladosClient traslados={traslados} stock={stock} bodegas={bodegas} />;
}
