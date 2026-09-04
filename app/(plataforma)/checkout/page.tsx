"use client";

import { Edit2, MessageCircle, Loader2 } from "lucide-react";

import { BackButton } from "@/components/site/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

import { OrderSummary } from "./components/OrderSummary";
import { AddressStep } from "./components/steps/AddressStep";
import { CustomerStep } from "./components/steps/CustomerStep";
import { ShippingStep } from "./components/steps/ShippingStep";
import { useCheckout } from "./hooks/use-checkout";

export default function CheckoutPage() {
  const {
    isMounted,
    isSubmitting,
    step,
    changeStep,
    customerData,
    setCustomerData,
    addressData,
    setAddressData,
    selectedRate,
    setSelectedRate,
    shippingRates,
    isLoadingShipping,
    storeConfig,
    items,
    shippingPrice,
    total,
    handleFetchCep,
    handleAddressNext,
    handleFinalizeOrder,
  } = useCheckout();

  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <BackButton />

      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Checkout
          </h1>

          <p className="text-xs text-muted-foreground">
            Preencha seus dados para finalizar o pedido
          </p>
        </div>

        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border text-[11px] font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => changeStep("customer")}
            className={`px-2 py-1 rounded cursor-pointer transition-colors whitespace-nowrap ${
              step === "customer"
                ? "bg-background shadow-xs font-bold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            1. Contato
          </button>

          <button
            type="button"
            onClick={() => changeStep("address")}
            className={`px-2 py-1 rounded cursor-pointer transition-colors whitespace-nowrap ${
              step === "address"
                ? "bg-background shadow-xs font-bold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            2. Endereço
          </button>

          <button
            type="button"
            onClick={() => changeStep("shipping")}
            className={`px-2 py-1 rounded cursor-pointer transition-colors whitespace-nowrap ${
              step === "shipping"
                ? "bg-background shadow-xs font-bold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            3. Frete
          </button>

          <button
            type="button"
            onClick={() => changeStep("review")}
            className={`px-2 py-1 rounded cursor-pointer transition-colors whitespace-nowrap ${
              step === "review"
                ? "bg-background shadow-xs font-bold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            4. Revisão
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 space-y-4">
          {step === "customer" && (
            <CustomerStep
              customerData={customerData}
              setCustomerData={setCustomerData}
              addressData={addressData}
              onNext={() => changeStep("address")}
            />
          )}

          {step === "address" && (
            <AddressStep
              addressData={addressData}
              setAddressData={setAddressData}
              customerData={customerData}
              handleFetchCep={handleFetchCep}
              onNext={handleAddressNext}
              onBack={() => changeStep("customer")}
            />
          )}

          {step === "shipping" && (
            <ShippingStep
              shippingRates={shippingRates}
              isLoadingShipping={isLoadingShipping}
              selectedRate={selectedRate}
              setSelectedRate={setSelectedRate}
              storeConfig={storeConfig}
              destinationZip={addressData.zip_code}
              onNext={() => changeStep("review")}
              onBack={() => changeStep("address")}
            />
          )}

          {step === "review" && (
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs">Resumo dos Dados</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg relative">
                    <button
                      type="button"
                      onClick={() => changeStep("customer")}
                      className="absolute top-2.5 right-2.5 text-[11px] text-primary hover:underline flex items-center gap-1 bg-background px-2 py-0.5 rounded border shadow-2xs"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>

                    <div>
                      <p className="font-semibold text-foreground">Contato:</p>
                      <p>{customerData.name}</p>
                      <p>{customerData.phone}</p>
                      {customerData.email && <p>{customerData.email}</p>}
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">Endereço:</p>
                      <p>
                        {addressData.street},{" "}
                        {addressData.without_number
                          ? "S/N"
                          : `nº ${addressData.number}`}
                      </p>
                      {addressData.complement && (
                        <p>Complemento: {addressData.complement}</p>
                      )}
                      {addressData.neighborhood && (
                        <p>Bairro: {addressData.neighborhood}</p>
                      )}
                      <p>
                        {addressData.city} - {addressData.state} | CEP:{" "}
                        {addressData.zip_code}
                      </p>
                      {addressData.reference && (
                        <p>Ref: {addressData.reference}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground border-t pt-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                    <span>
                      Entrega:{" "}
                      <strong className="text-foreground">
                        {selectedRate?.type === "pickup"
                          ? "Retirada na Loja"
                          : selectedRate?.type === "local"
                            ? "Entrega Própria"
                            : selectedRate?.type === "other_city"
                              ? "Envio para Outra Cidade"
                              : "Frete Calculado"}
                      </strong>
                    </span>

                    <span>
                      Frete:{" "}
                      <strong className="text-foreground">
                        {formatBRL(shippingPrice)}
                      </strong>
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeStep("address")}
                      className="flex-1 h-8 text-xs"
                    >
                      Alterar Endereço
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeStep("shipping")}
                      className="flex-1 h-8 text-xs"
                    >
                      Alterar Entrega
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full h-9 text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                disabled={isSubmitting}
                onClick={handleFinalizeOrder}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando pedido...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Confirmar e Finalizar Pedido
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-4">
          <OrderSummary
            items={items}
            shipping={selectedRate}
            total={total}
            onRemoveItem={() => {}}
          />
        </div>
      </div>
    </div>
  );
}