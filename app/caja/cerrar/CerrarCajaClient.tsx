"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Loader2,
  PiggyBank,
  Receipt,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { formatoCOP } from "@/lib/format";
import { cerrarCaja } from "@/lib/actions/caja";

const DENOMINATIONS = [
  { val: 100000, label: "$ 100.000" },
  { val: 50000, label: "$ 50.000" },
  { val: 20000, label: "$ 20.000" },
  { val: 10000, label: "$ 10.000" },
  { val: 5000, label: "$ 5.000" },
  { val: 2000, label: "$ 2.000" },
  { val: 1000, label: "$ 1.000" },
];

interface CerrarCajaClientProps {
  resumenCaja: {
    sesion: {
      id: number;
      baseInicial: number;
      estado: string;
      openedAt: Date;
      bodega: { nombre: string } | null;
    };
    ingresoBase: number;
    retiros: number;
    suplidos: number;
    ventasEfectivo: number;
    otros: number;
    esperadoEfectivo: number;
  } | null;
}

export default function CerrarCajaClient({ resumenCaja }: CerrarCajaClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [conteoBilletes, setConteoBilletes] = useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });

  const [monedasTotal, setMonedasTotal] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cálculo del total contado en efectivo
  const totalBilletes = useMemo(() => {
    return Object.entries(conteoBilletes).reduce((sum, [valStr, cant]) => {
      return sum + Number(valStr) * (cant || 0);
    }, 0);
  }, [conteoBilletes]);

  const totalContado = totalBilletes + (monedasTotal || 0);
  const esperadoEfectivo = resumenCaja?.esperadoEfectivo ?? 0;
  const diferencia = totalContado - esperadoEfectivo;

  function setCantidadBillete(val: number, cant: number) {
    setConteoBilletes((prev) => ({
      ...prev,
      [val]: Math.max(0, cant),
    }));
  }

  async function handleCerrarCaja() {
    if (!resumenCaja) return;
    setErrorMsg(null);

    const res = await cerrarCaja(resumenCaja.sesion.id, {
      EFECTIVO: totalContado,
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    startTransition(() => {
      router.push("/caja/cierres");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Cerrar Caja"
        description="Realiza el conteo de efectivo por denominación y efectúa el cierre de turno."
        actions={
          resumenCaja ? (
            <Badge variant="warning" className="px-3 py-1 font-semibold">
              Turno Abierto · {resumenCaja.sesion.bodega?.nombre ?? "Bodega Principal"}
            </Badge>
          ) : undefined
        }
      />

      {!resumenCaja ? (
        <div className="mx-auto max-w-xl bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-xl text-center space-y-3">
          <TriangleAlert className="h-10 w-10 text-amber-600 mx-auto" />
          <h3 className="text-base font-bold">La caja ya se encuentra cerrada</h3>
          <p className="text-xs text-amber-700">
            No existe ningún turno activo para cerrar. Puedes realizar una nueva apertura o consultar el historial de cierres.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => router.push("/caja/cierres")}>
              Ver Historial de Cierres
            </Button>
            <Button onClick={() => router.push("/caja/apertura")}>
              Abrir Caja
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* RESUMEN DEL TURNO (Columna Izquierda) */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base">Resumen del Turno</CardTitle>
              <CardDescription>
                Transacciones y movimientos de dinero registrados durante la sesión
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="flex items-center gap-2 text-slate-600">
                  <PiggyBank className="h-4 w-4 text-slate-500" /> Base Inicial
                </span>
                <span className="font-bold text-slate-900">{formatoCOP(resumenCaja.ingresoBase)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-lg">
                <span className="flex items-center gap-2 text-emerald-800">
                  <Banknote className="h-4 w-4 text-emerald-600" /> Ventas en Efectivo (+)
                </span>
                <span className="font-bold text-emerald-900">{formatoCOP(resumenCaja.ventasEfectivo)}</span>
              </div>

              {resumenCaja.retiros > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50/60 rounded-lg">
                  <span className="flex items-center gap-2 text-red-800">
                    <ArrowUpFromLine className="h-4 w-4 text-red-600" /> Retiros de Caja (-)
                  </span>
                  <span className="font-bold text-red-900">-{formatoCOP(resumenCaja.retiros)}</span>
                </div>
              )}

              {resumenCaja.suplidos > 0 && (
                <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-lg">
                  <span className="flex items-center gap-2 text-amber-800">
                    <Receipt className="h-4 w-4 text-amber-600" /> Suplidos / Gastos (-)
                  </span>
                  <span className="font-bold text-amber-900">-{formatoCOP(resumenCaja.suplidos)}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl mt-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                    Efectivo Esperado en Caja
                  </span>
                  <span className="text-xs text-slate-400">Total según sistema</span>
                </div>
                <span className="text-xl font-extrabold">{formatoCOP(esperadoEfectivo)}</span>
              </div>
            </CardContent>
          </Card>

          {/* CALCULADORA DE BILLETES Y ARQUEO (Columna Derecha) */}
          <Card className="lg:col-span-3">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Arqueo y Conteo de Efectivo</CardTitle>
                  <CardDescription>
                    Ingresa la cantidad de billetes y monedas contados en la caja
                  </CardDescription>
                </div>

                <div>
                  {diferencia === 0 && (
                    <Badge variant="success" className="px-3 py-1 font-bold">
                      Arqueo Exacto ($0)
                    </Badge>
                  )}
                  {diferencia > 0 && (
                    <Badge variant="info" className="px-3 py-1 font-bold">
                      Sobrante +{formatoCOP(diferencia)}
                    </Badge>
                  )}
                  {diferencia < 0 && (
                    <Badge variant="danger" className="px-3 py-1 font-bold">
                      Faltante {formatoCOP(diferencia)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* GRID DENOMINACIONES BILLETES */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Billetes (Cantidades)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DENOMINATIONS.map((d) => (
                    <div key={d.val} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-extrabold text-slate-700">{d.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatoCOP(d.val * (conteoBilletes[d.val] || 0))}
                        </span>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={conteoBilletes[d.val] || ""}
                        onChange={(e) => setCantidadBillete(d.val, Number(e.target.value) || 0)}
                        className="h-9 text-center font-bold"
                      />
                    </div>
                  ))}

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-extrabold text-slate-700">Monedas (Total)</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatoCOP(monedasTotal)}
                      </span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      step={50}
                      placeholder="0"
                      value={monedasTotal || ""}
                      onChange={(e) => setMonedasTotal(Number(e.target.value) || 0)}
                      className="h-9 text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* TOTAL CONTADO VS ESPERADO */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-100 rounded-xl text-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Contado</span>
                  <span className="text-lg font-extrabold text-slate-900">{formatoCOP(totalContado)}</span>
                </div>

                <div className={`p-3 rounded-xl border ${diferencia === 0 ? "bg-emerald-50 border-emerald-200 text-emerald-900" : diferencia > 0 ? "bg-sky-50 border-sky-200 text-sky-900" : "bg-red-50 border-red-200 text-red-900"}`}>
                  <span className="text-[11px] font-bold uppercase block">
                    Diferencia (Contado - Esperado)
                  </span>
                  <span className="text-lg font-extrabold">
                    {diferencia > 0 ? `+${formatoCOP(diferencia)}` : formatoCOP(diferencia)}
                  </span>
                </div>
              </div>

              {diferencia !== 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
                  <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <p>
                    La diferencia de {formatoCOP(diferencia)} quedará asentada automáticamente como movimiento de ajuste para la auditoría de caja.
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => router.push("/ventas/nueva")}>
                Volver
              </Button>
              <Button onClick={handleCerrarCaja} disabled={pending} size="lg">
                {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar y Cerrar Caja
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
