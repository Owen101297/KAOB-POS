import { listarVentas, type VentaLista } from "@/lib/actions/ventas";
import RemisionesClient from "./RemisionesClient";

export const dynamic = "force-dynamic";

export default async function RemisionesPage() {
  const remisiones = await listarVentas({ tipo: "REMISION" });

  return (
    <RemisionesClient remisionesIniciales={remisiones as unknown as VentaLista[]} />
  );
}
