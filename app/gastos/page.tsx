'use client';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'concepto', label: 'Concepto' }, { key: 'valor', label: 'Valor' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]}
      actions={<Button variant="primary">+ Nuevo</Button>} pageTitle="Gastos" />;
}
