'use client';
import DataTable from '@/components/ui/DataTable';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'usuario', label: 'Usuario' }, { key: 'accion', label: 'Accion' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]} pageTitle="Auditoria de Inventario" />;
}
