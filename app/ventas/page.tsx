import { listarVentas, estadisticasDia, type VentaLista } from "@/lib/actions/ventas";
import VentasClient from "./VentasClient";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const [ventas, stats] = await Promise.all([
    listarVentas({ tipo: "VENTA" }),
    estadisticasDia(),
  ]);

  return (
    <VentasClient
      ventasIniciales={ventas as unknown as VentaLista[]}
      statsIniciales={stats}
    />
  );
}
