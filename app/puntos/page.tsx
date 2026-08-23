import {
  listarMovimientosPuntos,
  type MovimientoPuntosLista,
} from "@/lib/actions/fidelizacion";
import { listarClientes } from "@/lib/actions/contactos";
import PuntosClient from "./PuntosClient";

export const dynamic = "force-dynamic";

export default async function PuntosPage() {
  const [movimientos, clientes] = await Promise.all([
    listarMovimientosPuntos(),
    listarClientes(true),
  ]);

  return (
    <PuntosClient
      movimientosIniciales={movimientos as unknown as MovimientoPuntosLista[]}
      clientes={clientes}
    />
  );
}
