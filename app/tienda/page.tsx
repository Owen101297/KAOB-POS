import { db } from '@/lib/db';
import { listarProductos, type ProductoLista } from '@/lib/actions/productos';
import {
  obtenerVentasPorProducto,
  obtenerActividadRecienteVitrina,
  obtenerPromocionDestacada,
} from '@/lib/actions/tienda';
import TiendaClient from './TiendaClient';

export const dynamic = 'force-dynamic';

export default async function TiendaVirtualPage() {
  let productos: ProductoLista[] = [];
  let categorias: { id: number; nombre: string }[] = [];
  let configuracion = {
    nombreTienda: 'KAOB MODERN WEAR',
    telefono: '573000000000',
    direccion: '',
    ciudad: '',
  };
  let ventasPorProducto: Record<number, number> = {};
  let actividadReciente: { nombre: string; producto: string; minutosAtras: number; ciudad: string }[] = [];
  let promocionDestacada: { nombre: string; tipo: string; valor: number; fechaFin: Date } | null = null;

  try {
    const [prods, cats, conf, ventas, actividad, promo] = await Promise.all([
      listarProductos(true),
      db.categoria.findMany({
        where: { productos: { some: { activo: true } } },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true },
      }),
      db.configuracion.findFirst(),
      obtenerVentasPorProducto(30),
      obtenerActividadRecienteVitrina(),
      obtenerPromocionDestacada(),
    ]);

    productos = prods ?? [];
    categorias = cats ?? [];
    ventasPorProducto = ventas ?? {};
    actividadReciente = actividad ?? [];
    promocionDestacada = promo && promo.fechaFin ? { ...promo, fechaFin: promo.fechaFin } : null;
    if (conf) {
      configuracion = {
        nombreTienda: conf.nombreTienda || 'KAOB MODERN WEAR',
        telefono: conf.telefono || '573000000000',
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
      ventasPorProducto={ventasPorProducto}
      actividadReciente={actividadReciente}
      promocionDestacada={promocionDestacada}
    />
  );
}
