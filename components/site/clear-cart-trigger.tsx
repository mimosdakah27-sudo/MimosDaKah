"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/store/cart";

export function ClearCartTrigger() {
  const clearCart = useCart((state) => state.clear);

  useEffect(() => {
    // Dispara a limpeza do carrinho assim que o componente é montado na página de sucesso
    clearCart();
  }, [clearCart]);

  return null; // Este componente não renderiza nada visualmente
}