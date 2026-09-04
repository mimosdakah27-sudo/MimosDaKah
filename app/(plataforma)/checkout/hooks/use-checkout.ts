"use client";

import {
  clearCheckoutDraft,
  getCheckoutDraft,
  updateCheckoutDraft,
} from "@/lib/checkout-draft";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
import { useCart } from "@/lib/store/cart";
import { supabaseBrowser } from "@/lib/supabase/client";
import { unmask } from "@/lib/utils";

import { useShipping } from "../hooks/use-shipping";
import { createCheckoutSession, saveUserAddress } from "../services/checkout";

export type CheckoutStep = "customer" | "address" | "shipping" | "review";

export type CheckoutCustomerData = {
  id: string;
  name: string;
  phone: string;
  email: string;
  document: string;
};

export type CheckoutAddressData = {
  zip_code: string;
  street: string;
  number: string;
  without_number: boolean;
  complement: string;
  reference: string;
  neighborhood: string;
  city: string;
  state: string;
};

type SavedAddress = {
  id: string;
  zip_code: string | null;
  street: string | null;
  number: string | null;
  without_number: boolean | null;
  complement: string | null;
  reference: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  active: boolean | null;
};

export type SelectedShippingRate = {
  id: string;
  price: number;
  delivery_time?: number;
  type?: "pickup" | "local" | "other_city";
};

const VALID_STEPS: CheckoutStep[] = [
  "customer",
  "address",
  "shipping",
  "review",
];

function isValidStep(value: string | null): value is CheckoutStep {
  return Boolean(value && VALID_STEPS.includes(value as CheckoutStep));
}

