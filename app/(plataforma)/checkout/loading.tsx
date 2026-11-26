import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div role="status" aria-label="Carregando pedido" className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-8 w-full" />
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-72 lg:col-span-7" />
        <Skeleton className="h-44 lg:col-span-5" />
      </div>
    </div>
  );
}
