'use client';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
const COLS = [{ key: 'nombre', label: 'Nombre' }, { key: 'descuento', label: 'Descuento' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]}
      actions={<Button variant="primary">+ Nuevo</Button>} pageTitle="Libro de Precios" />;
}