function normalizeZip(zip?: string | null) {
  return String(zip ?? "").replace(/\D/g, "");
}

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function useCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, profile, loading: authLoading } = useAuth();
  const { config } = useStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("customer");

  const [customerData, setCustomerData] = useState<CheckoutCustomerData>({
    id: "",
    name: "",
    phone: "",
    email: "",
    document: "",
  });

  const [addressData, setAddressData] = useState<CheckoutAddressData>({
    zip_code: "",
    street: "",
    number: "",
    without_number: false,
    complement: "",
    reference: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [selectedRate, setSelectedRate] = useState<SelectedShippingRate | null>(null);

  const cartItems = useCart((state) => state.items);

  const draftInitialized = useRef(false);
  const accountInitialized = useRef(false);
  const savedAddressInitialized = useRef(false);
  const addressSaveInProgress = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Restaura rascunho
  useEffect(() => {
    if (!isMounted || draftInitialized.current) return;
    draftInitialized.current = true;

    const draft = getCheckoutDraft();
    const urlStep = searchParams.get("step");
    const initialStep = isValidStep(urlStep)
      ? urlStep
      : draft?.step && isValidStep(draft.step)
        ? draft.step
        : "customer";

    setStep(initialStep);

    if (draft?.customerData) {
      setCustomerData((prev) => ({ ...prev, ...draft.customerData }));
    }
    if (draft?.addressData) {
      setAddressData((prev) => ({ ...prev, ...draft.addressData }));
    }
  }, [isMounted, searchParams]);

  // 2. Sincroniza dados da conta
  useEffect(() => {
    if (!isMounted || !draftInitialized.current || authLoading || !user) return;
    if (accountInitialized.current) return;
    accountInitialized.current = true;

    setCustomerData((prev) => ({
      id: prev.id || user.id || "",
      name: prev.name || profile?.display_name || user.user_metadata?.display_name || "",
      phone: prev.phone || profile?.phone || user.user_metadata?.phone || "",
      email: prev.email || profile?.email || user.email || "",
      document: prev.document || "",
    }));
  }, [isMounted, authLoading, user, profile]);

  // 3. Carrega endereço salvo
  useEffect(() => {
    if (!isMounted || !draftInitialized.current || authLoading || !user) return;
    if (savedAddressInitialized.current) return;

    const draft = getCheckoutDraft();
    const draftAddress = draft?.addressData;
    const hasDraftAddress = Boolean(draftAddress?.zip_code || draftAddress?.street);
    const hasCurrentAddress = Boolean(addressData.zip_code || addressData.street);

    if (hasDraftAddress || hasCurrentAddress) {
      savedAddressInitialized.current = true;
      return;
    }

    savedAddressInitialized.current = true;

    const loadSavedAddress = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("active", { ascending: false })
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) return;

        const saved = data as SavedAddress;
        setAddressData((prev) => {
          if (prev.zip_code || prev.street) return prev;
          return {
            zip_code: saved.zip_code || "",
            street: saved.street || "",
            number: saved.number || "",
            without_number: Boolean(saved.without_number),
            complement: saved.complement || "",
            reference: saved.reference || "",
            neighborhood: saved.neighborhood || "",
            city: saved.city || "",
            state: saved.state || "",
          };
        });
        toast.success("Seu endereço salvo foi preenchido.");
      } catch (error) {
        console.error("[CHECKOUT] Erro ao carregar endereço:", error);
      }
    };

    loadSavedAddress();
  }, [isMounted, authLoading, user, addressData]);

  // 4. Salva endereço pós-login
  useEffect(() => {
    if (!isMounted || authLoading || !user || addressSaveInProgress.current) return;

    const draft = getCheckoutDraft();
    if (!draft?.saveAddressAfterLogin) return;

    const address = draft.addressData;
    if (!address?.zip_code || !address?.street) return;

    addressSaveInProgress.current = true;

    const saveAfterLogin = async () => {
      try {
        const result = await saveUserAddress(user.id, address);
        if (result.success) {
          toast.success("Endereço salvo na sua conta!");
        }
        updateCheckoutDraft({ saveAddressAfterLogin: false });
      } catch (error) {
        console.error("[CHECKOUT] Erro ao salvar endereço após login:", error);
      } finally {
        addressSaveInProgress.current = false;
      }
    };

    saveAfterLogin();
  }, [isMounted, authLoading, user]);

  const saveAddressForLoggedUser = async (): Promise<boolean> => {
    if (!user || addressSaveInProgress.current) return true;

    if (!addressData.zip_code || !addressData.street) {
      toast.error("Preencha todos os dados obrigatórios do endereço.");
      return false;
    }

    addressSaveInProgress.current = true;
    try {
      const supabase = supabaseBrowser();
      const { data: existingData } = await supabase
        .from("user_addresses")
        .select("id")
        .eq("user_id", user.id);

      if (existingData && existingData.length > 0) return true;

      const result = await saveUserAddress(user.id, addressData);
      if (!result.success) throw result.error;

      toast.success("Endereço salvo na sua conta!");
      return true;
    } catch (error) {
      toast.error("Não foi possível salvar seu endereço.");
      return false;
    } finally {
      addressSaveInProgress.current = false;
    }
  };

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
          preco_promocional: product.preco_promocional != null ? Number(product.preco_promocional) : null,
          imagem_url: product.imagem_url || "",
          weight: Number(product.weight) || 0.3,
          width: Number(product.width) || 10,
          height: Number(product.height) || 10,
          length: Number(product.length) || 10,
        },
      };
    });
  }, [cartItems]);

  useEffect(() => {
    if (isMounted && items.length === 0) {
      router.back();
    }
  }, [isMounted, items.length, router]);

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      const reg = Number(item.product.preco) || 0;
      const promo = Number(item.product.preco_promocional) || 0;
      const effective = promo > 0 && promo < reg ? promo : reg;
      return total + effective * Number(item.quantity || 1);
    }, 0);
  }, [items]);

  const handleFetchCep = async (cep: string) => {
    const rawCep = unmask(cep);
    if (rawCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      setAddressData((prev) => ({
        ...prev,
        zip_code: cep,
        street: data.logradouro?.trim() || prev.street,
        neighborhood: data.bairro?.trim() || prev.neighborhood,
        city: data.localidade?.trim() || prev.city,
        state: data.uf?.trim()?.toUpperCase() || prev.state,
      }));
      setSelectedRate(null);
    } catch {
      toast.error("Não foi possível consultar o CEP.");
    }
  };

  const normalizedStoreZip = normalizeZip(config?.zip_code);
  const normalizedCustomerZip = normalizeZip(addressData.zip_code);
  const isLocalZip = normalizedStoreZip.length === 8 && normalizedStoreZip === normalizedCustomerZip;

  const { data: shippingRates, isLoading: isLoadingShipping } = useShipping(
    config?.zip_code,
    addressData.zip_code,
    items
  );

  useEffect(() => {
    if (isLocalZip && selectedRate?.type === "other_city") setSelectedRate(null);
    if (!isLocalZip && selectedRate?.type === "local") setSelectedRate(null);
  }, [isLocalZip, selectedRate]);

  const shippingPrice = Number(Number(selectedRate?.price || 0).toFixed(2));
  const total = useMemo(() => Number((subtotal + shippingPrice).toFixed(2)), [subtotal, shippingPrice]);

  const shippingPayload = selectedRate
    ? {
        id: selectedRate.type === "other_city" ? "other_city" : String(selectedRate.id),
        price: shippingPrice,
      }
    : null;

  const changeStep = (nextStep: CheckoutStep) => {
    setStep(nextStep);
    router.replace(`/checkout?step=${nextStep}`, { scroll: false });
  };

  const handleAddressNext = async () => {
    if (user) {
      const saved = await saveAddressForLoggedUser();
      if (!saved) return;
    }
    changeStep("shipping");
  };

  const handleFinalizeOrder = async () => {
    if (isSubmitting) return;
    if (!selectedRate) return toast.error("Selecione uma opção de entrega.");
    if (!customerData.name.trim()) return (changeStep("customer"), toast.error("Informe o nome."));
    if (!addressData.street.trim()) return (changeStep("address"), toast.error("Informe o endereço."));

    setIsSubmitting(true);
    try {
      if (!shippingPayload) throw new Error("Frete não selecionado.");

      await createCheckoutSession({
        user: {
          id: customerData.id || null,
          name: customerData.name.trim(),
          phone: customerData.phone.trim(),
          email: customerData.email.trim() || null,
          document: customerData.document.trim() || null,
          address: addressData.street.trim(),
          number: addressData.without_number ? null : addressData.number.trim() || null,
          without_number: addressData.without_number,
          complement: addressData.complement.trim() || null,
          reference: addressData.reference.trim() || null,
          neighborhood: addressData.neighborhood.trim() || null,
          city: addressData.city.trim(),
          state: addressData.state.trim(),
          zip: addressData.zip_code.trim(),
        },
        items,
        shipping: shippingPayload,
      });
    } catch (error: any) {
      if (error?.digest?.startsWith("NEXT_REDIRECT")) return;
      toast.error(error instanceof Error ? error.message : "Erro ao registrar o pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
    storeConfig: config,
    items,
    subtotal,
    shippingPrice,
    total,
    handleFetchCep,
    handleAddressNext,
    handleFinalizeOrder,
  };
}