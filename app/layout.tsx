import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Shell from '@/components/layout/Shell';
import Providers from '@/components/providers/Providers';
import { asegurarBodegaPrincipal } from '@/lib/actions/catalogos';
import { db } from '@/lib/db';
import type { Bodega } from '@prisma/client';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
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

import { auth } from '@/auth';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [bodegas, session] = await Promise.all([
    obtenerBodegas(),
    auth(),
  ]);

  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans">
        <Providers session={session} bodegas={bodegas}>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
