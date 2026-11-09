'use client';

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";

// Split Login adaptado de 21st.dev (hirael/login-03, MIT):
// - floating paths con CSS puro (sin motion), respeta prefers-reduced-motion
// - marca KΛOB MODERN WEAR (isotype.svg), nada de GitHub
// - usuario + contraseña contra /api/login (sesión firmada)

const jitter = (i: number) => {
  const value = Math.sin(i + 1) * 10_000;
  return value - Math.floor(value);
};

const buildPaths = (position: number) =>
  Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
    dur: `${20 + jitter(i) * 10}s`,
    delay: `${-jitter(i + 40) * 20}s`,
  }));

const FloatingPaths = ({ position }: { position: number }) => {
  const paths = React.useMemo(() => buildPaths(position), [position]);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <svg className="h-full w-full text-zinc-100" fill="none" viewBox="0 0 696 316">
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            pathLength={1}
            stroke="currentColor"
            className="login-fp-path opacity-60"
            strokeOpacity={0.08 + path.id * 0.025}
            strokeWidth={path.width}
            style={{ ["--login-dur" as string]: path.dur, animationDelay: path.delay }}
          />
        ))}
      </svg>
    </div>
  );
};

const stagger = (index: number, step = 70): React.CSSProperties => ({
  animationDelay: `${index * step}ms`,
});

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const retorno = params.get("retorno") || "/";

  const [usuario, setUsuario] = React.useState("");
  const [clave, setClave] = React.useState("");
  const [mostrarClave, setMostrarClave] = React.useState(false);
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        setError(data.error || "No fue posible iniciar sesión.");
        return;
      }
      router.replace(retorno);
      // Recarga para que el middleware / requireAuth vean la cookie ya fijada.
      router.refresh();
    } catch {
      setError("Sin conexión con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="relative min-h-svh overflow-hidden bg-white lg:grid lg:grid-cols-2">
      {/* aside decorativo */}
      <aside className="relative hidden h-full flex-col overflow-hidden border-r border-zinc-200 bg-zinc-950 p-10 text-white lg:flex">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent, transparent, rgba(9,9,11,0.55))" }}
        />
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        <div className="login-enter relative z-10 flex items-center gap-3">
          <img src="/brand/isotype.svg" alt="KΛOB" className="h-11 w-11 rounded-full ring-1 ring-white/20" />
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-[-0.025em]">KΛOB</p>
            <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-400">Modern Wear</p>
          </div>
        </div>

        <figure style={stagger(4)} className="login-enter relative z-10 mt-auto flex flex-col gap-3">
          <blockquote className="font-serif text-3xl leading-[1.25] tracking-tight">
            El mostrador, <span className="italic text-zinc-300">siempre listo</span>.
            Tu tienda, tu caja, tu inventario — en una sola pantalla.
          </blockquote>
          <figcaption className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500">
            <span>POS · Caja · Pedidos</span>
            <span aria-hidden className="text-zinc-700">|</span>
            <span>Colombia</span>
          </figcaption>
        </figure>
      </aside>

      {/* panel principal */}
      <div className="relative flex min-h-svh flex-col justify-center px-8 lg:min-h-0">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          <div
            className="login-glow absolute end-0 top-0 h-96 w-96 -translate-y-24 translate-x-24 rounded-full bg-zinc-100 blur-3xl"
          />
          <div
            className="login-glow absolute bottom-0 start-0 h-72 w-72 -translate-x-24 translate-y-24 rounded-full bg-zinc-50 blur-3xl"
            style={{ animationDelay: "-6s" }}
          />
        </div>

        <a
          href="/tienda"
          className="login-enter absolute start-5 top-7 z-10 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="size-4" />
          Tienda
        </a>

        <div className="relative z-10 mx-auto w-full space-y-6 sm:max-w-sm">
          <div className="login-enter flex items-center gap-3 lg:hidden">
            <img src="/brand/isotype.svg" alt="KΛOB" className="h-11 w-11 rounded-full ring-1 ring-zinc-200" />
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-[-0.025em] text-zinc-900">KΛOB</p>
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-400">Modern Wear</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h1 style={stagger(1)} className="login-enter font-serif text-4xl font-medium tracking-tight text-zinc-950 sm:text-5xl">
              Bienvenido.
            </h1>
            <p style={stagger(2)} className="login-enter text-sm text-zinc-500">
              Inicia sesión para entrar al punto de venta.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div style={stagger(3)} className="login-enter">
              <label htmlFor="usuario" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Usuario
              </label>
              <input
                id="usuario"
                name="usuario"
                type="text"
                autoComplete="username"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={enviando}
                placeholder="usuario@ejemplo.co"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60"
              />
            </div>

            <div style={stagger(4)} className="login-enter">
              <label htmlFor="clave" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="clave"
                  name="clave"
                  type={mostrarClave ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  disabled={enviando}
                  placeholder="••••••••••••"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setMostrarClave((v) => !v)}
                  aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  {mostrarClave ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                {error}
              </p>
            )}

            <div style={stagger(5)} className="login-enter">
              <button
                type="submit"
                disabled={enviando}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {enviando ? (
                  <>
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                    Ingresando…
                  </>
                ) : (
                  "Entrar al POS"
                )}
              </button>
            </div>
          </form>

          <p style={stagger(6)} className="login-enter flex items-center gap-1.5 text-xs text-muted-foreground text-zinc-400">
            <ShieldCheck className="size-3.5" />
            Acceso restringido al personal de la tienda.
          </p>
        </div>
      </div>
    </section>
  );
}
