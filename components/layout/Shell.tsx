'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Si está en el portal público de la tienda o en rutas de autenticación, renderizar pantalla completa limpia
  const isAuthOrPublic =
    pathname?.startsWith('/tienda') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register');

  if (isAuthOrPublic) {
    return <>{children}</>;
  }

  return (
    <>
      <Topbar onMenuClick={() => setMobileOpen(true)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="page-content">{children}</main>
    </>
  );
}
