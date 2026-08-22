'use client';
import DataTable from '@/components/ui/DataTable';
const COLS = [{ key: 'fecha', label: 'Fecha' }, { key: 'cliente', label: 'Cliente' }, { key: 'saldo', label: 'Saldo' }, { key: 'estado', label: 'Estado' }];
export default function Page() {
  return <DataTable columns={COLS} data={[]} pageTitle="Creditos" />;
}
