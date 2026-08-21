// app/produto/[id]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 animate-pulse">
      <Skeleton className="h-8 w-24 rounded-md" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Skeleton className="lg:col-span-8 h-[450px] rounded-2xl" />
        <Skeleton className="lg:col-span-4 h-[450px] rounded-2xl" />
      </div>
    </div>
  );
}