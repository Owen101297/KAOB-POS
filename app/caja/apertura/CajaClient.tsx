"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, AlertCircle, Loader2, DollarSign, X, Printer, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeading } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { abrirCaja, obtenerSesionAbierta, resumenCajaActual } from "@/lib/actions/caja";
import { formatoCOP } from "@/lib/format";

const COLORS = {
  brand: "bg-brand-50 text-brand-600",
  sky: "bg-sky-50 text-sky-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-600",
} as const;

function StatCard({ titulo, valor, icon, color = "brand" }: { titulo: string; valor: string; icon: React.ReactNode; color?: keyof typeof COLORS }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-card">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${COLORS[color]}`}>{icon}</div>
      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{titulo}</p>
        <p className="text-xl font-bold text-slate-900">{valor}</p>
      </div>
    </div>
  );
}

export default function CajaClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [baseInicial, setBaseInicial] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [sesion, setSesion] = useState<Awaited<ReturnType<typeof obtenerSesionAbierta>> | null>(null);
  const [resumen, setResumen] = useState<Awaited<ReturnType<typeof resumenCajaActual>> | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    try {
      const [s, r] = await Promise.all([obtenerSesionAbierta(), resumenCajaActual()]);
      setSesion(s);
      setResumen(r);
    } catch {
      setError("Error al cargar estado de caja");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function abrir() {
    setError(null);
    const res = await abrirCaja({ baseInicial: Number(baseInicial) || 0 });
    if (!res.ok) return setError(res.error);
    await cargar();
    setBaseInicial("0");
  }

  async function imprimirArqueo() {
    window.print();
  }

  if (cargando) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (sesion) {
    return (
      <div>
        <PageHeader
          title="Caja abierta"
          description={`Sesión iniciada: ${new Date(sesion.openedAt).toLocaleString()}`}
          actions={
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimir arqueo
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard titulo="Base inicial" valor={formatoCOP(resumen?.ingresoBase ?? 0)} icon={<DollarSign className="h-4 w-4" />} color="sky" />
          <StatCard titulo="Ventas efectivo" valor={formatoCOP(resumen?.ventasEfectivo ?? 0)} icon={<DollarSign className="h-4 w-4" />} color="brand" />
          <StatCard titulo="Retiros" valor={formatoCOP(resumen?.retiros ?? 0)} icon={<Minus className="h-4 w-4" />} color="amber" />
          <StatCard titulo="Suplidos" valor={formatoCOP(resumen?.suplidos ?? 0)} icon={<Plus className="h-4 w-4" />} color="violet" />
        </div>

        <Card className="mt-4">
          <CardHeading
            icon={<DollarSign className="h-4 w-4" />}
            titulo="Total esperado en efectivo"
            descripcion="Base + ventas - retiros - suplidos + otros"
          />
          <div className="p-5 text-center">
            <p className="text-3xl font-bold text-slate-900">{formatoCOP(resumen?.esperadoEfectivo ?? 0)}</p>
            <p className="mt-1 text-sm text-slate-400">Efectivo que debería haber en caja al cerrar</p>
          </div>
        </Card>

        <Card className="mt-4">
          <CardHeading
            icon={<Building2 className="h-4 w-4" />}
            titulo="Información de la sesión"
            descripcion="Detalles de la sesión actual"
          />
          <div className="p-5 grid gap-3 sm:grid-cols-2">
            <div><span className="text-sm text-slate-400">Bodega</span><p className="font-medium">{sesion.bodega?.nombre ?? "Todas"}</p></div>
            <div><span className="text-sm text-slate-400">Apertura</span><p className="font-medium">{new Date(sesion.openedAt).toLocaleString()}</p></div>
            <div><span className="text-sm text-slate-400">Base inicial</span><p className="font-medium">{formatoCOP(sesion.baseInicial)}</p></div>
            <div><span className="text-sm text-slate-400">Movimientos</span><p className="font-medium">{sesion.movimientos.length}</p></div>
          </div>
        </Card>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => router.push("/caja/cerrar")}>
            <X className="h-4 w-4" /> Cerrar caja
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Apertura de caja"
        description="Ingresa la base inicial de efectivo para comenzar la sesión."
      />

      <Card className="max-w-md">
        <CardHeading
          icon={<Building2 className="h-4 w-4" />}
          titulo="Abrir nueva sesión"
          descripcion="La base inicial es el efectivo con el que empieza la caja."
        />
        <form onSubmit={(e) => { e.preventDefault(); abrir(); }} className="p-5 grid gap-4">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-600">Base inicial (COP)</span>
            <Input type="number" min={0} value={baseInicial} onChange={(e) => setBaseInicial(e.target.value)} autoFocus />
          </label>
          {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Abrir caja
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}