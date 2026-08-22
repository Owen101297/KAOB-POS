import type { Metadata } from 'next';
import { listarProductos } from '@/lib/actions/productos';
import ListaPreciosClient from './ListaPreciosClient';

export const metadata: Metadata = { title: 'Libro de Precios | POS System' };

export default async function Page() {
  const productos = await listarProductos(true);
  return <ListaPreciosClient productos={productos} />;
}
