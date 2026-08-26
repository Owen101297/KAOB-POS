import { listarPedidosOnline, listarLeadsTienda } from '@/lib/actions/tienda';
import VentasOnlineClient from './VentasOnlineClient';

export const dynamic = 'force-dynamic';

export default async function VentasOnlinePage() {
  const [pedidos, leads] = await Promise.all([listarPedidosOnline(), listarLeadsTienda()]);

  return <VentasOnlineClient pedidosIniciales={pedidos} leadsIniciales={leads} />;
}
