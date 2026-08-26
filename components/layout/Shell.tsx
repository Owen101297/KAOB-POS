'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Si está en el portal público de la tienda, renderizar pantalla completa limpia
  if (pathname?.startsWith('/tienda')) {
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
