import { resumenCajaActual } from "@/lib/actions/caja";
import IngresoEfectivoClient from "./IngresoEfectivoClient";

export const dynamic = "force-dynamic";

export default async function IngresoPage() {
  const resumen = await resumenCajaActual();

  return <IngresoEfectivoClient resumenCaja={resumen} />;
}
