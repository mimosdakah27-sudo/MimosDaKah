"use client";

import { useState } from "react";

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
import { useAuth } from "@/hooks/use-auth";

import { CheckoutLoginModal } from "../CheckoutLoginModal";
import { saveCheckoutDraft } from "@/lib/checkout-draft";

interface AddressStepProps {
  addressData: any;
  setAddressData: React.Dispatch<React.SetStateAction<any>>;
  customerData?: any;
  handleFetchCep: (cep: string) => void;
  onNext: () => void | Promise<void>;
  onBack: () => void;
}

export function AddressStep({
  addressData,
  setAddressData,
  customerData,
  handleFetchCep,
  onNext,
  onBack,
}: AddressStepProps) {
  const { user } = useAuth();

  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const isFormValid =
    Boolean(addressData?.zip_code) &&
    Boolean(addressData?.street) &&
    Boolean(
      addressData?.number ||
        addressData?.without_number
    ) &&
    Boolean(addressData?.city) &&
    Boolean(addressData?.state);

  /**
   * Continua sem salvar o endereço.
   *
   * Esse é o fluxo para usuário NÃO logado
   * que escolheu não salvar.
   */
  const continueWithoutLogin = () => {
    setLoginModalOpen(false);

    onNext();
  };

  /**
   * Salva os dados do checkout antes de mandar
   * o usuário para o login.
   *
   * Depois do login o CheckoutPage irá:
   *
   * 1. Restaurar o draft
   * 2. Identificar saveAddressAfterLogin
   * 3. Salvar o endereço
   * 4. Continuar normalmente
   */
  const handleLoginAndSave = () => {
    saveCheckoutDraft({
      step: "address",

      customerData: {
        id: customerData?.id || "",

        name: customerData?.name || "",

        phone: customerData?.phone || "",

        email: customerData?.email || "",

        document: customerData?.document || "",
      },

      addressData: {
        zip_code: addressData?.zip_code || "",

        street: addressData?.street || "",

        number: addressData?.number || "",

        without_number: Boolean(
          addressData?.without_number
        ),

        complement: addressData?.complement || "",

        reference: addressData?.reference || "",

        neighborhood:
          addressData?.neighborhood || "",

        city: addressData?.city || "",

        state: addressData?.state || "",
      },

      saveAddressAfterLogin: true,
    });

    const redirect = encodeURIComponent(
      "/checkout?step=address"
    );

    window.location.href =
      `/login?redirect=${redirect}`;
  };

  /**
   * Continuar no endereço.
   *
   * Usuário NÃO logado:
   * → pergunta se quer salvar.
   *
   * Usuário LOGADO:
   * → CheckoutPage decide se precisa
   *   salvar o endereço.
   */
  const handleNext = async () => {
    if (!isFormValid) {
      return;
    }

    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    await onNext();
  };

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>

              <div>
                <h3 className="font-semibold text-sm">
                  Endereço para frete
                </h3>

                <p className="text-xs text-muted-foreground">
                  Digite o endereço para calcularmos o valor do frete.
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
                <label className="text-xs font-medium text-muted-foreground">
                  CEP{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </label>

                <Input
                  placeholder="00000-000"
                  value={
                    addressData?.zip_code || ""
                  }
                  onChange={(e) => {
                    const masked =
                      maskCEP(
                        e.target.value
                      );

                    setAddressData(
                      (prev: any) => ({
                        ...prev,
                        zip_code: masked,
                      })
                    );

                    if (
                      masked.length === 9
                    ) {
                      handleFetchCep(
                        masked
                      );
                    }
                  }}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Rua / Logradouro{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </label>

                <Input
                  placeholder="Nome da rua"
                  value={
                    addressData?.street ||
                    ""
                  }
                  onChange={(e) =>
                    setAddressData(
                      (prev: any) => ({
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
                <label className="text-xs font-medium text-muted-foreground">
                  Número{" "}
                  {!addressData?.without_number && (
                    <span className="text-destructive">
                      *
                    </span>
                  )}
                </label>

                <Input
                  placeholder="Ex: 123"
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
                      (prev: any) => ({
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
                        (prev: any) => ({
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
                <label className="text-xs font-medium text-muted-foreground">
                  Bairro{" "}
                  <span className="text-xs text-muted-foreground/75 font-normal">
                    (Opcional)
                  </span>
                </label>

                <Input
                  placeholder="Bairro"
                  value={
                    addressData?.neighborhood ||
                    ""
                  }
                  onChange={(e) =>
                    setAddressData(
                      (prev: any) => ({
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
                <label className="text-xs font-medium text-muted-foreground">
                  Cidade / UF{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </label>

                <div className="flex gap-2">
                  <Input
                    placeholder="Cidade"
                    value={
                      addressData?.city ||
                      ""
                    }
                    onChange={(e) =>
                      setAddressData(
                        (prev: any) => ({
                          ...prev,
                          city:
                            e.target.value,
                        })
                      )
                    }
                  />

                  <Input
                    placeholder="UF"
                    className="w-16"
                    maxLength={2}
                    value={
                      addressData?.state ||
                      ""
                    }
                    onChange={(e) =>
                      setAddressData(
                        (prev: any) => ({
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
                <label className="text-xs font-medium text-muted-foreground">
                  Complemento{" "}
                  <span className="text-xs text-muted-foreground/75 font-normal">
                    (Opcional)
                  </span>
                </label>

                <Input
                  placeholder="Apto 102, Bloco B, Fundos"
                  value={
                    addressData?.complement ||
                    ""
                  }
                  onChange={(e) =>
                    setAddressData(
                      (prev: any) => ({
                        ...prev,
                        complement:
                          e.target.value,
                      })
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Ponto de Referência{" "}
                  <span className="text-xs text-muted-foreground/75 font-normal">
                    (Opcional)
                  </span>
                </label>

                <Input
                  placeholder="Próximo ao mercado X"
                  value={
                    addressData?.reference ||
                    ""
                  }
                  onChange={(e) =>
                    setAddressData(
                      (prev: any) => ({
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

          {/* Continuar */}
          <Button
            type="button"
            className="w-full gap-2 mt-4"
            disabled={!isFormValid}
            onClick={handleNext}
          >
            Continuar para o Frete

            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Modal */}
      <CheckoutLoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        title="Salvar este endereço?"
        description="Faça login ou crie sua conta e este endereço ficará salvo para facilitar seus próximos pedidos."
        saveLabel="Fazer login e salvar endereço"
        continueLabel="Continuar sem salvar"
        onLogin={handleLoginAndSave}
        onContinue={continueWithoutLogin}
      />
    </>
  );
}
