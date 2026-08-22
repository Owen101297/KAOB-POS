import { listarOrdenesCompra, type OrdenCompraLista } from "@/lib/actions/compras";
import { listarProveedores } from "@/lib/actions/contactos";
import { listarBodegas } from "@/lib/actions/catalogos";
import OrdenesCompraClient from "./OrdenesCompraClient";

export const dynamic = "force-dynamic";

export default async function OrdenesCompraPage() {
  const [ordenes, proveedores, bodegas] = await Promise.all([
    listarOrdenesCompra(),
    listarProveedores(true),
    listarBodegas(true),
  ]);

  return (
    <OrdenesCompraClient
      ordenesIniciales={ordenes as unknown as OrdenCompraLista[]}
      proveedores={proveedores}
      bodegas={bodegas}
    />
  );
}
