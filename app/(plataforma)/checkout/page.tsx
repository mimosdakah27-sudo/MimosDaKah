"use client";

import { Card, CardContent } from "@/components/ui/card";
import { isLocalZip, maskCPF } from "@/lib/utils";
import {
  AlertCircle,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BackButton } from "@/components/site/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
import { createCheckoutSession } from "@/lib/actions/checkout";
import { useCart } from "@/lib/store/cart";

import { useAddress } from "../endereco/hooks/use-address";
import { AddressCard } from "./components/AddressCard";
import { OrderSummary } from "./components/OrderSummary";
import { ShippingCard } from "./components/ShippingCard";
import { ShippingOptions } from "./components/ShippingOptions";
import { useCheckout } from "./hooks/use-checkout";
import { useShipping } from "./hooks/use-shipping";

export default function CheckoutPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  /**
   * Se veio de um orçamento,
   * mantemos somente o ID.
   *
   * Os produtos NÃO são buscados novamente
   * no banco.
   *
   * Os produtos vêm exclusivamente do Zustand.
   */
  const existingOrderId = searchParams.get("order_id");

  const [step, setStep] = useState<"shipping" | "review">("shipping");

  const [selectedRate, setSelectedRate] = useState<any>(null);

  const [isStripeLoading, setIsStripeLoading] = useState(false);

  /**
   * Evita problemas de hidratação
   * do Zustand persist.
   */
  const [isMounted, setIsMounted] = useState(false);

  const { user } = useAuth();

  const { addresses, activateAddress, isPending } = useAddress(user?.id || "");

  const { form } = useCheckout();

  const { config } = useStore();

  /**
   * ÚNICA fonte de verdade dos produtos.
   */
  const cartItems = useCart((state) => state.items);

  const removeFromCart = useCart((state) => state.remove);

  /**
   * Hidratação do Zustand.
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * --------------------------------------------------
   * ITENS DO CHECKOUT
   * --------------------------------------------------
   *
   * Tanto compra normal quanto orçamento
   * utilizam exatamente a mesma fonte:
   *
   * Zustand -> cartItems
   */
  const items = useMemo(() => {
    return cartItems.map((item: any) => {
      const product = item?.product || {};

      return {
        quantity: Number(item.quantity) || 1,

        product: {
          ...product,

          id: String(product.id),

          nome: product.nome || product.name || "Produto",

          preco: Number(product.preco) || 0,

          imagem_url: product.imagem_url,

          /**
           * Normaliza a variante.
           */
          variant_id: product.variant_id || undefined,

          name: product.name || null,

          tamanho: product.tamanho || null,

          material: product.material || null,

          /**
           * Dados logísticos.
           */
          weight: Number(product.weight) || 0.3,

          width: Number(product.width) || 10,

          height: Number(product.height) || 10,

          length: Number(product.length) || 10,
        },
      };
    });
  }, [cartItems]);

  /**
   * Se o carrinho estiver vazio,
   * volta para a página anterior.
   */
  useEffect(() => {
    if (isMounted && items.length === 0) {
      router.back();
    }
  }, [isMounted, items.length, router]);

  /**
   * Subtotal dos produtos.
   */
  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item.product?.preco || 0) * Number(item.quantity || 1),
      0,
    );
  }, [items]);

  /**
   * Endereço ativo.
   */
  const activeAddress = useMemo(
    () => addresses?.find((address: any) => address.active),
    [addresses],
  );

  const hasNoAddress = !addresses || addresses.length === 0;

  /**
   * Verifica se o CEP é local.
   */
  const isLocal = useMemo(() => {
    if (!activeAddress?.zip_code || !config?.zip_code) {
      return false;
    }

    return isLocalZip(activeAddress.zip_code, config.zip_code);
  }, [activeAddress?.zip_code, config?.zip_code]);

  /**
   * Preenche o formulário
   * quando o endereço ativo muda.
   */
  useEffect(() => {
    if (!activeAddress) {
      return;
    }

    form.setValue("zip", activeAddress.zip_code, {
      shouldValidate: true,
    });

    form.setValue("address", activeAddress.street, {
      shouldValidate: true,
    });

    form.setValue("city", activeAddress.city, {
      shouldValidate: true,
    });
  }, [
    activeAddress?.id,
    activeAddress?.zip_code,
    activeAddress?.street,
    activeAddress?.city,
  ]);

  /**
   * Opções de frete.
   *
   * Recebe somente os itens atuais
   * do carrinho.
   */
  const { data: shippingRates, isLoading } = useShipping(
    config?.zip_code,
    activeAddress?.zip_code,
    items,
  );

  /**
   * Opções de entrega local.
   */
  const localOptions = useMemo(() => {
    if (!isLocal) {
      return [];
    }

    const options: {
      id: string;
      name: string;
      price: number;
      delivery_time: string;
      type: "pickup" | "local_delivery";
    }[] = [];

    if (config?.allow_local_pickup) {
      options.push({
        id: "pickup",
        name: "Retirada na Loja",
        price: 0,
        delivery_time: "Imediato",
        type: "pickup",
      });
    }

    if (config?.allow_local_delivery) {
      options.push({
        id: "local",
        name: "Entrega Própria",
        price: config.local_delivery_fee || 18,
        delivery_time: "1 dia útil",
        type: "local_delivery",
      });
    }

    return options;
  }, [
    isLocal,
    config?.allow_local_pickup,
    config?.allow_local_delivery,
    config?.local_delivery_fee,
  ]);

  /**
   * Total.
   */
  const total = useMemo(
    () => Number(subtotal) + (Number(selectedRate?.price) || 0),
    [subtotal, selectedRate?.price],
  );

  /**
   * Verifica se o envio está completo.
   */
  const isShippingComplete =
    !hasNoAddress && Boolean(selectedRate) && form.formState.isValid;

  /**
   * O próprio step representa
   * se estamos na revisão.
   */
  const canOpenReview = isShippingComplete || step === "review";

  /**
   * Navegação das abas.
   */
  const handleTabClick = (targetStep: "shipping" | "review") => {
    if (targetStep === "shipping") {
      setStep("shipping");
      return;
    }

    if (targetStep === "review" && canOpenReview) {
      setStep("review");
    }
  };

  /**
   * Remove diretamente do Zustand.
   */
  const handleRemoveItem = (productId: string, variantId?: string) => {
    removeFromCart(productId, variantId);
  };

  /**
   * Evita renderizar antes
   * da hidratação do Zustand.
   */
  if (!isMounted) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto w-full">
      <BackButton />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {step === "shipping" ? "Checkout Seguro" : "Revisão e Pagamento"}
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            {step === "shipping"
              ? "Confirme seu endereço e escolha a forma de envio"
              : "Confira os dados antes de finalizar seu pedido"}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border self-start md:self-auto">
          <button
            type="button"
            onClick={() => handleTabClick("shipping")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              step === "shipping"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px]">
              1
            </span>

            <span>Entrega</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick("review")}
            disabled={!canOpenReview}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              step === "review"
                ? "bg-background text-foreground shadow-sm"
                : canOpenReview
                  ? "text-muted-foreground hover:text-foreground cursor-pointer"
                  : "text-muted-foreground/40 cursor-not-allowed"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px]">
              2
            </span>

            <span>Revisão</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
          {step === "shipping" ? (
            <div className="space-y-6">
              {hasNoAddress ? (
                <Card className="border-dashed border-2">
                  <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <AlertCircle className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-semibold text-base">
                        Nenhum endereço cadastrado
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        Você precisa cadastrar um endereço de entrega para
                        prosseguir.
                      </p>
                    </div>

                    <Button
                      render={
                        <Link href="/endereco">
                          <Plus className="mr-2 w-4 h-4" />
                          Cadastrar Endereço
                        </Link>
                      }
                      className="rounded-md px-6"
                    />
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Endereço de Destino
                    </h3>

                    <AddressCard
                      address={activeAddress}
                      addresses={addresses}
                      onSelect={(id: string) => activateAddress(id)}
                      onActivate={activateAddress}
                      isPending={isPending}
                    />
                  </div>

                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-sm">
                            Dados para Nota Fiscal
                          </h3>

                          <p className="text-xs text-muted-foreground">
                            Obrigatório para emissão da NF-e
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          CPF do Destinatário
                        </label>

                        <Input
                          {...form.register("document", {
                            onChange: (e) => {
                              const masked = maskCPF(e.target.value);

                              form.setValue("document", masked, {
                                shouldValidate: true,
                              });
                            },
                          })}
                          placeholder="000.000.000-00"
                          className={
                            form.formState.errors.document
                              ? "border-destructive"
                              : ""
                          }
                        />

                        {form.formState.errors.document && (
                          <p className="text-xs text-destructive font-medium">
                            {form.formState.errors.document.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      Opções de Envio
                    </h3>

                    {isLocal ? (
                      localOptions.length > 0 ? (
                        <RadioGroup
                          value={selectedRate?.id ?? ""}
                          onValueChange={(id) =>
                            setSelectedRate(
                              localOptions.find((option) => option.id === id),
                            )
                          }
                          className="space-y-3"
                        >
                          {localOptions.map((option) => (
                            <ShippingCard key={option.id} {...option} />
                          ))}
                        </RadioGroup>
                      ) : (
                        <Card>
                          <CardContent className="p-6 text-center space-y-4">
                            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-muted-foreground" />
                            </div>

                            <div>
                              <h3 className="font-semibold">
                                Frete não disponível
                              </h3>

                              <p className="text-xs text-muted-foreground mt-1">
                                Estamos na mesma região, mas não encontramos
                                opções de entrega configuradas.
                              </p>
                            </div>

                            <Button
                              variant="outline"
                              render={() => (
                                <Link href="/endereco">Revisar endereço</Link>
                              )}
                              className="w-full"
                            />
                          </CardContent>
                        </Card>
                      )
                    ) : (
                      <ShippingOptions
                        options={shippingRates}
                        isLoading={isLoading}
                        onSelect={setSelectedRate}
                        selectedId={selectedRate?.id ?? ""}
                      />
                    )}
                  </div>
                </>
              )}

              <div className="pt-2">
                <Button
                  disabled={!isShippingComplete || isPending}
                  onClick={() => setStep("review")}
                  className="w-full h-11 font-semibold"
                >
                  Continuar para Revisão
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        Endereço de Entrega
                      </h3>

                      <button
                        type="button"
                        onClick={() => setStep("shipping")}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Alterar
                      </button>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p className="font-medium text-foreground">
                        {activeAddress?.street}
                      </p>

                      <p>
                        {activeAddress?.city} - CEP: {activeAddress?.zip_code}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Truck size={16} className="text-primary" />
                        Envio e NF
                      </h3>

                      <button
                        type="button"
                        onClick={() => setStep("shipping")}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Alterar
                      </button>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">
                        {selectedRate?.type === "pickup" ||
                        selectedRate?.type === "local_delivery"
                          ? "Entrega Local"
                          : `${selectedRate?.company?.name} - ${selectedRate?.name}`}{" "}
                        ({selectedRate?.delivery_time})
                      </p>

                      <p>
                        CPF NF:{" "}
                        <span className="font-mono text-foreground">
                          {form.getValues("document")}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />

                <span>
                  Ambiente 100% seguro com criptografia de ponta a ponta
                </span>
              </div>

              <Button
                className="w-full"
                disabled={isStripeLoading}
                onClick={async () => {
                  if (isStripeLoading) {
                    return;
                  }

                  setIsStripeLoading(true);

                  /**
                   * Os produtos enviados ao backend
                   * vêm EXCLUSIVAMENTE do Zustand.
                   *
                   * Isso funciona para:
                   *
                   * 1. Compra normal
                   * 2. Orçamento + carrinho existente
                   *
                   * O orderId identifica o orçamento,
                   * mas não fornece os produtos.
                   */
                  const checkoutPayload = {
                    /**
                     * Mantém o ID do orçamento,
                     * quando existir.
                     */
                    orderId: existingOrderId || null,

                    /**
                     * O backend consegue identificar
                     * que esse checkout veio de um
                     * orçamento através do orderId.
                     */
                    isQuote: Boolean(existingOrderId),

                    /**
                     * ÚNICA fonte dos produtos:
                     * Zustand.
                     */
                    items: items.map((item: any) => ({
                      ...item,

                      product: {
                        ...item.product,

                        variant_id: item.product.variant_id || null,

                        name: item.product.name || null,

                        tamanho: item.product.tamanho || null,

                        material: item.product.material || null,

                        weight: Number(item.product.weight) || 0.3,

                        width: Number(item.product.width) || 10,

                        height: Number(item.product.height) || 10,

                        length: Number(item.product.length) || 10,
                      },
                    })),

                    /**
                     * Dados do frete escolhido.
                     */
                    shipping: selectedRate,

                    /**
                     * Dados do cliente.
                     */
                    user: {
                      id: user?.id,

                      name: form.getValues("name"),

                      email: form.getValues("email"),

                      phone: form.getValues("phone"),

                      document: form.getValues("document"),

                      address: activeAddress?.street,

                      city: activeAddress?.city,

                      state: activeAddress?.state,

                      zip: activeAddress?.zip_code,
                    },
                  };

                  try {
                    const { url } =
                      await createCheckoutSession(checkoutPayload);

                    if (url) {
                      window.location.href = url;
                    }
                  } catch (error) {
                    console.error("ERRO no Checkout:", error);

                    setIsStripeLoading(false);
                  }
                }}
              >
                <Lock className="w-4 h-4" />

                {isStripeLoading
                  ? "Processando pagamento..."
                  : "Ir para o Pagamento Seguro"}
              </Button>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4 order-1 lg:order-2">
          <OrderSummary
            items={items}
            shipping={selectedRate}
            total={total}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </div>
    </div>
  );
}
