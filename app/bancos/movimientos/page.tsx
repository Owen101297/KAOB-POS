'use client';
import DataTable from '@/components/ui/DataTable';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'banco', label: 'Banco' }, { key: 'tipo', label: 'Tipo' }, { key: 'valor', label: 'Valor' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]} pageTitle="Movimientos Bancarios" />;
}
