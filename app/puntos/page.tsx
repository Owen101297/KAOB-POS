'use client';
import DataTable from '@/components/ui/DataTable';
const COLS = [{ key: 'cliente', label: 'Cliente' }, { key: 'puntos', label: 'Puntos' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]} pageTitle="Puntos de Fidelizacion" />;
}
