import { db } from '@/lib/db';
import { listarProductos, type ProductoLista } from '@/lib/actions/productos';
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

  try {
    const [prods, cats, conf] = await Promise.all([
      listarProductos(true),
      db.categoria.findMany({
        where: { productos: { some: { activo: true } } },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true },
      }),
      db.configuracion.findFirst(),
    ]);

    productos = prods ?? [];
    categorias = cats ?? [];
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
    />
  );
}
