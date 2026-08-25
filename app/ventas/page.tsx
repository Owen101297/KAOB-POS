import { listarVentas, estadisticasDia, type VentaLista } from "@/lib/actions/ventas";
import VentasClient from "./VentasClient";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  try {
    const [ventas, stats] = await Promise.all([
      listarVentas({ tipo: "VENTA" }).catch((err) => {
        console.error("Error al cargar ventas:", err);
        return [];
      }),
      estadisticasDia().catch((err) => {
        console.error("Error al calcular estadísticas del día:", err);
        return {
          ventas: { total: 0, cantidad: 0 },
          remisiones: { total: 0, cantidad: 0 },
          cotizaciones: { cantidad: 0 },
        };
      }),
    ]);

    return (
      <VentasClient
        ventasIniciales={(ventas ?? []) as unknown as VentaLista[]}
        statsIniciales={
          stats ?? {
            ventas: { total: 0, cantidad: 0 },
            remisiones: { total: 0, cantidad: 0 },
            cotizaciones: { cantidad: 0 },
          }
        }
      />
    );
  } catch (error) {
    console.error("Error general en VentasPage:", error);
    return (
      <VentasClient
        ventasIniciales={[]}
        statsIniciales={{
          ventas: { total: 0, cantidad: 0 },
          remisiones: { total: 0, cantidad: 0 },
          cotizaciones: { cantidad: 0 },
        }}
      />
    );
  }
}

