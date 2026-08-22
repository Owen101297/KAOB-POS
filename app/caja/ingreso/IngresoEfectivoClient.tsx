"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  DollarSign,
  Loader2,
  PiggyBank,
  Receipt,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { formatoCOP } from "@/lib/format";
import { agregarMovimientoCaja } from "@/lib/actions/caja";

interface IngresoEfectivoClientProps {
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

export default function IngresoEfectivoClient({ resumenCaja }: IngresoEfectivoClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [tipoMovimiento, setTipoMovimiento] = useState<"INGRESO_BASE" | "RETIRO" | "SUPLIDO" | "OTRO">("INGRESO_BASE");
  const [montoStr, setMontoStr] = useState("");
  const [referencia, setReferencia] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoMsg, setExitoMsg] = useState<string | null>(null);

  const monto = Number(montoStr) || 0;
  const disponibleEfectivo = resumenCaja?.esperadoEfectivo ?? 0;
  const esRetiroOGasto = tipoMovimiento === "RETIRO" || tipoMovimiento === "SUPLIDO";
  const superaDisponible = esRetiroOGasto && monto > disponibleEfectivo;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setExitoMsg(null);

    if (!resumenCaja) {
      setErrorMsg("Debe haber una caja abierta para registrar movimientos.");
      return;
    }
    if (monto <= 0) {
      setErrorMsg("Ingresa un monto válido mayor a $0.");
      return;
    }
    if (superaDisponible) {
      setErrorMsg(`El saldo disponible en caja en efectivo es ${formatoCOP(disponibleEfectivo)}. No puedes retirar ${formatoCOP(monto)}.`);
      return;
    }

    const res = await agregarMovimientoCaja({
      sesionId: resumenCaja.sesion.id,
      tipo: tipoMovimiento,
      monto,
      referencia: referencia.trim() || undefined,
    });

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setExitoMsg(`✅ Movimiento de ${formatoCOP(monto)} registrado correctamente.`);
    setMontoStr("");
    setReferencia("");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Movimientos de Caja"
        description="Registra ingresos de base, retiros a caja fuerte o suplidos/gastos menores."
      />

      {!resumenCaja ? (
        <div className="mx-auto max-w-xl bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-xl text-center space-y-3">
          <TriangleAlert className="h-10 w-10 text-amber-600 mx-auto" />
          <h3 className="text-base font-bold">No hay ninguna caja abierta</h3>
          <p className="text-xs text-amber-700">
            Debes realizar la apertura de turno de caja antes de registrar movimientos manuales de efectivo.
          </p>
          <Button onClick={() => router.push("/caja/apertura")}>
            Ir a Apertura de Caja
          </Button>
        </div>
      ) : (
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${esRetiroOGasto ? "bg-red-50 text-red-600" : "bg-sky-50 text-sky-600"}`}>
                    {esRetiroOGasto ? <ArrowUpFromLine className="h-5 w-5" /> : <ArrowDownToLine className="h-5 w-5" />}
                  </span>
                  <div>
                    <CardTitle className="text-base">Nuevo Movimiento Manual</CardTitle>
                    <CardDescription>
                      Turno activo de {resumenCaja.sesion.bodega?.nombre ?? "Bodega Principal"}
                    </CardDescription>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block">Efectivo Disponible</span>
                  <span className="text-lg font-extrabold text-slate-900">{formatoCOP(disponibleEfectivo)}</span>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Tipo de Movimiento *
                  </label>
                  <Select
                    value={tipoMovimiento}
                    onValueChange={(v) => setTipoMovimiento(v as any)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INGRESO_BASE">Ingreso de Capital / Base Adicional (+)</SelectItem>
                      <SelectItem value="RETIRO">Retiro a Caja Fuerte / Banco (-)</SelectItem>
                      <SelectItem value="SUPLIDO">Suplido / Gasto Menor de Caja (-)</SelectItem>
                      <SelectItem value="OTRO">Otro Ajuste de Caja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Monto (COP) *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                      $
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={500}
                      placeholder="0"
                      value={montoStr}
                      onChange={(e) => setMontoStr(e.target.value)}
                      className="h-12 pl-9 text-xl font-bold tabular-nums"
                    />
                  </div>
                  {monto > 0 && (
                    <p className="mt-1 text-xs text-slate-500 text-right">
                      {formatoCOP(monto)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Motivo / Referencia (Opcional)
                  </label>
                  <Input
                    placeholder="Ej. Retiro de exceso de efectivo, pago servicio mensajería..."
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                  />
                </div>

                {superaDisponible && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    El monto ingresado excede el saldo en efectivo disponible ({formatoCOP(disponibleEfectivo)}).
                  </div>
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {exitoMsg && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {exitoMsg}
                  </div>
                )}
              </CardContent>

              <CardFooter className="justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/ventas/nueva")}
                >
                  Volver al POS
                </Button>
                <Button
                  type="submit"
                  disabled={pending || monto <= 0 || superaDisponible}
                  className={esRetiroOGasto ? "bg-red-600 hover:bg-red-700 text-white" : undefined}
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Registrar Movimiento"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
