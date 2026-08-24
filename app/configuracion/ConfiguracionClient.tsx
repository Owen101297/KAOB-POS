"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Building2,
  Receipt,
  Target,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Award,
} from "lucide-react";
import { guardarConfiguracion } from "@/lib/actions/configuracion";

interface ConfiguracionProps {
  config: {
    id: number;
    nombreTienda: string;
    nit: string | null;
    direccion: string | null;
    telefono: string | null;
    ciudad: string | null;
    email: string | null;
    regimen: string | null;
    mensajeTicket: string | null;
    pieTicket: string | null;
    logoUrl: string | null;
    metaDiaria: number;
    puntosPorMonto: number;
  };
}

export default function ConfiguracionClient({ config }: ConfiguracionProps) {
  const [activeTab, setActiveTab] = useState<"empresa" | "ticket" | "operaciones">("empresa");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  // Estados del Formulario
  const [nombreTienda, setNombreTienda] = useState(config.nombreTienda || "");
  const [nit, setNit] = useState(config.nit || "");
  const [direccion, setDireccion] = useState(config.direccion || "");
  const [telefono, setTelefono] = useState(config.telefono || "");
  const [ciudad, setCiudad] = useState(config.ciudad || "Bogotá D.C.");
  const [email, setEmail] = useState(config.email || "");
  const [regimen, setRegimen] = useState(config.regimen || "Responsable de IVA");

  const [mensajeTicket, setMensajeTicket] = useState(config.mensajeTicket || "¡Gracias por su compra!");
  const [pieTicket, setPieTicket] = useState(
    config.pieTicket || "Conserve este ticket para cambios o garantías (plazo máximo 30 días con etiquetas)."
  );

  const [metaDiaria, setMetaDiaria] = useState(config.metaDiaria || 1500000);
  const [puntosPorMonto, setPuntosPorMonto] = useState(config.puntosPorMonto || 10000);

  async function handleGuardar() {
    setMsg(null);
    startTransition(async () => {
      const res = await guardarConfiguracion({
        nombreTienda,
        nit,
        direccion,
        telefono,
        ciudad,
        email,
        regimen,
        mensajeTicket,
        pieTicket,
        metaDiaria: Number(metaDiaria),
        puntosPorMonto: Number(puntosPorMonto),
      });

      if (res.ok) {
        setMsg({ tipo: "ok", texto: "¡Configuración guardada exitosamente!" });
      } else {
        setMsg({ tipo: "err", texto: res.error });
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración General del Negocio"
        description="Personaliza la identidad fiscal de la tienda, tickets térmicos POS de 80mm y metas operativas."
        actions={
          <Button
            variant="primary"
            onClick={handleGuardar}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        }
      />

      {msg && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl border ${
            msg.tipo === "ok"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {msg.tipo === "ok" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          )}
          <span className="text-sm font-semibold">{msg.texto}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("empresa")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "empresa"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Datos de la Empresa & Fiscal
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ticket")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "ticket"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Receipt className="h-4 w-4" />
          Ticket Térmico POS 80mm
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("operaciones")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "operaciones"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Target className="h-4 w-4" />
          Metas & Fidelización
        </button>
      </div>

      {/* Tab: Empresa */}
      {activeTab === "empresa" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-600" />
                Información Tributaria y Comercial
              </CardTitle>
              <p className="text-xs text-slate-500">
                Estos datos se imprimirán en los tickets, comprobantes y reportes oficiales.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nombre Comercial / Razón Social *
                  </label>
                  <input
                    type="text"
                    value={nombreTienda}
                    onChange={(e) => setNombreTienda(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                    placeholder="Ej. KAOB Moda & Estilo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    NIT / Cédula Fiscal
                  </label>
                  <input
                    type="text"
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                    placeholder="Ej. 900.123.456-7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Régimen Tributario
                  </label>
                  <select
                    value={regimen}
                    onChange={(e) => setRegimen(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                  >
                    <option value="Responsable de IVA">Responsable de IVA</option>
                    <option value="No Responsable de IVA (Régimen Simplificado)">
                      No Responsable de IVA (Régimen Simplificado)
                    </option>
                    <option value="Régimen Simple de Tributación (RST)">
                      Régimen Simple de Tributación (RST)
                    </option>
                    <option value="Gran Contribuyente">Gran Contribuyente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Ciudad / Municipio
                  </label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                    placeholder="Ej. Medellín, Antioquia"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Dirección Principal de la Tienda
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                    placeholder="Ej. Carrera 7 # 12-34 Local 102"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Teléfono / WhatsApp de Contacto
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                      placeholder="Ej. (+57) 310 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                      placeholder="Ej. contacto@mitienda.com"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta Identidad Activa Blanca y Clara */}
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200 shadow-xs">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                    Identidad Activa
                  </span>
                  <Badge variant="success">En Operación</Badge>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900">
                    {nombreTienda || "Nombre de Tienda"}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    NIT: {nit || "Sin registrar"}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand-600 shrink-0" />
                    <span>{direccion ? `${direccion} - ${ciudad}` : "Dirección no configurada"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-brand-600 shrink-0" />
                    <span>{telefono || "Teléfono no configurado"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-600 shrink-0" />
                    <span>{regimen}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Ticket */}
      {activeTab === "ticket" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-white border border-slate-200 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-brand-600" />
                  Personalización de Tirilla / Ticket Térmico 80mm
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Configura los mensajes de bienvenida y políticas de devolución que se imprimen en cada venta.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mensaje de Agradecimiento / Encabezado
                  </label>
                  <input
                    type="text"
                    value={mensajeTicket}
                    onChange={(e) => setMensajeTicket(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                    placeholder="¡Gracias por su compra! Vuelva pronto."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Políticas de Cambio & Pie de Página
                  </label>
                  <textarea
                    rows={4}
                    value={pieTicket}
                    onChange={(e) => setPieTicket(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                    placeholder="Conserve este ticket para cambios o garantías..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Aparecerá al final del ticket impreso junto al código de barras del documento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vista previa en vivo del Ticket 80mm */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[300px] bg-white border border-slate-300 rounded-xl shadow-lg p-5 font-mono text-[11px] text-slate-900 select-none">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-3 mb-3">
                <p className="font-bold text-sm tracking-wider">{nombreTienda.toUpperCase() || "KAOB POS"}</p>
                <p className="text-[10px] text-slate-600">NIT: {nit || "900.000.000-0"}</p>
                <p className="text-[10px] text-slate-600">{direccion || "Cra 7 # 12-34"}</p>
                <p className="text-[10px] text-slate-600">Tel: {telefono || "3000000000"}</p>
                <p className="text-[9px] text-slate-500">{regimen}</p>
              </div>

              <div className="text-center font-bold my-2 text-xs">FACTURA DE VENTA: V-0102</div>

              <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 mb-2 text-[10px]">
                <div className="flex justify-between">
                  <span>Fecha: {new Date().toLocaleDateString("es-CO")}</span>
                  <span>Hora: 14:30</span>
                </div>
                <div>Cliente: CLIENTE GENERAL</div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-2 mb-2">
                <div className="flex justify-between font-bold text-[10px]">
                  <span>CANT / DESCRIPCIÓN</span>
                  <span>SUBTOTAL</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>1x Camisa Lino Azul M</span>
                  <span>$85.000</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>1x Jean Slim Fit 32</span>
                  <span>$120.000</span>
                </div>
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 mb-2 text-right">
                <div className="flex justify-between text-[10px]">
                  <span>Subtotal:</span>
                  <span>$205.000</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Descuento:</span>
                  <span>$0</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>$205.000</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Pago Efectivo:</span>
                  <span>$210.000</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Cambio:</span>
                  <span>$5.000</span>
                </div>
              </div>

              <div className="text-center space-y-2 pt-1 text-[10px] text-slate-700">
                <p className="font-semibold">{mensajeTicket}</p>
                <p className="text-[9px] leading-tight text-slate-500">{pieTicket}</p>
                <p className="text-[8px] text-slate-400 tracking-widest pt-2">||| | |||| || ||||| |||||||</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Operaciones & Metas */}
      {activeTab === "operaciones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Meta Diaria de Ventas
              </CardTitle>
              <p className="text-xs text-slate-500">
                Monto objetivo diario para los indicadores del Topbar y Dashboard POS.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Meta Diaria en Pesos Colombianos (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={metaDiaria}
                    onChange={(e) => setMetaDiaria(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                  />
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Valor formateado:{" "}
                  <strong className="text-emerald-700 font-black">
                    ${Number(metaDiaria).toLocaleString("es-CO")} COP
                  </strong>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                Regla de Puntos de Fidelización
              </CardTitle>
              <p className="text-xs text-slate-500">
                Determina cuántos pesos en compras equivalen a 1 punto acumulable para el cliente.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Monto por cada 1 Punto (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    min={100}
                    step={1000}
                    value={puntosPorMonto}
                    onChange={(e) => setPuntosPorMonto(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
                  />
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Ejemplo: Por una compra de $100.000 el cliente acumulará{" "}
                  <strong className="text-amber-700 font-black">
                    {Math.floor(100000 / (puntosPorMonto || 1))} puntos
                  </strong>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
