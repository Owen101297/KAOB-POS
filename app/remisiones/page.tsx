'use client';
import DataTable from '@/components/ui/DataTable';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'numero', label: 'Numero' }, { key: 'cliente', label: 'Cliente' }, { key: 'total', label: 'Total' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]} pageTitle="Remisiones" />;
}
