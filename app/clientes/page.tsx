import type { Metadata } from "next";
import { listarClientes } from "@/lib/actions/contactos";
import ClientesClient from "./ClientesClient";

export const metadata: Metadata = { title: "Clientes | POS System" };

export default async function Page() {
  const clientes = await listarClientes(false);
  return <ClientesClient clientes={clientes} />;
}