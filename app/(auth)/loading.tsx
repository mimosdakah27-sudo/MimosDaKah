import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div role="status" aria-label="Carregando formulário" className="mx-auto w-full max-w-sm space-y-4 px-4 py-12">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
