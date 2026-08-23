import { listarGiftCards, type GiftCardLista } from "@/lib/actions/fidelizacion";
import { listarClientes } from "@/lib/actions/contactos";
import GiftCardsClient from "./GiftCardsClient";

export const dynamic = "force-dynamic";

export default async function GiftCardsPage() {
  const [giftCards, clientes] = await Promise.all([
    listarGiftCards(),
    listarClientes(true),
  ]);

  return (
    <GiftCardsClient
      giftCardsIniciales={giftCards as unknown as GiftCardLista[]}
      clientes={clientes}
    />
  );
}
