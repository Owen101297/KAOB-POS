import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Shell from '@/components/layout/Shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'POS System',
  description: 'Sistema Punto de Venta',
};

// Render dinámico: el HTML nunca queda cacheado con hashes de assets viejos
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
