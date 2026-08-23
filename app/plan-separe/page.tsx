import { listarPlanesSepare, type PlanSepareLista } from "@/lib/actions/fidelizacion";
import { listarClientes } from "@/lib/actions/contactos";
import { listarBodegas } from "@/lib/actions/catalogos";
import PlanSepareClient from "./PlanSepareClient";

export const dynamic = "force-dynamic";

export default async function PlanSeparePage() {
  const [planes, clientes, bodegas] = await Promise.all([
    listarPlanesSepare(),
    listarClientes(true),
    listarBodegas(true),
  ]);

  return (
    <PlanSepareClient
      planesIniciales={planes as unknown as PlanSepareLista[]}
      clientes={clientes}
      bodegas={bodegas}
    />
  );
}
