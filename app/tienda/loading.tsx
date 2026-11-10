import ProductGridSkeleton from '@/components/tienda/ProductGridSkeleton';

// Loading real de streaming: /tienda es force-dynamic; el esqueleto editorial
// (papel hueso) cubre ese tiempo con la misma forma visual del catálogo.
export default function LoadingTienda() {
  return (
    <div className="bg-bone-50">
      {/* Hero skeleton */}
      <div className="bg-bone-100 border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl space-y-4">
            <div className="h-3 w-40 rounded bg-bone-200 animate-pulse" />
            <div className="h-16 sm:h-24 w-4/5 rounded-lg bg-bone-200 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-bone-300/60 animate-pulse" />
            <div className="flex gap-3 pt-3">
              <div className="h-12 w-44 rounded-full bg-ink/80 animate-pulse" />
              <div className="h-12 w-40 rounded-full bg-bone-200 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-8 w-56 rounded bg-bone-200 animate-pulse mb-8" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
