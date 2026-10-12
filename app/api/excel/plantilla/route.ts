import { NextRequest, NextResponse } from 'next/server';
import { generarPlantilla } from '@/lib/excel/plantilla';
import { isBasicAuthAuthorized, isBasicAuthConfigured, isDevelopmentAuthBypassAllowed } from '@/lib/auth-basic';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isDevelopmentAuthBypassAllowed()) {
    if (!isBasicAuthConfigured()) {
      return new NextResponse('El acceso a KAOB-POS aún no está configurado.', {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    if (!isBasicAuthAuthorized(request.headers.get('authorization'))) {
      return new NextResponse('Autenticación requerida.', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="KAOB POS", charset="UTF-8"',
          'Cache-Control': 'no-store',
        },
      });
    }
  }

  const buffer = await generarPlantilla();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-inventario.xlsx"',
    },
  });
}
