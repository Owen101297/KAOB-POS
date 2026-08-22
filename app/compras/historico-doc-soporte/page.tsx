'use client';
import DataTable from '@/components/ui/DataTable';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'proveedor', label: 'Proveedor' }, { key: 'total', label: 'Total' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]} pageTitle="Historico de Doc. Soporte" />;
}
