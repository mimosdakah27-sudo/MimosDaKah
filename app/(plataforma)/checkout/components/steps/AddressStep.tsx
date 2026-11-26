"use client";

import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import {
  MapPin,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";

import { maskCEP } from "@/lib/utils";
import type { CheckoutAddressDraft } from "@/lib/checkout-draft";
import { updateCheckoutDraft } from "@/lib/checkout-draft";
import { hasCheckoutAddress } from "../../checkout-values";

interface AddressStepProps {
  addressData: CheckoutAddressDraft;
  setAddressData: Dispatch<SetStateAction<CheckoutAddressDraft>>;
  isGuest: boolean;
  isLookingUpCep: boolean;
  cepMessage: string;
  isSavingAddress: boolean;
  onNext: () => void;
  onBack: () => void;
}

export function AddressStep({
  addressData, setAddressData, isGuest, isLookingUpCep, cepMessage, isSavingAddress, onNext, onBack,
}: AddressStepProps) {
  const isFormValid = hasCheckoutAddress(addressData);

  return (
    <>
      <Card>
        <CardContent className="space-y-4">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>

              <div>
                <h3 className="font-semibold text-base">
                  Endereço de entrega
                </h3>

                <p className="text-xs text-muted-foreground">
                  Informe o endereço para receber este pedido.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" />
              Voltar
            </button>
          </div>

          <div className="space-y-4">
            {/* CEP e Rua */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="order-zip" className="text-sm font-medium text-foreground">
                  CEP{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </label>

                <Input
                  id="order-zip" autoComplete="postal-code" inputMode="numeric"
                  placeholder="00000-000"
                  value={
                    addressData?.zip_code || ""
                  }
                  onChange={(e) => {
                    const masked =
                      maskCEP(
                        e.target.value
                      );

                    if (masked !== addressData.zip_code) {
                      setAddressData({
                        zip_code: masked, street: "", number: "", without_number: false,
                        complement: "", reference: "", neighborhood: "", city: "", state: "",
                      });
                    }
                  }}
                />
                <p role="status" className="text-xs text-muted-foreground">{isLookingUpCep ? "Buscando endereço…" : cepMessage}</p>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label htmlFor="order-street" className="text-sm font-medium text-foreground">
                  Rua / Logradouro{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </label>

                <Input
                  id="order-street" placeholder="Nome da rua"
                  value={
                    addressData?.street ||
                    ""
                  }
                  onChange={(e) =>
                    setAddressData(
                      (prev) => ({
                        ...prev,
                        street:
                          e.target.value,
                      })
                    )
                  }
                />
              </div>
            </div>

            {/* Número */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="space-y-2">
                <label htmlFor="order-number" className="text-sm font-medium text-foreground">
                  Número{" "}
                  {!addressData?.without_number && (
                    <span className="text-destructive">
                      *
                    </span>
                  )}
                </label>

                <Input
                  id="order-number" placeholder="Ex: 123"
                  disabled={
                    addressData?.without_number
                  }
                  value={
                    addressData?.without_number
                      ? ""
                      : addressData?.number ||
                        ""
                  }
                  onChange={(e) =>
                    setAddressData(
                      (prev) => ({
                        ...prev,
                        number:
                          e.target.value,
                      })
                    )
                  }
                />

                <div className="flex items-center space-x-2 pt-1.5">
                  <Switch
                    id="without-number"
                    checked={
                      addressData?.without_number ||
                      false
                    }
                    onCheckedChange={(
                      checked
                    ) =>
                      setAddressData(
                        (prev) => ({
                          ...prev,
                          without_number:
                            checked,
                          number:
                            checked
                              ? ""
                              : prev.number,
                        })
                      )
                    }
                  />

                  <Label
                    htmlFor="without-number"
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Endereço sem número
                  </Label>
                </div>
              </div>

              {/* Bairro */}
              <div className="space-y-2">
                <label htmlFor="order-neighborhood" className="text-sm font-medium text-foreground">
                  Bairro{" "}
                  <span className="text-xs text-muted-foreground/75 font-normal">
                    (Opcional)
                  </span>
                </label>

                <Input
                  id="order-neighborhood" placeholder="Bairro"
                  value={
                    addressData?.neighborhood ||
                    ""
                  }
                  onChange={(e) =>
                    setAddressData(
                      (prev) => ({
                        ...prev,
                        neighborhood:
                          e.target.value,
                      })
                    )
                  }
                />
              </div>

              {/* Cidade / UF */}
              <div className="space-y-2">
                <label htmlFor="order-city" className="text-sm font-medium text-foreground">
                  Cidade / UF{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </label>

                <div className="flex gap-2">
                  <Input
                    id="order-city" placeholder="Cidade"
                    value={
                      addressData?.city ||
                      ""
                    }
                    onChange={(e) =>
                      setAddressData(
                        (prev) => ({
                          ...prev,
                          city:
                            e.target.value,
                        })
                      )
                    }
                  />

                  <Input
                    aria-label="UF" placeholder="UF"
                    className="w-16"
                    maxLength={2}
                    value={
                      addressData?.state ||
                      ""
                    }
                    onChange={(e) =>
                      setAddressData(
                        (prev) => ({
                          ...prev,
                          state:
                            e.target.value.toUpperCase(),
                        })
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* Complemento e Referência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <label htmlFor="order-complement" className="text-sm font-medium text-foreground">
                  Complemento{" "}
                  <span className="text-xs text-muted-foreground/75 font-normal">
                    (Opcional)
                  </span>
                </label>

                <Input
                  id="order-complement" placeholder="Apto 102, Bloco B, Fundos"
                  value={
                    addressData?.complement ||
                    ""
                  }
                  onChange={(e) =>
                    setAddressData(
                      (prev) => ({
                        ...prev,
                        complement:
                          e.target.value,
                      })
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="order-reference" className="text-sm font-medium text-foreground">
                  Ponto de Referência{" "}
                  <span className="text-xs text-muted-foreground/75 font-normal">
                    (Opcional)
                  </span>
                </label>

                <Input
                  id="order-reference" placeholder="Próximo ao mercado X"
                  value={
                    addressData?.reference ||
                    ""
                  }
                  onChange={(e) =>
                    setAddressData(
                      (prev) => ({
                        ...prev,
                        reference:
                          e.target.value,
                      })
                    )
                  }
                />
              </div>
            </div>
          </div>

          {isGuest && isFormValid && (
            <Link
              href="/login?redirect=%2Fcheckout%3Fstep%3Daddress"
              onClick={() => updateCheckoutDraft({ saveAddressAfterLogin: true })}
              className="text-xs text-primary underline"
            >
              Entrar e salvar este endereço na minha conta
            </Link>
          )}

          <Button
            type="button"
            className="flow-action mt-4" size="lg"
            disabled={!isFormValid || isSavingAddress}
            onClick={onNext}
          >
            {isSavingAddress ? "Salvando endereço…" : "Continuar para o Frete"}

            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

    </>
  );
}
