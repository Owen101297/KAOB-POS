"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import {
  Landmark,
  Plus,
  ArrowRightLeft,
  Building,
  CheckCircle2,
  AlertCircle,
  History,
  CheckCheck,
  Edit2,
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  guardarCuentaBancaria,
  transferirEntreCuentas,
  type CuentaBancariaItem,
} from "@/lib/actions/bancos";
import { formatoCOP } from "@/lib/format";

interface BancosClientProps {
  cuentas: CuentaBancariaItem[];
}

export default function BancosClient({ cuentas }: BancosClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modalCuenta, setModalCuenta] = useState(false);
  const [modalTransferencia, setModalTransferencia] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<CuentaBancariaItem | null>(null);

  const [msg, setMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  // Form Cuenta
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"AHORROS" | "CORRIENTE" | "BILLETERA_DIGITAL" | "TARJETA">("AHORROS");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [titular, setTitular] = useState("");
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [color, setColor] = useState("#2563eb");
  const [activa, setActiva] = useState(true);

  // Form Transferencia
  const [origenId, setOrigenId] = useState<number | "">("");
  const [destinoId, setDestinoId] = useState<number | "">("");
  const [montoTrf, setMontoTrf] = useState(0);
  const [refTrf, setRefTrf] = useState("");
  const [notaTrf, setNotaTrf] = useState("");

  const saldoTotal = cuentas.reduce((acc, c) => acc + (c.activa ? c.saldoActual : 0), 0);

  function abrirModalNuevaCuenta() {
    setEditingCuenta(null);
    setNombre("");
    setTipo("AHORROS");
    setNumeroCuenta("");
    setTitular("");
    setSaldoInicial(0);
    setColor("#2563eb");
    setActiva(true);
    setMsg(null);
    setModalCuenta(true);
  }

  function abrirModalEditar(c: CuentaBancariaItem) {
    setEditingCuenta(c);
    setNombre(c.nombre);
    setTipo(c.tipo as any);
    setNumeroCuenta(c.numeroCuenta || "");
    setTitular(c.titular || "");
    setSaldoInicial(c.saldoActual);
    setColor(c.color || "#2563eb");
    setActiva(c.activa);
    setMsg(null);
    setModalCuenta(true);
  }

  function abrirModalTransferir() {
    if (cuentas.length < 2) {
      setMsg({ tipo: "err", texto: "Debes tener al menos 2 cuentas para realizar transferencias." });
      return;
    }
    setOrigenId(cuentas[0]?.id || "");
    setDestinoId(cuentas[1]?.id || "");
    setMontoTrf(0);
    setRefTrf("");
    setNotaTrf("");
    setMsg(null);
    setModalTransferencia(true);
  }

  async function handleGuardarCuenta() {
    setMsg(null);
    if (!nombre.trim()) {
      setMsg({ tipo: "err", texto: "El nombre de la cuenta es obligatorio." });
      return;
    }

    startTransition(async () => {
      const res = await guardarCuentaBancaria({
        id: editingCuenta?.id,
        nombre,
        tipo,
        numeroCuenta,
        titular,
        saldoInicial: editingCuenta ? undefined : Number(saldoInicial),
        color,
        activa,
      });

      if (res.ok) {
        setModalCuenta(false);
        router.refresh();
      } else {
        setMsg({ tipo: "err", texto: res.error });
      }
    });
  }

  async function handleTransferir() {
    setMsg(null);
    if (!origenId || !destinoId) {
      setMsg({ tipo: "err", texto: "Selecciona las cuentas de origen y destino." });
      return;
    }
    if (origenId === destinoId) {
      setMsg({ tipo: "err", texto: "Las cuentas de origen y destino deben ser diferentes." });
      return;
    }
    if (montoTrf <= 0) {
      setMsg({ tipo: "err", texto: "El monto debe ser mayor a 0." });
      return;
    }

    startTransition(async () => {
      const res = await transferirEntreCuentas({
        cuentaOrigenId: Number(origenId),
        cuentaDestinoId: Number(destinoId),
        monto: Number(montoTrf),
        referencia: refTrf,
        nota: notaTrf,
      });

      if (res.ok) {
        setModalTransferencia(false);
        router.refresh();
      } else {
        setMsg({ tipo: "err", texto: res.error });
      }
    });
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen text-slate-900">
      <PageHeader
        title="Gestión de Cuentas Bancarias"
        description="Administra cuentas de ahorros, corrientes, billeteras digitales (Nequi/Daviplata) y pasarelas de pago."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/bancos/plataformas">
              <Button variant="outline" size="sm" className="flex items-center gap-2 font-bold bg-white text-teal-700 border-teal-200 hover:bg-teal-50">
                <CircleDollarSign className="h-4 w-4 text-teal-600" />
                Plataformas BNPL (Addi / Sistecrédito)
              </Button>
            </Link>
            <Link href="/bancos/movimientos">
              <Button variant="outline" size="sm" className="flex items-center gap-2 font-bold bg-white">
                <History className="h-4 w-4" />
                Historial de Movimientos
              </Button>
            </Link>
            <Link href="/bancos/conciliaciones">
              <Button variant="outline" size="sm" className="flex items-center gap-2 font-bold bg-white">
                <CheckCheck className="h-4 w-4" />
                Conciliaciones
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={abrirModalTransferir} className="flex items-center gap-2 font-bold bg-white">
              <ArrowRightLeft className="h-4 w-4" />
              Transferir
            </Button>
            <Button size="sm" onClick={abrirModalNuevaCuenta} className="flex items-center gap-2 font-bold">
              <Plus className="h-4 w-4" />
              Nueva Cuenta
            </Button>
          </div>
        }
      />

      {msg && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl border ${
            msg.tipo === "ok"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {msg.tipo === "ok" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />}
          <span className="text-sm font-semibold">{msg.texto}</span>
        </div>
      )}

      {/* Saldo Global Consolidado */}
      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Saldo Total Consolidado en Bancos
            </p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              {formatoCOP(saldoTotal)}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {cuentas.filter((c) => c.activa).length} cuentas activas registradas en el sistema
            </p>
          </div>
          <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 border border-brand-100">
            <Landmark className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>

      {/* Grilla de Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cuentas.length === 0 ? (
          <Card className="col-span-full p-12 text-center bg-white border-slate-200">
            <Building className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No hay cuentas bancarias registradas</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Crea tu primera cuenta para controlar ingresos por transferencias y pagos de gastos.
            </p>
            <Button size="sm" onClick={abrirModalNuevaCuenta}>
              Crear Cuenta Bancaria
            </Button>
          </Card>
        ) : (
          cuentas.map((c) => (
            <Card
              key={c.id}
              className={`bg-white border-slate-200 shadow-2xs hover:shadow-sm transition-all relative overflow-hidden ${
                !c.activa ? "opacity-60" : ""
              }`}
            >
              <div
                className="h-1.5 w-full absolute top-0 left-0"
                style={{ backgroundColor: c.color || "#2563eb" }}
              />
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-2xs"
                      style={{ backgroundColor: c.color || "#2563eb" }}
                    >
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{c.nombre}</h4>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">{c.tipo.replace("_", " ")}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => abrirModalEditar(c)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                    title="Editar cuenta"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="py-2 border-y border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">N° Cuenta / Teléfono:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {c.numeroCuenta || "No registrado"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Titular:</span>
                    <span className="font-semibold text-slate-800">
                      {c.titular || "Empresa"}
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-500 block">
                      Saldo Actual
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      {formatoCOP(c.saldoActual)}
                    </span>
                  </div>
                  <Badge variant={c.activa ? "success" : "neutral"}>
                    {c.activa ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Crear / Editar Cuenta */}
      <Dialog open={modalCuenta} onOpenChange={setModalCuenta}>
        <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-900 shadow-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <Landmark className="h-5 w-5 text-brand-600" />
              {editingCuenta ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nombre de la Cuenta *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Bancolombia Ahorros, Nequi Negocio"
                className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                >
                  <option value="AHORROS">Ahorros</option>
                  <option value="CORRIENTE">Corriente</option>
                  <option value="BILLETERA_DIGITAL">Billetera (Nequi/Daviplata)</option>
                  <option value="TARJETA">Tarjeta Débito/Crédito</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Color Identificador
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-12 rounded border border-slate-300 cursor-pointer bg-white"
                  />
                  <span className="text-xs font-mono font-bold text-slate-700 uppercase">{color}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Número de Cuenta / Teléfono
              </label>
              <input
                type="text"
                value={numeroCuenta}
                onChange={(e) => setNumeroCuenta(e.target.value)}
                placeholder="Ej. 123-456789-00 o 3101234567"
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Titular de la Cuenta
              </label>
              <input
                type="text"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                placeholder="Ej. KAOB SAS o Nombre del Titular"
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {!editingCuenta && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Saldo Inicial (COP)
                </label>
                <input
                  type="number"
                  min={0}
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(Number(e.target.value))}
                  className="w-full h-9 px-3 text-xs font-black rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3 flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setModalCuenta(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleGuardarCuenta}
              disabled={isPending}
              className="font-bold"
            >
              {isPending ? "Guardando..." : "Guardar Cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Transferencia entre Cuentas */}
      <Dialog open={modalTransferencia} onOpenChange={setModalTransferencia}>
        <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-900 shadow-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <ArrowRightLeft className="h-5 w-5 text-brand-600" />
              Transferir entre Cuentas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cuenta de Origen *
                </label>
                <select
                  value={origenId}
                  onChange={(e) => setOrigenId(Number(e.target.value))}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none cursor-pointer"
                >
                  {cuentas
                    .filter((c) => c.activa)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({formatoCOP(c.saldoActual)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cuenta de Destino *
                </label>
                <select
                  value={destinoId}
                  onChange={(e) => setDestinoId(Number(e.target.value))}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none cursor-pointer"
                >
                  {cuentas
                    .filter((c) => c.activa)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({formatoCOP(c.saldoActual)})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Monto a Transferir (COP) *
              </label>
              <input
                type="number"
                min={1}
                value={montoTrf || ""}
                onChange={(e) => setMontoTrf(Number(e.target.value))}
                placeholder="0"
                className="w-full h-9 px-3 text-xs font-black rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Número de Referencia / Comprobante
              </label>
              <input
                type="text"
                value={refTrf}
                onChange={(e) => setRefTrf(e.target.value)}
                placeholder="Ej. TRF-102938"
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nota u Observación
              </label>
              <input
                type="text"
                value={notaTrf}
                onChange={(e) => setNotaTrf(e.target.value)}
                placeholder="Motivo del traslado de fondos..."
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3 flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setModalTransferencia(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleTransferir}
              disabled={isPending}
              className="font-bold"
            >
              {isPending ? "Transfiriendo..." : "Realizar Transferencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
