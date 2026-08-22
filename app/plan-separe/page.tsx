'use client';
import DataTable from '@/components/ui/DataTable';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'cliente', label: 'Cliente' }, { key: 'total', label: 'Total' }, { key: 'estado', label: 'Estado' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]} pageTitle="Plan Separe" />;
}
