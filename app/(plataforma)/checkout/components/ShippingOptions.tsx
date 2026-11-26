"use client";

import { AlertCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL } from "@/lib/utils";

export interface ShippingRate {
  id: string;
  price: number;
  delivery_time?: number;
}

interface ShippingOptionsProps {
  options: ShippingRate[];
  isLoading: boolean;
  onSelect: (rate: ShippingRate) => void;
  selectedId: string;
  onBackToAddress?: () => void;
  onRetry?: () => void;
  errorMessage?: string;
}

export function ShippingOptions({ options, isLoading, onSelect, selectedId, onBackToAddress, onRetry, errorMessage }: ShippingOptionsProps) {
  if (isLoading) {
    return <Skeleton role="status" aria-label="Calculando frete" className="h-14 rounded-xl" />;
  }
  if (!options.length) {
    return (
      <div className="space-y-2 rounded-xl border border-brand-control bg-brand-surface p-3 text-center">
        <AlertCircle className="mx-auto h-5 w-5 text-brand-action" />
        <p role="status" className="text-sm">{errorMessage || "Nenhuma opção de entrega disponível para este pedido e CEP."}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {onRetry && <Button type="button" size="sm" variant="outline" onClick={onRetry}>Tentar novamente</Button>}
          {onBackToAddress && <Button type="button" size="sm" variant="outline" onClick={onBackToAddress}>Corrigir endereço</Button>}
        </div>
      </div>
    );
  }

  return options.map((rate) => (
    <button
      key={rate.id} type="button" aria-pressed={selectedId === rate.id}
      className="flex w-full items-center gap-3 rounded-lg border p-4 text-left hover:border-primary/50 aria-pressed:border-primary aria-pressed:bg-primary/5"
      onClick={() => onSelect(rate)}
    >
      <Truck className="h-5 w-5 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">Entrega em outra cidade</p>
        <p className="text-sm text-muted-foreground">
          {rate.delivery_time != null
            ? `Prazo estimado de ${rate.delivery_time} ${rate.delivery_time === 1 ? "dia útil" : "dias úteis"}`
            : "Prazo a confirmar com a loja"}
        </p>
      </div>
      <strong>{rate.price === 0 ? "Grátis" : formatBRL(rate.price)}</strong>
    </button>
  ));
}
