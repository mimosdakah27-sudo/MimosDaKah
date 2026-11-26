"use client";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[75vh] max-w-lg content-center justify-items-center gap-5 px-6 text-center">
      <h1 className="page-title">Não foi possível carregar esta página</h1>
      <Button onClick={reset}>Tentar novamente</Button>
    </main>
  );
}
