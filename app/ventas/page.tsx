'use client';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'factura', label: 'Factura' }, { key: 'cliente', label: 'Cliente' }, { key: 'total', label: 'Total' }, { key: 'estado', label: 'Estado' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]}
      actions={<Button variant="primary">+ Nuevo</Button>} pageTitle="Historico de Ventas" />;
}
