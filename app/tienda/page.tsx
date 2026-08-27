import { db } from '@/lib/db';
import { listarProductos, type ProductoLista } from '@/lib/actions/productos';
import { obtenerConfiguracion } from '@/lib/actions/configuracion';
import {
  obtenerVentasPorProducto,
  obtenerActividadRecienteVitrina,
  obtenerPromocionDestacada,
} from '@/lib/actions/tienda';
import TiendaClient from './TiendaClient';

export const dynamic = 'force-dynamic';

export interface CuentaBancariaTienda {
  id: number;
  nombre: string;
  tipo: string;
  numeroCuenta: string | null;
  titular: string | null;
}

export default async function TiendaVirtualPage() {
  let productos: ProductoLista[] = [];
  let categorias: { id: number; nombre: string }[] = [];
  let configuracion = {
    nombreTienda: 'KAOB',
    telefono: '3136332887',
    direccion: 'Villagarzón, Putumayo',
    ciudad: 'Villagarzón',
  };
  let ventasPorProducto: Record<number, number> = {};
  let actividadReciente: { nombre: string; producto: string; minutosAtras: number; ciudad: string }[] = [];
  let promocionDestacada: { nombre: string; tipo: string; valor: number; fechaFin: Date } | null = null;
  let cuentasBancarias: CuentaBancariaTienda[] = [];

  try {
    const [prods, cats, conf, ventas, actividad, promo, cuentas] = await Promise.all([
      listarProductos(true),
      db.categoria.findMany({
        where: { productos: { some: { activo: true } } },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true },
      }),
      obtenerConfiguracion(),
      obtenerVentasPorProducto(30),
      obtenerActividadRecienteVitrina(),
      obtenerPromocionDestacada(),
      db.cuentaBancaria.findMany({
        where: { activa: true },
        select: { id: true, nombre: true, tipo: true, numeroCuenta: true, titular: true },
        orderBy: { nombre: 'asc' },
      }),
    ]);

    productos = prods ?? [];
    categorias = cats ?? [];
    ventasPorProducto = ventas ?? {};
    actividadReciente = actividad ?? [];
    promocionDestacada = promo && promo.fechaFin ? { ...promo, fechaFin: promo.fechaFin } : null;
    cuentasBancarias = cuentas ?? [];

    if (conf) {
      configuracion = {
        nombreTienda: conf.nombreTienda || 'KΛOB MODERN WEAR',
        telefono: conf.telefono?.replace(/[^0-9]/g, '') || '3136332887',
        direccion: conf.direccion || '',
        ciudad: conf.ciudad || '',
      };
    }
  } catch (err) {
    console.error('Error cargando datos de tienda:', err);
  }

  return (
    <TiendaClient
      productos={productos}
      categorias={categorias}
      configuracion={configuracion}
      cuentasBancarias={cuentasBancarias}
      ventasPorProducto={ventasPorProducto}
      actividadReciente={actividadReciente}
      promocionDestacada={promocionDestacada}
    />
  );
}
