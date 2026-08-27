'use client';

import { useState } from 'react';
import { loginWithCredentials, loginWithGoogle } from '@/lib/actions/auth';
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import type { ActionResult } from '@/lib/validations';
import { cn } from '@/lib/utils';

const DEMO_PRESETS = [
  {
    role: 'ADMIN',
    label: 'Administrador',
    email: 'admin@kaob.com',
    pass: 'Admin123!',
    desc: 'Acceso total: Configuración, Usuarios, Finanzas e Informes',
    badge: 'Control Total',
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  },
  {
    role: 'GERENTE',
    label: 'Gerente',
    email: 'gerente@kaob.com',
    pass: 'Gerente123!',
    desc: 'Gestión operativa, informes, inventario y compras',
    badge: 'Operaciones',
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  },
  {
    role: 'CAJERO',
    label: 'Cajero',
    email: 'cajero@kaob.com',
    pass: 'Cajero123!',
    desc: 'Punto de venta, cobros, arqueos, créditos y apartados',
    badge: 'Caja & POS',
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
  {
    role: 'VENDEDOR',
    label: 'Vendedor',
    email: 'vendedor@kaob.com',
    pass: 'Vendedor123!',
    desc: 'Cockpit de ventas, pedidos online y catálogo',
    badge: 'Mostrador',
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  },
  {
    role: 'BODEGUERO',
    label: 'Bodeguero',
    email: 'bodega@kaob.com',
    pass: 'Bodega123!',
    desc: 'Stock, traslados, movimientos y auditoría de inventario',
    badge: 'Logística',
    color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  },
];

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleSelectPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setEmail(preset.email);
    setPassword(preset.pass);
    setSelectedRole(preset.role);
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const result: ActionResult = await loginWithCredentials(
      { ok: false, error: '' },
      formData
    );
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 bg-slate-950 text-white selection:bg-slate-800 selection:text-white">
      {/* ────────────────── COLUMNA IZQUIERDA (BRAND EXPERIENCE) ────────────────── */}
      <div className="relative hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-between p-12 xl:p-16 overflow-hidden border-r border-slate-800/60 bg-gradient-to-br from-slate-950 via-slate-900 to-black">
        {/* Glow de fondo */}
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-slate-700/10 blur-[140px] pointer-events-none" />
        
        {/* Decoración geométrica */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Top brand header */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center p-2 shadow-2xl shadow-white/10 ring-1 ring-white/20">
            <img
              src="/brand/isotype.svg"
              alt="KAOB"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <span className="text-xl font-black tracking-widest text-white">
              KΛOB
            </span>
            <span className="block text-[10px] uppercase font-bold tracking-[0.25em] text-slate-400">
              MODERN WEAR
            </span>
          </div>
        </div>

        {/* Centro de experiencia de marca */}
        <div className="relative z-10 my-auto py-12 max-w-xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-800/40 px-3.5 py-1.5 text-xs font-semibold backdrop-blur text-slate-200 shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>Retail Management & Smart Point of Sale</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Gestión Integral <br />
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Streetwear Luxury
              </span>
            </h1>
            <p className="text-sm xl:text-base text-slate-400 font-normal leading-relaxed">
              Control unificado de inventario multisede, cockpit POS de alta frecuencia,
              cartera de créditos, apartados y sincronización omnicanal en tiempo real.
            </p>
          </div>

          {/* Cards de características */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80">
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-brand-400 shadow-sm">
                <Zap className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Cockpit POS Express
              </h4>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                Pagos mixtos, Addi, Sistecrédito y emisión de tickets térmicos.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80">
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-blue-400 shadow-sm">
                <Layers className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Control por Roles
              </h4>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                Permisos aislados para Admin, Gerente, Cajero, Vendedor y Bodega.
              </p>
            </div>
          </div>
        </div>

        {/* Footer brand testimonial */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} KAOB MODERN WEAR</span>
          <span className="font-mono text-[11px] tracking-wider text-slate-400">
            SECURE RBAC PROTOCOL v2.0
          </span>
        </div>
      </div>

      {/* ────────────────── COLUMNA DERECHA (FORMULARIO Y ACCESO RÁPIDO) ────────────────── */}
      <div className="flex-1 lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-950">
        {/* Cabecera en móvil */}
        <div className="flex items-center justify-between lg:hidden mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-md">
              <img
                src="/brand/isotype.svg"
                alt="KAOB"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <span className="text-base font-black tracking-widest text-white">
                KΛOB
              </span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-slate-400">
                MODERN WEAR
              </span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto space-y-7">
          {/* Título */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Acceso Seguro al Sistema</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Iniciar Sesión
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Ingresa tus credenciales para acceder a tus funciones autorizadas.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs font-medium text-red-200 animate-fade-in flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedRole(null);
                  }}
                  autoComplete="email"
                  placeholder="ejemplo@kaob.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-3.5 text-sm text-white shadow-inner outline-none transition placeholder:text-slate-600 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedRole(null);
                  }}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-10 text-sm text-white shadow-inner outline-none transition placeholder:text-slate-600 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-xl transition-all duration-200 hover:bg-slate-100 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>Validando permisos...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* ────────────────── ACCESO RÁPIDO PARA PRUEBAS DE ROLES ────────────────── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                Roles de Prueba Rápida (1 Clic)
              </span>
              <span className="h-px flex-1 bg-slate-800" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_PRESETS.map((preset) => {
                const isSelected = selectedRole === preset.role;
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      'flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-200',
                      isSelected
                        ? 'border-white bg-slate-800/90 ring-1 ring-white/50 shadow-lg'
                        : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                    )}
                  >
                    <div className="flex w-full items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">
                        {preset.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-full font-mono">
                      {preset.email.split('@')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedRole && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-300 animate-fade-in flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {DEMO_PRESETS.find((p) => p.role === selectedRole)?.desc}
                </span>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
                  Listo para entrar
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer pequeño en la columna derecha */}
        <div className="text-center pt-6 text-[11px] text-slate-600">
          <span>KΛOB Modern Wear &bull; Sistema Protegido con NextAuth v5</span>
        </div>
      </div>
    </div>
  );
}
