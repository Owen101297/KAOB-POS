// Skeleton de carga del catálogo (spec 002, US3): se muestra mientras la
// página dinámica consulta la base de datos (streaming de Next, honesto y
// reutilizable para futuras mutations client-side del catálogo).

export default function ProductGridSkeleton({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-busy="true" aria-label="Cargando prendas">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-sm">
          <div className="aspect-[4/5] bg-zinc-100 animate-pulse" />
          <div className="p-4 sm:p-5 space-y-3">
            <div className="h-2.5 w-1/3 rounded bg-zinc-100 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-zinc-100 animate-pulse" />
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-4 w-4 rounded-full bg-zinc-100 animate-pulse" />
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <div className="h-5 w-24 rounded bg-zinc-100 animate-pulse" />
              <div className="h-8 w-20 rounded-xl bg-zinc-100 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
