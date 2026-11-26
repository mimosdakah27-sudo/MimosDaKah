"use client";

import Link from "next/link";
import CheckoutLoading from "./loading";
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
    receiptHref,
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
    subtotal,
    shippingPrice,
    total,
    isGuest, canVisitStep, isLookingUpCep, cepMessage, isSavingAddress, shippingError, retryShipping,
    handleAddressNext,
    handleFinalizeOrder,
  } = useCheckout();

  if (receiptHref) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-4 text-center">
          <h1 className="page-title">Pedido registrado</h1>
          <a href={receiptHref} className="font-semibold text-brand-action underline">Continuar para o WhatsApp</a>
        </CardContent>
      </Card>
    );
  }

  if (!isMounted) {
    return <CheckoutLoading />;
  }

  if (!items.length) {
    if (isSubmitting) return <CheckoutLoading />;
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-6 space-y-3">
          <h1 className="page-title">Seu pedido está vazio</h1>
          <p className="text-sm text-muted-foreground">Escolha um produto no catálogo para começar.</p>
          <Link href="/" className="text-sm font-medium text-primary underline">Ver catálogo</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {!isSubmitting && <BackButton />}

      <div className="flex flex-col gap-3">
        <div>
          <h1 className="page-title">
            Fazer pedido
          </h1>

          <p className="text-xs text-muted-foreground">
            Informe seus dados e revise a entrega antes de confirmar.
          </p>
        </div>

        <nav aria-label="Etapas do pedido" className="grid max-w-full grid-cols-4 gap-1 rounded-xl border bg-brand-surface p-1">
          {([["customer", "Contato"], ["address", "Endereço"], ["shipping", "Frete"], ["review", "Revisão"]] as const).map(([key, label], index) => (
            <button key={key} type="button" onClick={() => changeStep(key)}
              disabled={!canVisitStep(key) || isSubmitting} aria-current={step === key ? "step" : undefined}
              className="min-h-10 rounded-lg px-1.5 text-xs font-medium text-brand-muted hover:bg-brand-tint focus-visible:outline-brand-action disabled:opacity-60 aria-[current=step]:bg-primary aria-[current=step]:text-primary-foreground sm:px-3">
              {index + 1}. {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 space-y-4">
          {step === "customer" && (
            <CustomerStep
              customerData={customerData}
              setCustomerData={setCustomerData}
              isGuest={isGuest}
              onNext={() => changeStep("address")}
            />
          )}

          {step === "address" && (
            <AddressStep
              addressData={addressData}
              setAddressData={setAddressData}
              isGuest={isGuest} isLookingUpCep={isLookingUpCep} cepMessage={cepMessage} isSavingAddress={isSavingAddress}
              onNext={handleAddressNext}
              onBack={() => changeStep("customer")}
            />
          )}

          {step === "shipping" && (
            <ShippingStep
              shippingRates={shippingRates}
              isLoadingShipping={isLoadingShipping}
              shippingError={shippingError} retryShipping={retryShipping}
              pickupAllowed={items.every(({ product }) => product.permite_retirada !== false)}
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
                size="lg" className="flow-action"
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
                    Confirmar e abrir WhatsApp
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
            subtotal={subtotal}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
