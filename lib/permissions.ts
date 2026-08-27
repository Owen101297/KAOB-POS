import { Rol } from '@prisma/client';

export type RolUsuario = keyof typeof Rol | string;

export interface MenuItem {
  label: string;
  icon?: any;
  href?: string;
  sub?: { label: string; href: string }[];
  roles?: RolUsuario[];
}

/**
 * Matriz de acceso por prefijo de ruta para cada rol
 */
export const RUTAS_PERMITIDAS_POR_ROL: Record<string, string[]> = {
  ADMIN: [
    '/',
    '/ventas',
    '/remisiones',
    '/cotizaciones',
    '/caja',
    '/plan-separe',
    '/ventas-online',
    '/creditos',
    '/productos',
    '/inventario',
    '/traslados',
    '/movimientos',
    '/lista-precios',
    '/produccion',
    '/auditoria',
    '/gift-cards',
    '/puntos',
    '/promociones',
    '/compras',
    '/gastos',
    '/ordenes-compra',
    '/bancos',
    '/clientes',
    '/vendedores',
    '/proveedores',
    '/domiciliarios',
    '/informes',
    '/tienda',
    '/configuracion',
    '/usuarios',
  ],
  GERENTE: [
    '/',
    '/ventas',
    '/remisiones',
    '/cotizaciones',
    '/caja',
    '/plan-separe',
    '/ventas-online',
    '/creditos',
    '/productos',
    '/inventario',
    '/traslados',
    '/movimientos',
    '/lista-precios',
    '/produccion',
    '/auditoria',
    '/gift-cards',
    '/puntos',
    '/promociones',
    '/compras',
    '/gastos',
    '/ordenes-compra',
    '/bancos',
    '/clientes',
    '/vendedores',
    '/proveedores',
    '/domiciliarios',
    '/informes',
    '/tienda',
  ],
  CAJERO: [
    '/',
    '/ventas/nueva',
    '/ventas',
    '/remisiones',
    '/cotizaciones',
    '/caja',
    '/plan-separe',
    '/ventas-online',
    '/creditos',
    '/productos',
    '/inventario',
    '/lista-precios',
    '/gift-cards',
    '/puntos',
    '/promociones',
    '/clientes',
    '/tienda',
  ],
  VENDEDOR: [
    '/',
    '/ventas/nueva',
    '/ventas',
    '/remisiones',
    '/cotizaciones',
    '/ventas-online',
    '/productos',
    '/lista-precios',
    '/gift-cards',
    '/puntos',
    '/promociones',
    '/clientes',
    '/tienda',
  ],
  BODEGUERO: [
    '/',
    '/productos',
    '/inventario',
    '/traslados',
    '/movimientos',
    '/produccion',
    '/auditoria',
    '/proveedores',
    '/tienda',
  ],
};

/**
 * Determina si un rol tiene permiso para navegar a una ruta dada
 */
export function puedeAccederRuta(rol: RolUsuario | undefined | null, pathname: string): boolean {
  if (!rol) return false;
  if (rol === 'ADMIN') return true;

  // Rutas siempre permitidas
  if (
    pathname === '/' ||
    pathname.startsWith('/tienda') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api')
  ) {
    return true;
  }

  const rutasPermitidas = RUTAS_PERMITIDAS_POR_ROL[rol] || [];
  return rutasPermitidas.some((ruta) => {
    if (ruta === '/') return pathname === '/';
    return pathname === ruta || pathname.startsWith(`${ruta}/`);
  });
}

/**
 * Ruta por defecto según el rol tras iniciar sesión o cuando no tiene acceso a una página
 */
export function obtenerRutaInicial(rol: RolUsuario | undefined | null): string {
  switch (rol) {
    case 'ADMIN':
    case 'GERENTE':
      return '/';
    case 'CAJERO':
    case 'VENDEDOR':
      return '/ventas/nueva';
    case 'BODEGUERO':
      return '/inventario';
    default:
      return '/';
  }
}
