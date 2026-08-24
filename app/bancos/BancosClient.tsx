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
  Wallet,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  History,
  CheckCheck,
  Edit2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  guardarCuentaBancaria,
  transferirEntreCuentas,
  type CuentaBancariaItem,
} from "@/lib/actions/bancos";

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
    startTransition(async () => {
      const res = await guardarCuentaBancaria({
        id: editingCuenta?.id,
        nombre,
        tipo,
        numeroCuenta,
        titular,
        saldoInicial: Number(saldoInicial),
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
      setMsg({ tipo: "err", texto: "La cuenta de origen y destino deben ser distintas." });
      return;
    }
    if (montoTrf <= 0) {
      setMsg({ tipo: "err", texto: "Ingresa un monto válido mayor a 0." });
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

  const getTipoIcon = (t: string) => {
    switch (t) {
      case "BILLETERA_DIGITAL":
        return <Wallet className="h-5 w-5" />;
      case "TARJETA":
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Building className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Bancos & Cuentas de Tesorería"
        description="Administra cuentas bancarias, billeteras digitales (Nequi, Daviplata) y transfiere fondos."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/bancos/movimientos">
              <Button variant="outline" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Movimientos
              </Button>
            </Link>
            <Link href="/bancos/conciliaciones">
              <Button variant="outline" className="flex items-center gap-2">
                <CheckCheck className="h-4 w-4" />
                Conciliaciones
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={abrirModalTransferir}
              className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/40"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transferir
            </Button>
            <Button
              variant="primary"
              onClick={abrirModalNuevaCuenta}
              className="flex items-center gap-2"
            >
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
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {msg.tipo === "ok" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span className="text-sm font-medium">{msg.texto}</span>
        </div>
      )}

      {/* Saldo Consolidado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border-0 shadow-xl">
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Saldo Total Consolidado en Bancos
              </span>
              <Badge variant="info">{cuentas.filter((c) => c.activa).length} Cuentas Activas</Badge>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                ${saldoTotal.toLocaleString("es-CO")}{" "}
                <span className="text-sm font-normal text-indigo-300">COP</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Disponibilidad líquida en cuentas de ahorros, corrientes y billeteras virtuales.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 flex flex-col justify-center">
          <CardContent className="p-6 space-y-3 text-center">
            <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto" />
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Operaciones Rápidas</h4>
              <p className="text-xs text-gray-500 mt-1">
                Puedes registrar ingresos directos, gastos con débito o comisiones bancarias.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <Link href="/bancos/movimientos">
                <Button size="sm" variant="outline" className="text-xs">
                  Ver Extracto
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cuentas.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Landmark className="h-10 w-10 mx-auto text-gray-400 mb-2" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">No hay cuentas bancarias registradas</p>
            <p className="text-xs text-gray-500 mt-1">Haz clic en &quot;Nueva Cuenta&quot; para agregar tu primera cuenta bancaria o billetera.</p>
          </div>
        ) : (
          cuentas.map((c) => (
            <Card
              key={c.id}
              className="relative overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
            >
              {/* Barra superior de color personalizado */}
              <div className="h-2 w-full" style={{ backgroundColor: c.color || "#2563eb" }} />

              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl text-white shadow-md"
                      style={{ backgroundColor: c.color || "#2563eb" }}
                    >
                      {getTipoIcon(c.tipo)}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                        {c.nombre}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {c.tipo.replace("_", " ")}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => abrirModalEditar(c)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="py-2 border-y border-gray-100 dark:border-gray-800 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Número de Cuenta:</span>
                    <span className="font-mono font-medium text-gray-800 dark:text-gray-200">
                      {c.numeroCuenta || "No registrado"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Titular:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {c.titular || "Empresa"}
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-gray-500 block">
                      Saldo Actual
                    </span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      ${c.saldoActual.toLocaleString("es-CO")}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-blue-600" />
              {editingCuenta ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Nombre de la Cuenta *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Bancolombia Ahorros, Nequi Negocio"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AHORROS">Ahorros</option>
                  <option value="CORRIENTE">Corriente</option>
                  <option value="BILLETERA_DIGITAL">Billetera (Nequi/Daviplata)</option>
                  <option value="TARJETA">Tarjeta Débito/Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Color Identificador
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-12 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400 uppercase">{color}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Número de Cuenta / Teléfono
              </label>
              <input
                type="text"
                value={numeroCuenta}
                onChange={(e) => setNumeroCuenta(e.target.value)}
                placeholder="Ej. 123-456789-00 o 3101234567"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Titular de la Cuenta
              </label>
              <input
                type="text"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                placeholder="Ej. KAOB SAS o Nombre del Representante"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!editingCuenta && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Saldo Inicial (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    min={0}
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCuenta(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleGuardarCuenta} disabled={isPending}>
              {isPending ? "Guardando..." : editingCuenta ? "Actualizar Cuenta" : "Crear Cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Transferencia entre Cuentas */}
      <Dialog open={modalTransferencia} onOpenChange={setModalTransferencia}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <ArrowRightLeft className="h-5 w-5" />
              Transferencia Entre Cuentas Bancarias
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Cuenta de Origen (Sale el dinero) *
              </label>
              <select
                value={origenId}
                onChange={(e) => setOrigenId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {cuentas
                  .filter((c) => c.activa)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Disponible: ${c.saldoActual.toLocaleString("es-CO")})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Cuenta de Destino (Ingresa el dinero) *
              </label>
              <select
                value={destinoId}
                onChange={(e) => setDestinoId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {cuentas
                  .filter((c) => c.activa && c.id !== origenId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Actual: ${c.saldoActual.toLocaleString("es-CO")})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Monto a Transferir (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  min={1}
                  value={montoTrf || ""}
                  onChange={(e) => setMontoTrf(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Referencia de Transferencia / Comprobante
              </label>
              <input
                type="text"
                value={refTrf}
                onChange={(e) => setRefTrf(e.target.value)}
                placeholder="Ej. TRF-98231 o Aprobación #123"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Nota u Observación
              </label>
              <input
                type="text"
                value={notaTrf}
                onChange={(e) => setNotaTrf(e.target.value)}
                placeholder="Ej. Traslado para pago de proveedores"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalTransferencia(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleTransferir}
              disabled={isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isPending ? "Procesando..." : "Realizar Transferencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
