"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
import {
  clearCheckoutDraft, createEmptyAddressDraft, createEmptyCustomerDraft,
  getCheckoutDraft, updateCheckoutDraft, type CheckoutDraft, type CheckoutAddressDraft, type CheckoutShippingChoice,
} from "@/lib/checkout-draft";
import { useCart } from "@/lib/store/cart";
import { supabaseBrowser } from "@/lib/supabase/client";
import { maskCEP, unmask } from "@/lib/utils";
import { getEffectivePrice, getLocalDeliveryFee, hasCheckoutAddress, hasCheckoutContact } from "../checkout-values";
import { createCheckoutSession, saveUserAddress } from "../services/checkout";
import { useShipping } from "./use-shipping";

type CheckoutStep = CheckoutDraft["step"];
export type SelectedShippingRate = CheckoutShippingChoice["rate"];

const steps: CheckoutStep[] = ["customer", "address", "shipping", "review"];

function readUrlStep() {
  const value = new URLSearchParams(window.location.search).get("step") as CheckoutStep;
  return steps.includes(value) ? value : null;
}

function reachableStep(target: CheckoutStep, contact: boolean, address: boolean, delivery: boolean) {
  const last = !contact ? 0 : !address ? 1 : !delivery ? 2 : 3;
  return steps[Math.min(steps.indexOf(target), last)];
}

function stepUrl(step: CheckoutStep) {
  const url = new URL(window.location.href);
  url.searchParams.set("step", step);
  return url.href;
}

function getCatalogZip() {
  try {
    const zip = unmask(sessionStorage.getItem("catalog-shipping-zip") || "");
    sessionStorage.removeItem("catalog-shipping-zip");
    return zip.length === 8 ? zip : "";
  } catch {
    return "";
  }
}

