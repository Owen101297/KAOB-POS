'use client';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
const COLS = [{ key: 'codigo', label: 'Codigo' }, { key: 'valor', label: 'Valor' }, { key: 'estado', label: 'Estado' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]}
      actions={<Button variant="primary">+ Nuevo</Button>} pageTitle="Gift Cards" />;
}
