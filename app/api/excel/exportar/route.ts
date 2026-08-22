import { NextResponse } from 'next/server';
import { generarExportacion } from '@/lib/excel/exportar';

export const dynamic = 'force-dynamic';

export async function GET() {
  const buffer = await generarExportacion();
  const fecha = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="inventario-${fecha}.xlsx"`,
    },
  });
}
