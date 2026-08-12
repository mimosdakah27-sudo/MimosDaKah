"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, CartProduct } from "./types";

interface CartState {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (p: CartProduct, qty?: number) => void;
  remove: (id: string, variant_id?: string) => void;
  updateQty: (id: string, qty: number, variant_id?: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      setOpen: (open) => set({ open }),
      
      add: (product, quantity = 1) => {
        const items = get().items;
        
        // Identifica unicamente pelo ID do produto + ID da variante
        const existingIndex = items.findIndex(
          (i) => 
            i.product.id === product.id && 
            i.product.variant_id === product.variant_id
        );

        const qtdAdicionar = Number.isNaN(quantity) ? 1 : quantity;

        let nextItems = [...items];
        if (existingIndex > -1) {
          nextItems[existingIndex] = {
            ...nextItems[existingIndex],
            quantity: nextItems[existingIndex].quantity + qtdAdicionar,
          };
        } else {
          nextItems.push({
            product: product,
            quantity: qtdAdicionar,
          });
        }

        set({ items: nextItems, open: true });
      },

      remove: (id, variant_id) =>
        set({
          items: get().items.filter(
            (i) => !(i.product.id === id && i.product.variant_id === variant_id)
          ),
        }),

      updateQty: (id, qty, variant_id) => {
        if (qty <= 0) {
          return set({
            items: get().items.filter(
              (i) => !(i.product.id === id && i.product.variant_id === variant_id)
            ),
          });
        }

        const safeQty = Number.isNaN(qty) ? 1 : qty;
        const novosItens = get().items.map((i) => {
          if (i.product.id === id && i.product.variant_id === variant_id) {
            return { ...i, quantity: safeQty };
          }
          return i;
        });

        set({ items: novosItens });
      },

      clear: () => {
        set({ items: [] });
        if (typeof window !== "undefined") {
          localStorage.removeItem("ignite_cart_v2");
        }
      },
    }),
    { name: "ignite_cart_v2", partialize: (s) => ({ items: s.items }) },
  ),
);

export const useCartCount = () =>
  useCart((s) =>
    s.items.reduce(
      (acc, i) => acc + (Number.isNaN(i.quantity) ? 0 : i.quantity),
      0,
    ),
  );