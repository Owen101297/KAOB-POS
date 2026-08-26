import UsuariosClient from "@/components/usuarios/UsuariosClient";
import { listarUsuarios } from "@/lib/actions/usuarios";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const usuarios = await listarUsuarios();
  return <UsuariosClient usuarios={usuarios} />;
}
