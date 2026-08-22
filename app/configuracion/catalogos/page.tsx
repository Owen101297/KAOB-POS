import type { Metadata } from 'next';
import { obtenerCatalogos } from '@/lib/actions/catalogos';
import CatalogosClient from './CatalogosClient';

export const metadata: Metadata = { title: 'Catálogos | POS System' };

export default async function Page() {
  const catalogos = await obtenerCatalogos();
  return <CatalogosClient {...catalogos} />;
}
