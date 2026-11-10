import { db } from '@/lib/db';
import { listarProductosPublicos, type ProductoTienda } from '@/lib/tienda/public-productos';
import TiendaClient from './TiendaClient';
import { wompiConfigurado, boldConfigurado } from '@/lib/pagos/tipos';

export const dynamic = 'force-dynamic';

// SEO/OG público de la vitrina (spec 002, US3): título y descripción pensados
// para búsqueda y compartir en WhatsApp/Instagram.
export const metadata = {
  title: 'KAOB MODERN WEAR · Prendas de streetwear en Colombia',
  description:
    'Tienda online de ropa KAOB: hoodies, camisetas y prendas premium para Dama y Caballero. Pago seguro online, envíos a toda Colombia y cambios fáciles por 30 días.',
  openGraph: {
    title: 'KAOB MODERN WEAR · Prendas de streetwear en Colombia',
    description:
      'Hoodies, camisetas y prendas premium. Paga con tarjeta, Addi, Sistecrédito o contraentrega. Envíos a toda Colombia.',
    type: 'website',
    locale: 'es_CO',
    siteName: 'KAOB MODERN WEAR',
    images: [{ url: '/brand/logo.svg' }],
  },
  twitter: { card: 'summary_large_image' },
};

export default async function TiendaVirtualPage() {
  let productos: ProductoTienda[] = [];
  let categorias: { id: number; nombre: string }[] = [];
  let configuracion = {
    nombreTienda: 'KAOB MODERN WEAR',
    telefono: '573000000000',
    direccion: '',
    ciudad: '',
  };

  try {
    const [prods, cats, conf] = await Promise.all([
      listarProductosPublicos(),
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
      pasarelas={{ wompi: wompiConfigurado(), bold: boldConfigurado() }}
    />
  );
}
