import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div role="status" aria-label="Carregando produto" className="mx-auto max-w-6xl space-y-4">
      <Skeleton className="h-5 w-44" />
      <div className="grid gap-8 lg:grid-cols-12">
        <Skeleton className="aspect-square rounded-2xl sm:aspect-[5/4] lg:col-span-7" />
        <div className="space-y-5 rounded-2xl border p-5 lg:col-span-5">
          <Skeleton className="h-9 w-3/4" /><Skeleton className="h-7 w-24" />
          <Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
