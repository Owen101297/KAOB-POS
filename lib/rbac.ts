import { Rol } from "@prisma/client";

// Permisos por rol: cada clave es un módulo, cada valor son las acciones permitidas
const PERMISOS: Record<string, Rol[]> = {
  // Solo ADMIN
  "usuarios:ver": [Rol.ADMIN],
  "usuarios:crear": [Rol.ADMIN],
  "usuarios:editar": [Rol.ADMIN],
  "usuarios:eliminar": [Rol.ADMIN],
  "configuracion:editar": [Rol.ADMIN],

  // ADMIN + GERENTE
  "reportes:ver": [Rol.ADMIN, Rol.GERENTE],
  "reportes:exportar": [Rol.ADMIN, Rol.GERENTE],
  "configuracion:ver": [Rol.ADMIN, Rol.GERENTE],

  // ADMIN + GERENTE + BODEGUERO
  "inventario:ver": [Rol.ADMIN, Rol.GERENTE, Rol.BODEGUERO],
  "inventario:editar": [Rol.ADMIN, Rol.GERENTE, Rol.BODEGUERO],
  "inventario:trasladar": [Rol.ADMIN, Rol.GERENTE, Rol.BODEGUERO],

  // ADMIN + CAJERO
  "ventas:crear": [Rol.ADMIN, Rol.CAJERO],
  "ventas:ver": [Rol.ADMIN, Rol.GERENTE, Rol.CAJERO, Rol.VENDEDOR],
  "ventas:anular": [Rol.ADMIN, Rol.CAJERO],

  // ADMIN + CAJERO (caja)
  "caja:abrir": [Rol.ADMIN, Rol.CAJERO],
  "caja:cerrar": [Rol.ADMIN, Rol.CAJERO],
  "caja:movimientos": [Rol.ADMIN, Rol.CAJERO],

  // ADMIN + GERENTE + CAJERO
  "compras:crear": [Rol.ADMIN, Rol.GERENTE],
  "compras:ver": [Rol.ADMIN, Rol.GERENTE],
  "compras:anular": [Rol.ADMIN],

  // ADMIN + GERENTE + CAJERO + VENDEDOR
  "clientes:ver": [Rol.ADMIN, Rol.GERENTE, Rol.CAJERO, Rol.VENDEDOR],
  "clientes:crear": [Rol.ADMIN, Rol.GERENTE, Rol.CAJERO],

  // VENDEDOR: solo sus ventas
  "mis-ventas:ver": [Rol.ADMIN, Rol.GERENTE, Rol.CAJERO, Rol.VENDEDOR],
};

/**
 * Verifica si un rol tiene permiso para una acción específica
 */
export function hasPermission(rol: Rol, action: string): boolean {
  const allowed = PERMISOS[action];
  if (!allowed) return false;
  return allowed.includes(rol);
}

/**
 * Verifica si un rol tiene alguno de los permisos listados
 */
export function hasAnyPermission(rol: Rol, actions: string[]): boolean {
  return actions.some((action) => hasPermission(rol, action));
}

/**
 * Retorna la lista de módulos que un rol puede acceder
 */
export function getAccessibleModules(rol: Rol): string[] {
  const modules = new Set<string>();
  for (const [action, roles] of Object.entries(PERMISOS)) {
    if (roles.includes(rol)) {
      modules.add(action.split(":")[0]);
    }
  }
  return Array.from(modules);
}
