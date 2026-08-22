'use client';
import DataTable from '@/components/ui/DataTable';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'tipo', label: 'Tipo' }, { key: 'producto', label: 'Producto' }, { key: 'cantidad', label: 'Cantidad' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]} pageTitle="Movimientos de Inventario" />;
}
