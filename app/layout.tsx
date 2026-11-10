import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Shell from '@/components/layout/Shell';
import { BodegaProvider } from '@/components/providers/BodegaProvider';
import { asegurarBodegaPrincipal } from '@/lib/actions/catalogos';
import { db } from '@/lib/db';
import type { Bodega } from '@prisma/client';

// Fuentes auto-alojadas (app/fonts, licencia OFL incluida): el build no depende
// de fonts.googleapis.com/fonts.gstatic.com, que falló de forma intermitente
// en el servidor de despliegue y tumbaba la compilación.
const inter = localFont({
  src: [{ path: './fonts/Inter-Variable.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

// Serif de exhibición para la identidad editorial de la tienda (002b).
const playfair = localFont({
  src: [
    { path: './fonts/PlayfairDisplay-Variable.woff2', weight: '400 900', style: 'normal' },
    { path: './fonts/PlayfairDisplay-Italic-Variable.woff2', weight: '400 900', style: 'italic' },
  ],
  variable: '--font-playfair',
  display: 'swap',
  fallback: ['Didot', 'Georgia', 'Times New Roman', 'serif'],
});

export const metadata: Metadata = {
  title: 'KAOB | MODERN WEAR - POS & E-Commerce',
  description: 'Sistema Punto de Venta y Tienda E-Commerce Oficial KAOB Modern Wear',
};

// Render dinámico: el HTML nunca queda cacheado con hashes de assets viejos
export const dynamic = 'force-dynamic';

async function obtenerBodegas(): Promise<Bodega[]> {
  try {
    await asegurarBodegaPrincipal();
    return await db.bodega.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: 'desc' }, { nombre: 'asc' }],
    });
  } catch {
    // La UI debe seguir cargando aunque la BD no esté disponible
    return [];
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const bodegas = await obtenerBodegas();
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">
        <BodegaProvider bodegas={bodegas}>
          <Shell>{children}</Shell>
        </BodegaProvider>
      </body>
    </html>
  );
}
