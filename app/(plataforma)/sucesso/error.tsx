"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ReceiptError({ reset }: { reset: () => void }) {
  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="space-y-3 p-6 text-center">
        <h1 className="font-semibold">Não foi possível carregar o recibo</h1>
        <p className="text-sm text-muted-foreground">Tente consultar este pedido novamente.</p>
        <Button onClick={reset}>Tentar novamente</Button>
        <Link href="/" className="block text-sm text-primary underline">Voltar ao catálogo</Link>
      </CardContent>
    </Card>
  );
}
