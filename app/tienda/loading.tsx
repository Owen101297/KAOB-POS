import ProductGridSkeleton from '@/components/tienda/ProductGridSkeleton';

// Loading real de streaming: la página de tienda es force-dynamic y consulta
// la BD en cada visita; este esqueleto cubre ese tiempo con la misma forma
// visual del catálogo (spec 002, US3 — skeletons de carga).
export default function LoadingTienda() {
  return (
    <div className="bg-white">
      {/* Hero skeleton */}
      <div className="relative bg-black border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-24">
          <div className="max-w-3xl space-y-4">
            <div className="h-3 w-36 rounded bg-zinc-800 animate-pulse" />
            <div className="h-12 sm:h-20 w-4/5 rounded-xl bg-zinc-800 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-zinc-800/70 animate-pulse" />
            <div className="flex gap-3 pt-3">
              <div className="h-12 w-40 rounded-full bg-zinc-800 animate-pulse" />
              <div className="h-12 w-48 rounded-full bg-zinc-800/70 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-6 w-44 rounded bg-zinc-100 animate-pulse mb-6" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
