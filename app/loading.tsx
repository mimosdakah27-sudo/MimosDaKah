import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Carregando página" className="mx-auto max-w-6xl space-y-5 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
