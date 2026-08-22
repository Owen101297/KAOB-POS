'use client';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'proveedor', label: 'Proveedor' }, { key: 'total', label: 'Total' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]}
      actions={<Button variant="primary">+ Nuevo</Button>} pageTitle="Documento Soporte" />;
}
