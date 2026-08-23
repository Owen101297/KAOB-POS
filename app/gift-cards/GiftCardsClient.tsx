"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Gift,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { formatoCOP } from "@/lib/format";
import {
  emitirGiftCard,
  type GiftCardLista,
} from "@/lib/actions/fidelizacion";

type GiftCardRow = GiftCardLista & Record<string, unknown>;

interface ClienteItem {
  id: number;
  nombre: string;
  documento: string | null;
}

interface GiftCardsClientProps {
  giftCardsIniciales: GiftCardLista[];
  clientes: ClienteItem[];
}

export default function GiftCardsClient({
  giftCardsIniciales,
  clientes,
}: GiftCardsClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [codigo, setCodigo] = useState("");
  const [montoInicial, setMontoInicial] = useState<number | "">("");
  const [clienteId, setClienteId] = useState<string>("NINGUNO");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [cardImprimir, setCardImprimir] = useState<GiftCardLista | null>(null);
  const [modalPrintOpen, setModalPrintOpen] = useState(false);

  function generarCodigoAleatorio() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "GC-";
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    code += "-";
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setCodigo(code);
  }

  function abrirModalEmitir() {
    generarCodigoAleatorio();
    setMontoInicial("");
    setClienteId("NINGUNO");
    setFechaVencimiento("");
    setErrorMsg(null);
    setModalOpen(true);
  }

  async function handleEmitir() {
    setErrorMsg(null);
    if (!codigo.trim()) {
      setErrorMsg("Genera o ingresa un código para la tarjeta.");
      return;
    }
    const monto = Number(montoInicial);
    if (!monto || monto <= 0) {
      setErrorMsg("Ingresa un monto inicial válido mayor a 0.");
      return;
    }

    const res = await emitirGiftCard({
      codigo: codigo.trim().toUpperCase(),
      montoInicial: monto,
      clienteId: clienteId !== "NINGUNO" ? Number(clienteId) : undefined,
      fechaVencimiento: fechaVencimiento || undefined,
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setModalOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }

  // Métricas
  const totalEmitido = giftCardsIniciales.reduce((a, g) => a + g.montoInicial, 0);
  const totalSaldoDisponible = giftCardsIniciales
    .filter((g) => g.estado === "ACTIVA")
    .reduce((a, g) => a + g.saldoActual, 0);
  const cardsActivas = giftCardsIniciales.filter((g) => g.estado === "ACTIVA").length;

  const cardsFiltradas = giftCardsIniciales.filter(
    (g) =>
      !busqueda ||
      g.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (g.cliente?.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase())
  ) as GiftCardRow[];

  const columns = [
    {
      key: "codigo",
      label: "Código Gift Card",
      render: (g: GiftCardRow) => (
        <span className="font-mono font-extrabold text-sm text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
          {g.codigo}
        </span>
      ),
    },
    {
      key: "beneficiario",
      label: "Beneficiario",
      render: (g: GiftCardRow) => (
        <div>
          <span className="font-semibold text-slate-800">
            {g.cliente?.nombre ?? "Al Portador"}
          </span>
          {g.cliente?.documento && (
            <span className="block text-[11px] text-slate-400 font-mono">
              Doc: {g.cliente.documento}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "montoInicial",
      label: "Monto Inicial",
      render: (g: GiftCardRow) => (
        <span className="text-slate-600 font-semibold">{formatoCOP(g.montoInicial)}</span>
      ),
    },
    {
      key: "saldoActual",
      label: "Saldo Disponible",
      render: (g: GiftCardRow) => (
        <span className={`font-extrabold text-sm ${g.saldoActual > 0 ? "text-emerald-600" : "text-slate-400"}`}>
          {formatoCOP(g.saldoActual)}
        </span>
      ),
    },
    {
      key: "vencimiento",
      label: "Vencimiento",
      render: (g: GiftCardRow) => (
        <span className="text-xs text-slate-500">
          {g.fechaVencimiento ? new Date(g.fechaVencimiento).toLocaleDateString("es-CO") : "Sin vencimiento"}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (g: GiftCardRow) => {
        if (g.estado === "ACTIVA") return <Badge variant="success">Activa</Badge>;
        if (g.estado === "AGOTADA") return <Badge variant="neutral">Agotada</Badge>;
        return <Badge variant="danger">Vencida</Badge>;
      },
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (g: GiftCardRow) => (
        <Button
          size="icon"
          variant="ghost"
          title="Imprimir Vale de Regalo"
          onClick={() => {
            setCardImprimir(g as unknown as GiftCardLista);
            setModalPrintOpen(true);
          }}
        >
          <Printer className="h-4 w-4 text-brand-600" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Tarjetas de Regalo / Gift Cards"
        description="Emisión de bonos de compra con código único y control de saldo redimible en caja."
        actions={
          <Button onClick={abrirModalEmitir} className="gap-2">
            <Plus className="h-4 w-4" /> Emitir Gift Card
          </Button>
        }
      />

      {/* METRICAS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Emitido en Bonos"
          value={formatoCOP(totalEmitido)}
          icon={<Gift className="h-5 w-5 text-brand-600" />}
          color="brand"
          hint="Monto total acumulado"
        />
        <StatCard
          label="Saldo Disponible en Circulación"
          value={formatoCOP(totalSaldoDisponible)}
          icon={<Wallet className="h-5 w-5 text-emerald-600" />}
          color="sky"
          hint="Saldo pendiente de redimir"
        />
        <StatCard
          label="Tarjetas Activas"
          value={cardsActivas.toString()}
          icon={<CheckCircle2 className="h-5 w-5 text-violet-600" />}
          color="violet"
          hint="Listas para compras en POS"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código o cliente…"
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          title="Refrescar"
          onClick={() => startTransition(() => router.refresh())}
        >
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={cardsFiltradas}
        pageTitle="Tarjetas de Regalo Emitidas"
      />

      {/* MODAL EMITIR GIFT CARD */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-brand-600" /> Emitir Tarjeta de Regalo
            </DialogTitle>
            <DialogDescription>
              Genera un código canjeable para compras en el punto de venta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">Código de la Tarjeta *</label>
                <button
                  type="button"
                  onClick={generarCodigoAleatorio}
                  className="text-[11px] text-brand-600 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Regenerar
                </button>
              </div>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                className="font-mono font-extrabold text-sm tracking-wider uppercase text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monto Inicial (COP) *</label>
              <Input
                type="number"
                min={5000}
                step={5000}
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value ? Number(e.target.value) : "")}
                placeholder="Ej. 100000"
                className="text-base font-extrabold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cliente Asignado (opcional)</label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Al Portador (Cualquiera)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NINGUNO">Al Portador (Cualquier persona)</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre} {c.documento ? `(${c.documento})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fecha de Expiración (opcional)</label>
              <Input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
            </div>

            {errorMsg && <p className="font-semibold text-red-500">{errorMsg}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleEmitir} disabled={pending || !codigo || !montoInicial}>
              {pending ? "Emitiendo…" : "Emitir Gift Card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL IMPRIMIR VALE 80MM */}
      <Dialog open={modalPrintOpen} onOpenChange={setModalPrintOpen}>
        <DialogContent className="max-w-xs p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-sm font-bold">Vale de Regalo</DialogTitle>
          </DialogHeader>

          {cardImprimir && (
            <div className="font-mono text-[11px] space-y-2 border-2 border-dashed p-3 rounded bg-white text-center">
              <div className="font-extrabold text-sm text-slate-900">TARJETA DE REGALO</div>
              <div className="text-[10px] text-slate-500">KAOB POS - BONO CANJEABLE</div>
              <div className="my-3 p-2 bg-slate-100 rounded text-base font-extrabold tracking-widest text-slate-900">
                {cardImprimir.codigo}
              </div>
              <div className="flex justify-between border-t pt-1">
                <span>VALOR:</span>
                <span className="font-extrabold text-xs">{formatoCOP(cardImprimir.saldoActual)}</span>
              </div>
              <div className="flex justify-between">
                <span>Beneficiario:</span>
                <span className="font-bold truncate max-w-[120px]">{cardImprimir.cliente?.nombre ?? "Al Portador"}</span>
              </div>
              <div className="text-[9px] text-slate-400 border-t pt-1">
                Presenta este código en caja al momento de pagar.
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button size="sm" className="w-full" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Imprimir Vale 80mm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
