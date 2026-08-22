'use client';
import DataTable from '@/components/ui/DataTable';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'cajero', label: 'Cajero' }, { key: 'total', label: 'Total' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]} pageTitle="Cierres de Caja" />;
}
