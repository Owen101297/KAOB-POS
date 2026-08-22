'use client';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
const COLS = [{ key: 'nombre', label: 'Nombre' }, { key: 'saldo', label: 'Saldo' }, { key: 'tipo', label: 'Tipo' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]}
      actions={<Button variant="primary">+ Nuevo</Button>} pageTitle="Bancos" />;
}
