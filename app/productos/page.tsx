'use client';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
const COLS = [{ key: 'nombre', label: 'Nombre' }, { key: 'referencia', label: 'Referencia' }, { key: 'precio', label: 'Precio' }, { key: 'stock', label: 'Stock' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]}
      actions={<Button variant="primary">+ Nuevo</Button>} pageTitle="Productos" />;
}
