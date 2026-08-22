import type { Metadata } from "next";
import { listarProveedores } from "@/lib/actions/contactos";
import ProveedoresClient from "./ProveedoresClient";

export const metadata: Metadata = { title: "Proveedores | POS System" };

export default async function Page() {
  const proveedores = await listarProveedores(false);
  return <ProveedoresClient proveedores={proveedores} />;
}