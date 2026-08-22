import { listarCompras, type CompraLista } from "@/lib/actions/compras";
import HistoricoComprasClient from "./HistoricoComprasClient";

export const dynamic = "force-dynamic";

export default async function HistoricoComprasPage() {
  const compras = await listarCompras();

  return (
    <HistoricoComprasClient comprasIniciales={compras as unknown as CompraLista[]} />
  );
}
