import type { Metadata } from 'next';
import { listarProductos } from '@/lib/actions/productos';
import { obtenerCatalogos } from '@/lib/actions/catalogos';
import ProductosClient from './ProductosClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Productos | POS System' };

export default async function Page() {
  const [productos, catalogos] = await Promise.all([listarProductos(), obtenerCatalogos()]);
  return <ProductosClient productos={productos} catalogos={catalogos} />;
}

