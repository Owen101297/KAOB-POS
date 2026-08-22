import {
  obtenerReporteInventarioRotacion,
  obtenerReporteRentabilidad,
  obtenerReporteVentas,
} from "@/lib/actions/reportes";
import { listarBodegas } from "@/lib/actions/catalogos";
import InformesClient from "./InformesClient";

export const dynamic = "force-dynamic";

interface InformesPageProps {
  searchParams: {
    dias?: string;
    bodegaId?: string;
  };
}

export default async function InformesPage({ searchParams }: InformesPageProps) {
  const dias = searchParams.dias ? Number(searchParams.dias) : 30;
  const bodegaIdNum =
    searchParams.bodegaId && searchParams.bodegaId !== "TODAS"
      ? Number(searchParams.bodegaId)
      : undefined;

  const [reporteVentas, reporteRentabilidad, reporteInventario, bodegas] =
    await Promise.all([
      obtenerReporteVentas(dias, bodegaIdNum),
      obtenerReporteRentabilidad(dias),
      obtenerReporteInventarioRotacion(bodegaIdNum),
      listarBodegas(true),
    ]);

  return (
    <InformesClient
      reporteVentas={reporteVentas}
      reporteRentabilidad={reporteRentabilidad}
      reporteInventario={reporteInventario}
      bodegas={bodegas}
      diasIniciales={dias}
      bodegaIdInicial={bodegaIdNum}
    />
  );
}
