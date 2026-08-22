import { NextResponse } from 'next/server';
import { generarPlantilla } from '@/lib/excel/plantilla';

export const dynamic = 'force-dynamic';

export async function GET() {
  const buffer = await generarPlantilla();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-inventario.xlsx"',
    },
  });
}
