'use client';
import DataTable from '@/components/ui/DataTable';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'pedido', label: 'Pedido' }, { key: 'cliente', label: 'Cliente' }, { key: 'total', label: 'Total' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]} pageTitle="Ventas Online" />;
}
