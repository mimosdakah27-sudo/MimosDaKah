"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  User,
  ArrowRight,
  LogIn,
} from "lucide-react";

import { maskPhone } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

import { CheckoutLoginModal } from "../CheckoutLoginModal";
import { saveCheckoutDraft } from "@/lib/checkout-draft";

interface CustomerStepProps {
  customerData: any;
  setCustomerData: React.Dispatch<
    React.SetStateAction<any>
  >;
  addressData?: any;
  onNext: () => void;
}

export function CustomerStep({
  customerData,
  setCustomerData,
  addressData,
  onNext,
}: CustomerStepProps) {
  const {
    profile,
    user,
    loading: authLoading,
  } = useAuth();

  const [
    showLoginCard,
    setShowLoginCard,
  ] = useState(true);

  const [
    loginModalOpen,
    setLoginModalOpen,
  ] = useState(false);

  /**
   * =========================================================
   * SINCRONIZAÇÃO COM A CONTA
   * =========================================================
   *
   * Existem dois cenários:
   *
   * 1. Usuário já estava autenticado:
   *    os dados da conta preenchem apenas campos vazios.
   *
   * 2. Usuário acabou de voltar do login:
   *    os dados da conta autenticada têm prioridade
   *    sobre os dados antigos que estavam no checkout.
   *
   * Isso evita o problema:
   *
   * Sessão 1:
   * Gabriel / telefone antigo
   *
   * Sessão 2:
   * login como Samara
   *
   * Resultado esperado:
   * Samara / telefone da conta
   */

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const draftWasCreatedBeforeLogin =
      typeof window !== "undefined" &&
      sessionStorage.getItem("checkout_draft") !== null;

    /**
     * Se o usuário acabou de voltar do login,
     * os dados da conta devem substituir
     * os dados antigos do checkout.
     *
     * O ID do usuário é a principal referência
     * para identificar essa mudança de conta.
     */
    const accountUserId = user.id || "";

    const isDifferentAuthenticatedUser =
      Boolean(
        customerData?.id &&
        accountUserId &&
        customerData.id !== accountUserId
      );

    if (
      isDifferentAuthenticatedUser ||
      draftWasCreatedBeforeLogin
    ) {
      setCustomerData((previous: any) => ({
        ...previous,

        id: accountUserId,

        name:
          profile?.display_name ||
          user.user_metadata?.display_name ||
          previous?.name ||
          "",

        phone:
          profile?.phone ||
          user.user_metadata?.phone ||
          previous?.phone ||
          "",

        email:
          profile?.email ||
          user.email ||
          previous?.email ||
          "",
      }));

      return;
    }

    /**
     * Usuário já autenticado normalmente.
     *
     * Nesse caso não apagamos o que ele já
     * preencheu manualmente.
     */
    setCustomerData((previous: any) => {
      const next = {
        ...previous,

        id:
          previous?.id ||
          accountUserId,

        name:
          previous?.name ||
          profile?.display_name ||
          user.user_metadata?.display_name ||
          "",

        phone:
          previous?.phone ||
          profile?.phone ||
          user.user_metadata?.phone ||
          "",

        email:
          previous?.email ||
          profile?.email ||
          user.email ||
          "",
      };

      if (
        next.id === previous?.id &&
        next.name === previous?.name &&
        next.phone === previous?.phone &&
        next.email === previous?.email
      ) {
        return previous;
      }

      return next;
    });
  }, [
    authLoading,
    user,
    profile,
    customerData?.id,
    setCustomerData,
  ]);

  /**
   * =========================================================
   * LOGIN
   * =========================================================
   */

  const handleLogin = () => {
    saveCheckoutDraft({
      step: "customer",

      customerData: {
        id:
          customerData?.id || "",

        name:
          customerData?.name || "",

        phone:
          customerData?.phone || "",

        email:
          customerData?.email || "",

        document:
          customerData?.document || "",
      },

      addressData: {
        zip_code:
          addressData?.zip_code || "",

        street:
          addressData?.street || "",

        number:
          addressData?.number || "",

        without_number:
          Boolean(
            addressData?.without_number
          ),

        complement:
          addressData?.complement || "",

        reference:
          addressData?.reference || "",

        neighborhood:
          addressData?.neighborhood || "",

        city:
          addressData?.city || "",

        state:
          addressData?.state || "",
      },

      /**
       * Neste ponto o login serve somente
       * para salvar os dados pessoais.
       *
       * O endereço continua sendo tratado
       * separadamente na etapa de endereço.
       */
      saveAddressAfterLogin: false,
    });

    const redirect = encodeURIComponent(
      "/checkout?step=customer"
    );

    window.location.href =
      `/login?redirect=${redirect}`;
  };

  /**
   * Continua sem fazer login.
   */
  const handleContinue = () => {
    setShowLoginCard(false);
    setLoginModalOpen(false);
  };

  /**
   * Continua para o endereço.
   */
  const handleNext = () => {
    setShowLoginCard(false);
    onNext();
  };

  const isAuthenticated =
    Boolean(user);

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Cabeçalho */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>

            <div>
              <h3 className="font-semibold text-sm">
                Identificação
              </h3>

              <p className="text-xs text-muted-foreground">
                Informe seu nome e telefone para contato
              </p>
            </div>
          </div>

          {/* Card de login */}
          {!isAuthenticated &&
            showLoginCard && (
              <div className="rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <LogIn className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      Já possui uma conta?
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Faça login para salvar seus dados.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLoginModalOpen(true)
                    }
                  >
                    Saiba mais
                  </Button>
                </div>
              </div>
            )}

          {/* Dados do cliente */}
          <div className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Nome Completo{" "}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <Input
                placeholder="Ex: Maria Silva"
                value={
                  customerData?.name || ""
                }
                onChange={(e) =>
                  setCustomerData(
                    (prev: any) => ({
                      ...prev,
                      name: e.target.value,
                    })
                  )
                }
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Telefone / WhatsApp{" "}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <Input
                placeholder="(00) 00000-0000"
                value={
                  customerData?.phone || ""
                }
                onChange={(e) => {
                  const masked =
                    maskPhone(
                      e.target.value
                    );

                  setCustomerData(
                    (prev: any) => ({
                      ...prev,
                      phone: masked,
                    })
                  );
                }}
              />
            </div>
          </div>

          {/* Continuar */}
          <Button
            type="button"
            className="w-full gap-2"
            disabled={
              !customerData?.name?.trim() ||
              !customerData?.phone?.trim()
            }
            onClick={handleNext}
          >
            Continuar para Endereço

            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Modal de login */}
      <CheckoutLoginModal
        open={loginModalOpen}
        onOpenChange={
          setLoginModalOpen
        }
        title="Salve seus dados"
        description="Faça login ou crie sua conta para não precisar preencher seus dados novamente nos próximos pedidos."
        saveLabel="Fazer login e salvar"
        continueLabel="Continuar sem login"
        onLogin={handleLogin}
        onContinue={
          handleContinue
        }
      />
    </>
  );
}

