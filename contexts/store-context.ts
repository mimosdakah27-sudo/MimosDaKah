// contexts/store-context.ts
"use client";

import { createContext } from "react";

export interface StoreConfig {
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip_code: string;
  address: string;
  allow_local_pickup: boolean;
  allow_local_delivery: boolean;
  local_delivery_fee: number;
  fixed_delivery_fee: number; // Campo adicionado para a taxa fixa de entrega local
}

export interface StoreContextType {
  config: StoreConfig | null;
  isLoading: boolean;
}

export const StoreContext = createContext<StoreContextType>({
  config: null,
  isLoading: true,
});