export function useCheckout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile, loading: authLoading } = useAuth();
  const { config, isLoading: loadingConfig } = useStore();
  const items = useCart((state) => state.items);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  const initializedAccount = useRef<string | null>(null);
  const accountId = user?.id || "";
  const isMounted = initializedFor === accountId && !authLoading;
  const [requestedStep, setStep] = useState<CheckoutStep>("customer");
  const [customerData, setCustomerData] = useState(createEmptyCustomerDraft);
  const [addressData, setAddressData] = useState(createEmptyAddressDraft);
  const [choice, setChoice] = useState<CheckoutShippingChoice | null>(null);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [cepMessage, setCepMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptHref, setReceiptHref] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const submitting = useRef(false);
  const requestId = useRef("");
  const addressSaving = useRef(false);
  const [saveAfterLogin, setSaveAfterLogin] = useState(false);
  const skipAddressLookup = useRef("");

  useEffect(() => {
    if (authLoading || initializedAccount.current === accountId) return;
    initializedAccount.current = accountId;
    const draft = getCheckoutDraft();
    const sameAccount = !draft?.customerData.id || draft.customerData.id === accountId;
    if (!sameAccount) clearCheckoutDraft();
    requestId.current = sameAccount ? draft?.requestId || "" : "";
    const customer = sameAccount && draft ? draft.customerData : createEmptyCustomerDraft();
    let address = sameAccount && draft ? draft.addressData : createEmptyAddressDraft();
    const quotedZip = getCatalogZip();
    if (quotedZip && quotedZip !== unmask(address.zip_code)) {
      address = { ...createEmptyAddressDraft(), zip_code: maskCEP(quotedZip) };
    }
    skipAddressLookup.current = address.street || address.city ? unmask(address.zip_code) : "";
    const contact = {
      ...customer, id: accountId,
      name: customer.name || profile?.display_name || user?.user_metadata?.display_name || "",
      phone: customer.phone || profile?.phone || user?.user_metadata?.phone || "",
      email: customer.email || profile?.email || user?.email || "",
    };
    setCustomerData(contact);
    setAddressData(address);
    const restoredChoice = sameAccount ? draft?.shippingChoice ?? null : null;
    const target = readUrlStep() ?? (sameAccount && draft ? draft.step : "customer");
    const initial = reachableStep(target, hasCheckoutContact(contact), hasCheckoutAddress(address), Boolean(restoredChoice));
    if (readUrlStep() !== initial) window.history.replaceState(null, "", stepUrl(initial));
    setStep(initial);
    setChoice(restoredChoice);
    setSaveAfterLogin(Boolean(accountId && sameAccount && draft?.saveAddressAfterLogin));
    setInitializedFor(accountId);
  }, [accountId, authLoading, profile, user]);

  useEffect(() => {
    if (!isMounted || submitting.current || !items.length) return;
    updateCheckoutDraft({ customerData, addressData, step: requestedStep, shippingChoice: choice });
  }, [isMounted, customerData, addressData, requestedStep, choice, items.length]);

  // Load the saved account address only while all fields are untouched.
  useEffect(() => {
    if (!isMounted || !accountId) return;
    let current = true;
    async function loadAddress() {
      const { data } = await supabaseBrowser().from("user_addresses").select("*")
        .eq("user_id", accountId).order("active", { ascending: false })
        .order("updated_at", { ascending: false }).limit(1).maybeSingle();
      const saved = data as Partial<CheckoutAddressDraft> | null;
      if (!saved || !current) return;
      setAddressData((prev) => {
        if (Object.values(prev).some(Boolean)) return prev;
        return {
          zip_code: maskCEP(saved.zip_code || ""), street: saved.street || "", number: saved.number || "",
          without_number: Boolean(saved.without_number), complement: saved.complement || "",
          reference: saved.reference || "", neighborhood: saved.neighborhood || "",
          city: saved.city || "", state: saved.state || "",
        };
      });
    }
    void loadAddress().catch(() => {});
    return () => { current = false; };
  }, [accountId, isMounted]);

  useEffect(() => {
    if (!isMounted || !accountId || !saveAfterLogin || !hasCheckoutAddress(addressData)) return;
    setSaveAfterLogin(false);
    updateCheckoutDraft({ saveAddressAfterLogin: false });
    void saveUserAddress(addressData)
      .then(({ success }) => success ? toast.success("Endereço salvo na sua conta.") : toast.error("Não foi possível salvar o endereço na conta."))
      .catch(() => toast.error("Não foi possível salvar o endereço na conta."));
  }, [accountId, addressData, isMounted, saveAfterLogin]);

  const contactValid = hasCheckoutContact(customerData);
  const addressValid = hasCheckoutAddress(addressData);
  const editingAddress = contactValid && requestedStep !== "customer" && (requestedStep === "address" || !addressValid);
  const zip = unmask(addressData.zip_code);
  useEffect(() => {
    setCepMessage("");
    setIsLookingUpCep(false);
    if (!isMounted) return;
    if (skipAddressLookup.current !== zip) skipAddressLookup.current = "";
    if (!editingAddress || zip.length !== 8) return;
    if (skipAddressLookup.current === zip) return;
    const controller = new AbortController();
    setIsLookingUpCep(true);
    async function lookupCep() {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (data.erro) {
          setCepMessage("CEP não encontrado. Confira o CEP ou preencha o endereço.");
          return;
        }
        skipAddressLookup.current = zip;
        setAddressData((prev) => unmask(prev.zip_code) !== zip ? prev : {
          ...prev, street: prev.street || data.logradouro || "", neighborhood: prev.neighborhood || data.bairro || "",
          city: prev.city || data.localidade || "", state: prev.state || data.uf || "",
        });
      } catch {
        if (!controller.signal.aborted) setCepMessage("Consulta indisponível. Você pode preencher o endereço.");
      } finally {
        if (!controller.signal.aborted) setIsLookingUpCep(false);
      }
    }
    void lookupCep();
    return () => controller.abort();
  }, [isMounted, editingAddress, zip]);

  const storeZip = unmask(config?.zip_code || "");
  const hasLocalDelivery = Boolean(config?.allow_local_delivery && storeZip.length === 8 && zip === storeZip);
  const wantsShipping = requestedStep === "shipping" || requestedStep === "review";
  const shipping = useShipping(
    isMounted && wantsShipping && contactValid && addressValid && !hasLocalDelivery ? storeZip : undefined,
    zip, items
  );
  const selectionKey = JSON.stringify([storeZip, zip, items.map(({ product, quantity }) => [product.id, product.variant_id, quantity])]);
  const shippingRates = !shipping.isError && shipping.data?.ok ? shipping.data.rates : undefined;
  const shippingError = shipping.isError || (!loadingConfig && !storeZip)
    ? "Não foi possível consultar o frete agora. Tente novamente."
    : shipping.data?.ok === false ? shipping.data.message : undefined;
  let selectedRate = choice?.key === selectionKey ? choice.rate : null;
  if (selectedRate?.type === "other_city" &&
      !shippingRates?.some((rate) => rate.id === selectedRate?.id && rate.price === selectedRate.price)) selectedRate = null;
  if (selectedRate?.type === "local" && (!hasLocalDelivery || !config || getLocalDeliveryFee(config) !== selectedRate.price)) selectedRate = null;
  if (selectedRate?.type === "pickup" && (!config?.allow_local_pickup || !items.every(({ product }) => product.permite_retirada !== false))) selectedRate = null;
  const setSelectedRate = (rate: SelectedShippingRate | null) => setChoice(rate ? { rate, key: selectionKey } : null);

  const step = reachableStep(requestedStep, contactValid, addressValid, Boolean(selectedRate));
  const canVisitStep = (next: CheckoutStep) => next === reachableStep(next, contactValid, addressValid, Boolean(selectedRate));
  const restoringShipping = !!choice && requestedStep === "review" && (loadingConfig || shipping.isFetching);
  useEffect(() => {
    // Remover os itens confirmados invalida o frete, mas o próximo destino já é o recibo.
    if (submitting.current || !isMounted || step === requestedStep || restoringShipping) return;
    setStep(step);
    window.history.replaceState(null, "", stepUrl(step));
  }, [isMounted, isSubmitting, step, requestedStep, restoringShipping]);

  // Next synchronizes native history with the route. Restore the local form
  // step when the visitor uses browser Back or Forward inside checkout.
  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname === "/checkout") setStep(readUrlStep() ?? "customer");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const changeStep = (next: CheckoutStep) => {
    if (submitting.current || !canVisitStep(next) || next === requestedStep) return;
    setStep(next);
    window.history.pushState(null, "", stepUrl(next));
  };

  const handleAddressNext = async () => {
    if (!addressValid) return;
    changeStep("shipping");
    if (user && !addressSaving.current) {
      addressSaving.current = true;
      setIsSavingAddress(true);
      try {
        const { success } = await saveUserAddress(addressData, true);
        if (!success) toast.error("Não foi possível salvar o endereço na conta. Você pode continuar o pedido.");
      } catch {
        toast.error("Não foi possível salvar o endereço na conta. Você pode continuar o pedido.");
      } finally {
        addressSaving.current = false;
        setIsSavingAddress(false);
      }
    }
  };

  const subtotal = items.reduce((sum, { product, quantity }) => sum + getEffectivePrice(product) * quantity, 0);
  const shippingPrice = selectedRate?.price ?? 0;
  const total = subtotal + shippingPrice;
  const handleFinalizeOrder = async () => {
    if (submitting.current || !contactValid || !addressValid || !selectedRate || !items.length) return;
    submitting.current = true;
    setIsSubmitting(true);
    let confirmed = false;
    try {
      if (!requestId.current) {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
        requestId.current = [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
      }
      updateCheckoutDraft({ requestId: requestId.current });
      const result = await createCheckoutSession({
        requestId: requestId.current,
        user: {
          name: customerData.name, phone: customerData.phone, email: customerData.email, document: customerData.document,
          address: addressData.street, number: addressData.number, without_number: addressData.without_number,
          complement: addressData.complement, reference: addressData.reference, neighborhood: addressData.neighborhood,
          city: addressData.city, state: addressData.state, zip: addressData.zip_code,
        },
        items,
        shipping: { id: selectedRate.type || selectedRate.id, price: shippingPrice },
      });
      if ("error" in result) {
        toast.error(result.error, result.productId ? {
          action: { label: "Ver produto", onClick: () => router.push(`/produto/${result.productId}`) },
        } : undefined);
        if (result.refreshShipping) {
          submitting.current = false;
          setSelectedRate(null);
          changeStep("shipping");
          void queryClient.invalidateQueries({ queryKey: ["storeConfig"] });
          void queryClient.invalidateQueries({ queryKey: ["shipping-rates"] });
        }
        return;
      }
      confirmed = true;
      const href = `/sucesso?order_id=${encodeURIComponent(result.orderId)}#whatsapp`;
      setReceiptHref(href);
      clearCheckoutDraft();
      // Other products can be added while the server registers this order.
      useCart.setState((current) => ({
        items: current.items.flatMap((item) => {
          const ordered = items.find(({ product }) => product.id === item.product.id && product.variant_id === item.product.variant_id);
          if (!ordered) return [item];
          const quantity = item.quantity - ordered.quantity;
          return quantity > 0 ? [{ ...item, quantity }] : [];
        }),
      }));
      window.location.replace(href);
      return;
    } catch {
      if (!confirmed) toast.error("Não foi possível registrar seu pedido. Seus dados foram mantidos. Tente novamente.");
    } finally {
      // On success, keep the confirmation locked while navigating to the receipt.
      if (!confirmed) {
        submitting.current = false;
        setIsSubmitting(false);
      }
    }
  };

  return {
    isMounted, isGuest: !user, isSubmitting, receiptHref, step, changeStep, canVisitStep,
    customerData, setCustomerData, addressData, setAddressData, selectedRate, setSelectedRate,
    shippingRates, shippingError, isLoadingShipping: loadingConfig || shipping.isFetching,
    retryShipping: () => {
      if (!storeZip) void queryClient.invalidateQueries({ queryKey: ["storeConfig"] });
      else void shipping.refetch();
    },
    storeConfig: config, items, subtotal, shippingPrice, total, isLookingUpCep, cepMessage, isSavingAddress,
    handleAddressNext, handleFinalizeOrder,
  };
}
