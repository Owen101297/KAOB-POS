import { resumenCajaActual } from "@/lib/actions/caja";
import CerrarCajaClient from "./CerrarCajaClient";

export const dynamic = "force-dynamic";

export default async function CerrarPage() {
  const resumen = await resumenCajaActual();

  return <CerrarCajaClient resumenCaja={resumen} />;
}
