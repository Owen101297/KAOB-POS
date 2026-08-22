'use client';
import DataTable from '@/components/ui/DataTable';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'producto', label: 'Producto' }, { key: 'cantidad', label: 'Cantidad' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]} pageTitle="Produccion" />;
}
