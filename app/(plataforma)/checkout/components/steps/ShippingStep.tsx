"use client";

import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Package,
  Store,
  Truck,
  AlertCircle,
} from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

import { ShippingOptions } from "../ShippingOptions";

type ShippingType =
  | "pickup"
  | "local"
  | "other_city";

type SelectedShippingRate = {
  id: string;
  price: number;
  delivery_time?: number;
  type?: ShippingType;
};

type ShippingRate = {
  id: string;
  price: number;
  delivery_time?: number;
  [key: string]: any;
};

type StoreConfig = {
  zip_code?: string | null;
  city?: string | null;
  state?: string | null;
  allow_local_pickup?: boolean | null;
  allow_local_delivery?: boolean | null;
  fixed_delivery_fee?: number | null;
  local_delivery_price?: number | null;
  [key: string]: any;
};

type ShippingStepProps = {
  shippingRates?: ShippingRate[] | null;
  isLoadingShipping: boolean;

  selectedRate:
    | SelectedShippingRate
    | null;

  setSelectedRate: (
    rate:
      | SelectedShippingRate
      | null,
  ) => void;

  storeConfig?: StoreConfig | null;

  destinationZip: string;

  onNext: () => void;
  onBack: () => void;
};

const PICKUP_ID = "pickup";
const LOCAL_ID = "local";
const OTHER_CITY_ID = "other_city";

export function ShippingStep({
  shippingRates,
  isLoadingShipping,
  selectedRate,
  setSelectedRate,
  storeConfig,
  destinationZip,
  onNext,
  onBack,
}: ShippingStepProps) {
  const allowPickup = Boolean(storeConfig?.allow_local_pickup);
  const allowLocalDelivery = Boolean(storeConfig?.allow_local_delivery);

  const normalizedStoreZip =
    String(
      storeConfig?.zip_code || "",
    ).replace(/\D/g, "");

  const normalizedDestinationZip =
    String(
      destinationZip || "",
    ).replace(/\D/g, "");

  const isLocalZip =
    normalizedStoreZip.length === 8 &&
    normalizedDestinationZip.length ===
      8 &&
    normalizedStoreZip ===
      normalizedDestinationZip;

  const pickupOption =
    useMemo<SelectedShippingRate>(
      () => ({
        id: PICKUP_ID,
        price: 0,
        type: "pickup",
      }),
      [],
    );

  const localDeliveryOption =
    useMemo<SelectedShippingRate>(
      () => ({
        id: LOCAL_ID,
        price: Number(
          storeConfig?.fixed_delivery_fee ??
          storeConfig?.local_delivery_price ??
          0,
        ),
        type: "local",
      }),
      [
        storeConfig?.fixed_delivery_fee,
        storeConfig?.local_delivery_price,
      ],
    );

  /**
   * Seleciona retirada.
   */
  const handlePickupSelect =
    () => {
      setSelectedRate(
        pickupOption,
      );
    };

  /**
   * Seleciona entrega própria.
   */
  const handleLocalDeliverySelect =
    () => {
      setSelectedRate(
        localDeliveryOption,
      );
    };

  /**
   * Seleciona uma cotação do Melhor Envio.
   */
  const handleCalculatedShippingSelect =
    (
      rate: ShippingRate,
    ) => {
      setSelectedRate({
        ...rate,

        id: String(rate.id),

        price: Number(
          Number(
            rate.price || 0,
          ).toFixed(2),
        ),

        type: OTHER_CITY_ID,
      });
    };

  const selectedCalculatedId =
    selectedRate?.type ===
    OTHER_CITY_ID
      ? selectedRate.id
      : "";

  const canContinue =
    Boolean(selectedRate);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />

            Forma de entrega
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* RETIRADA */}
          {allowPickup && (
            <button
              type="button"
              onClick={
                handlePickupSelect
              }
              className={`w-full text-left border rounded-lg p-4 transition-colors cursor-pointer ${
                selectedRate?.type ===
                "pickup"
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <Store className="w-5 h-5 mt-0.5" />

                <div className="flex-1">
                  <p className="font-semibold">
                    Retirada na Loja
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Retire seu pedido
                    diretamente na loja.
                  </p>
                </div>

                <strong>
                  Grátis
                </strong>
              </div>
            </button>
          )}

          {/* ENTREGA LOCAL */}
          {allowLocalDelivery && isLocalZip && (
            <button
              type="button"
              onClick={
                handleLocalDeliverySelect
              }
              className={`w-full text-left border rounded-lg p-4 transition-colors cursor-pointer ${
                selectedRate?.type ===
                "local"
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5" />

                <div className="flex-1">
                  <p className="font-semibold">
                    Entrega Própria
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Entrega realizada
                    pela loja.
                  </p>
                </div>

                <strong>
                  {formatBRL(
                    localDeliveryOption.price,
                  )}
                </strong>
              </div>
            </button>
          )}

          {/* FRETES EXTERNOS (Se não for CEP local ou se entrega própria estiver desativada para CEP local) */}
          {(!isLocalZip || !allowLocalDelivery) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />

                <p className="font-semibold text-sm">
                  Fretes disponíveis
                </p>
              </div>

              <ShippingOptions
                options={
                  shippingRates || []
                }
                isLoading={
                  isLoadingShipping
                }
                selectedId={
                  selectedCalculatedId
                }
                onSelect={
                  handleCalculatedShippingSelect
                }
              />
            </div>
          )}

          {!allowPickup && !allowLocalDelivery && !shippingRates?.length && !isLoadingShipping && (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 border border-dashed rounded-lg">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
              <p className="font-medium text-sm text-foreground">Nenhuma opção de entrega disponível</p>
              <p className="text-xs text-muted-foreground">A loja não possui retirada ou entrega local habilitadas e não há fretes externos disponíveis para este endereço.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />

          Voltar
        </Button>

        <Button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="flex-1 gap-2"
        >
          Continuar

          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}