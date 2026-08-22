import {
  listarCreditos,
  obtenerResumenCartera,
  type CreditoLista,
} from "@/lib/actions/credito";
import { listarBodegas } from "@/lib/actions/catalogos";
import CreditosClient from "./CreditosClient";

export const dynamic = "force-dynamic";

export default async function CreditosPage() {
  const [creditos, resumen, bodegas] = await Promise.all([
    listarCreditos(),
    obtenerResumenCartera(),
    listarBodegas(true),
  ]);

  return (
    <CreditosClient
      creditosIniciales={creditos as unknown as CreditoLista[]}
      resumenCartera={resumen}
      bodegas={bodegas}
    />
  );
}
