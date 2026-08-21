"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchQuoteOptions, createQuoteOrderService } from "../services/quote-service";
import type { CustomerOption, ProductOption } from "../types";

export function useCreateQuote(onCreated?: () => void) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Seleções do formulário
  const [openCustomerCombo, setOpenCustomerCombo] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

  const [openProductCombo, setOpenProductCombo] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);

  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1"); // <--- ESTADO DA QUANTIDADE
  const [observation, setObservation] = useState("");

  // Busca de opções (clientes e produtos)
  const { data, isLoading: isLoadingOptions } = useQuery({
    queryKey: ["quote-options"],
    queryFn: fetchQuoteOptions,
    enabled: open,
  });

  // Mutação para salvar orçamento
  const createMutation = useMutation({
    mutationFn: createQuoteOrderService,
    onSuccess: () => {
      toast.success("Orçamento gerado e enviado ao cliente!");
      queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      resetForm();
      setOpen(false);
      onCreated?.();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao gerar orçamento.");
    },
  });

  const resetForm = () => {
    setSelectedCustomer(null);
    setSelectedProduct(null);
    setPrice("");
    setQuantity("1");
    setObservation("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.error("Selecione um cliente.");
      return;
    }
    if (!selectedProduct) {
      toast.error("Selecione um produto.");
      return;
    }
    if (!price || parseFloat(price.replace(",", ".")) <= 0) {
      toast.error("Informe um valor unitário válido.");
      return;
    }
    
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 1) {
      toast.error("Informe uma quantidade válida (no mínimo 1).");
      return;
    }

    const numericPrice = parseFloat(price.replace(",", "."));

    createMutation.mutate({
      customerId: selectedCustomer.user_id,
      customerName: selectedCustomer.display_name || "Cliente",
      customerEmail: selectedCustomer.email || "",
      customerPhone: selectedCustomer.phone || undefined,
      productId: selectedProduct.id,
      productName: selectedProduct.nome,
      productImage: selectedProduct.imagem_url || undefined,
      weight: selectedProduct.weight || 0,
      width: selectedProduct.width || 0,
      height: selectedProduct.height || 0,
      length: selectedProduct.length || 0,
      price: numericPrice,
      quantity: parsedQty, // <--- REPASSA QUANTIDADE
      observation: observation.trim() || undefined,
    });
  };

  return {
    open,
    setOpen,
    customers: data?.customers ?? [],
    products: data?.products ?? [],
    isLoadingOptions,
    isSubmitting: createMutation.isPending,
    openCustomerCombo,
    setOpenCustomerCombo,
    selectedCustomer,
    setSelectedCustomer,
    openProductCombo,
    setOpenProductCombo,
    selectedProduct,
    setSelectedProduct,
    price,
    setPrice,
    quantity,
    setQuantity,
    observation,
    setObservation,
    handleSubmit,
  };
}