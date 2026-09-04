"use client";

import {
  AlertCircle,
  ArrowLeft,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

import {
  cn,
  formatBRL,
} from "@/lib/utils";

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
}

export function ShippingOptions({
  options,
  isLoading,
  onSelect,
  selectedId,
  onBackToAddress,
}: ShippingOptionsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-14 animate-pulse rounded-xl border border-border/60 bg-secondary/40 p-2.5" />
      </div>
    );
  }

  const validOptions = Array.isArray(options)
    ? options.filter(
        (option) =>
          option?.id &&
          option?.price !== undefined &&
          option?.price !== null,
      )
    : [];

  if (validOptions.length === 0) {
    return (
      <div className="space-y-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-center">
        <AlertCircle className="mx-auto h-5 w-5 text-amber-600" />

        <div className="space-y-0.5">
          <p className="text-xs font-bold text-foreground">
            Entrega indisponível
          </p>

          <p className="text-[10px] text-muted-foreground leading-tight">
            Não foi possível calcular o valor da
            entrega para o CEP informado.
          </p>
        </div>

        {onBackToAddress && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBackToAddress}
            className="gap-1.5 h-7 text-[11px] rounded-lg border-amber-500/30 hover:bg-amber-500/10"
          >
            <ArrowLeft className="h-3 w-3" />
            Corrigir CEP / Endereço
          </Button>
        )}
      </div>
    );
  }

  const rate = validOptions[0];

  const rateId = String(rate.id);
  const price = Number(rate.price) || 0;

  const isSelected =
    selectedId === rateId;

  const handleSelect = () => {
    onSelect(rate);
  };

  return (
    <RadioGroup
      value={selectedId}
      onValueChange={handleSelect}
      className="grid gap-2 w-full"
    >
      <div
        className={cn(
          "relative flex cursor-pointer items-center justify-between rounded-xl border-2 bg-card p-2.5 transition-all w-full min-w-0 overflow-hidden",
          isSelected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border/60 hover:border-primary/40 hover:bg-secondary/40",
        )}
        onClick={handleSelect}
      >
        <RadioGroupItem
          value={rateId}
          id={`frete-calculado-${rateId}`}
          className="sr-only"
        />

        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              isSelected
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Truck className="h-4 w-4" />
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">
              Entrega em outra cidade
            </p>

            <p className="text-[10px] font-medium text-muted-foreground truncate">
              Valor calculado para o endereço
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span
            className={cn(
              "text-xs font-extrabold whitespace-nowrap",
              price === 0
                ? "rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-600"
                : "text-foreground",
            )}
          >
            {price === 0
              ? "Grátis"
              : formatBRL(price)}
          </span>
        </div>
      </div>
    </RadioGroup>
  );
}