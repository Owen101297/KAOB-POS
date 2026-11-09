import { listarPedidosOnline, type PedidoOnlineLista } from "@/lib/actions/pedidos";
import VentasOnlineClient from "./VentasOnlineClient";

export const dynamic = "force-dynamic";

export default async function VentasOnlinePage() {
  const pedidos = await listarPedidosOnline();

  return (
    <VentasOnlineClient pedidosIniciales={pedidos as unknown as PedidoOnlineLista[]} />
  );
}
