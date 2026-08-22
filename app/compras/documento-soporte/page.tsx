import { listarProveedores } from "@/lib/actions/contactos";
import { listarBodegas } from "@/lib/actions/catalogos";
import DocumentoSoporteClient from "./DocumentoSoporteClient";

export const dynamic = "force-dynamic";

export default async function DocumentoSoportePage() {
  const [proveedores, bodegas] = await Promise.all([
    listarProveedores(true),
    listarBodegas(true),
  ]);

  return (
    <DocumentoSoporteClient
      proveedores={proveedores}
      bodegas={bodegas}
    />
  );
}
