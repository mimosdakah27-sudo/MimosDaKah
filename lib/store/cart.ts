"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, CartProduct } from "./types";

interface CartState {
  items: CartItem[];
  open: boolean;

  setOpen: (value: boolean) => void;

  /**
   * Adiciona um produto ao carrinho.
   *
   * Se o mesmo produto + variante já existir,
   * soma a quantidade.
   */
  add: (product: CartProduct, quantity?: number) => void;

  /**
   * Adiciona vários produtos ao carrinho.
   *
   * Os itens existentes são mantidos.
   * Os itens novos são adicionados.
   */
  addMany: (items: CartItem[]) => void;

  remove: (
    id: string,
    variant_id?: string
  ) => void;

  updateQty: (
    id: string,
    quantity: number,
    variant_id?: string
  ) => void;

  clear: () => void;
}

/**
 * Cria uma chave única para produto + variante.
 */
function getItemKey(product: CartProduct): string {
  return `${product.id}::${product.variant_id ?? "no-variant"}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,

      setOpen: (open) => {
        set({ open });
      },

      /**
       * =====================================================
       * ADICIONAR UM PRODUTO
       * =====================================================
       */
      add: (product, quantity = 1) => {
        if (!product?.id) {
          return;
        }

        const safeQuantity = Number(quantity);

        if (
          !Number.isFinite(safeQuantity) ||
          safeQuantity <= 0
        ) {
          return;
        }

        const currentItems = get().items;

        const key = getItemKey(product);

        const existingIndex =
          currentItems.findIndex(
            (item) =>
              getItemKey(item.product) === key
          );

        /**
         * Já existe:
         * aumenta a quantidade.
         */
        if (existingIndex !== -1) {
          const nextItems = [...currentItems];

          nextItems[existingIndex] = {
            ...nextItems[existingIndex],
            quantity:
              nextItems[existingIndex].quantity +
              safeQuantity,
          };

          set({
            items: nextItems,
          });

          return;
        }

        /**
         * Não existe:
         * adiciona normalmente.
         */
        set({
          items: [
            ...currentItems,
            {
              product,
              quantity: safeQuantity,
            },
          ],
        });
      },

      /**
       * =====================================================
       * ADICIONAR VÁRIOS PRODUTOS
       * =====================================================
       *
       * Usado principalmente para carregar os itens
       * de um orçamento para o carrinho.
       *
       * IMPORTANTE:
       *
       * Não substitui o carrinho.
       * Mantém os produtos que já estavam nele.
       */
      addMany: (newItems) => {
        if (
          !Array.isArray(newItems) ||
          newItems.length === 0
        ) {
          return;
        }

        const currentItems = [
          ...get().items,
        ];

        for (const newItem of newItems) {
          if (!newItem?.product?.id) {
            continue;
          }

          const quantity = Number(
            newItem.quantity
          );

          if (
            !Number.isFinite(quantity) ||
            quantity <= 0
          ) {
            continue;
          }

          const key = getItemKey(
            newItem.product
          );

          const existingIndex =
            currentItems.findIndex(
              (item) =>
                getItemKey(item.product) ===
                key
            );

          /**
           * O produto já está no carrinho.
           *
           * Soma a quantidade do orçamento.
           */
          if (existingIndex !== -1) {
            currentItems[existingIndex] = {
              ...currentItems[existingIndex],
              quantity:
                currentItems[existingIndex]
                  .quantity + quantity,
            };

            continue;
          }

          /**
           * Produto ainda não está no carrinho.
           */
          currentItems.push({
            product: newItem.product,
            quantity,
          });
        }

        /**
         * UMA única atualização do Zustand.
         */
        set({
          items: currentItems,
        });
      },

      /**
       * =====================================================
       * REMOVER
       * =====================================================
       */
      remove: (id, variant_id) => {
        const currentItems = get().items;

        const nextItems =
          currentItems.filter((item) => {
            const sameProduct =
              item.product.id === id;

            const sameVariant =
              (item.product.variant_id ??
                undefined) ===
              (variant_id ?? undefined);

            return !(
              sameProduct &&
              sameVariant
            );
          });

        set({
          items: nextItems,
        });
      },

      /**
       * =====================================================
       * ATUALIZAR QUANTIDADE
       * =====================================================
       */
      updateQty: (
        id,
        quantity,
        variant_id
      ) => {
        const safeQuantity =
          Number(quantity);

        if (
          !Number.isFinite(
            safeQuantity
          )
        ) {
          return;
        }

        /**
         * Quantidade 0 remove.
         */
        if (safeQuantity <= 0) {
          const currentItems =
            get().items;

          const nextItems =
            currentItems.filter(
              (item) => {
                const sameProduct =
                  item.product.id === id;

                const sameVariant =
                  (item.product.variant_id ??
                    undefined) ===
                  (variant_id ??
                    undefined);

                return !(
                  sameProduct &&
                  sameVariant
                );
              }
            );

          set({
            items: nextItems,
          });

          return;
        }

        const currentItems =
          get().items;

        const nextItems =
          currentItems.map(
            (item) => {
              const sameProduct =
                item.product.id === id;

              const sameVariant =
                (item.product.variant_id ??
                  undefined) ===
                (variant_id ??
                  undefined);

              if (
                sameProduct &&
                sameVariant
              ) {
                return {
                  ...item,
                  quantity:
                    safeQuantity,
                };
              }

              return item;
            }
          );

        set({
          items: nextItems,
        });
      },

      /**
       * =====================================================
       * LIMPAR
       * =====================================================
       */
      clear: () => {
        set({
          items: [],
        });

        if (
          typeof window !==
          "undefined"
        ) {
          localStorage.removeItem(
            "ignite_cart_v2"
          );
        }
      },
    }),

    {
      name: "ignite_cart_v2",

      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

/**
 * Quantidade total do carrinho.
 */
export const useCartCount = () =>
  useCart((state) =>
    state.items.reduce(
      (total, item) => {
        const quantity = Number(
          item.quantity
        );

        if (
          !Number.isFinite(
            quantity
          ) ||
          quantity <= 0
        ) {
          return total;
        }

        return total + quantity;
      },
      0
    )
  );