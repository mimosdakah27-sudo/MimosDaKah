"use server";

import { supabaseServer } from "@/lib/supabase/server";

type ShippingItem = {
  product: {
    id: string;
    preco: number;
    weight?: number | null;
    width?: number | null;
    height?: number | null;
    length?: number | null;
  };
  quantity: number;
};

type MelhorEnvioRate = {
  id: number | string;
  name?: string;
  price?: number | string;
  delivery_time?: number | string;
  error?: string | null;
};

export async function getShippingRates(
  originZip: string,
  destinationZip: string,
  items: ShippingItem[],
) {
  if (!originZip || !destinationZip) {
    throw new Error("CEP de origem ou destino não informado.");
  }

  if (!items.length) {
    throw new Error("Não há produtos para calcular o frete.");
  }

  const supabase = await supabaseServer();

  const { data: integration, error: integrationError } = await supabase
    .from("integrations")
    .select("access_token")
    .single();

  if (integrationError || !integration?.access_token) {
    console.error("[SHIPPING] Erro ao buscar integração:", integrationError);

    throw new Error("Configuração de frete não encontrada.");
  }

  /**
   * Prepara os produtos para o cálculo.
   *
   * O Melhor Envio será usado SOMENTE como
   * calculadora de preço.
   */
  const productsPayload = items.map((item) => ({
    id: item.product.id,

    width: Number(item.product.width) || 10,

    height: Number(item.product.height) || 10,

    length: Number(item.product.length) || 10,

    weight: Number(item.product.weight) || 0.1,

    insurance_value: Number(item.product.preco) || 0,

    quantity: Number(item.quantity) || 1,
  }));

  const baseUrl = process.env.MELHOR_ENVIO_URL;

  if (!baseUrl) {
    throw new Error("URL do Melhor Envio não configurada.");
  }

  const response = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${integration.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json",

      "User-Agent": "EcoStore/1.0",
    },

    body: JSON.stringify({
      from: {
        postal_code: originZip,
      },

      to: {
        postal_code: destinationZip,
      },

      products: productsPayload,

      options: {
        receipt: false,
        own_hand: false,
      },

      services: "1,2,18",
    }),

    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = "Falha ao calcular o frete.";

    try {
      const errorData = await response.json();

      console.error("[SHIPPING] Erro do Melhor Envio:", errorData);
    } catch {
      console.error("[SHIPPING] Status:", response.status);
    }

    throw new Error(errorMessage);
  }

  const result = (await response.json()) as MelhorEnvioRate[];

  /**
   * Remove respostas inválidas.
   */
  const validRates = result.filter(
    (rate) => rate && rate.price != null && !rate.error,
  );

  if (!validRates.length) {
    throw new Error(
      "Não foi possível encontrar um valor de frete para este CEP.",
    );
  }

  /**
   * Converte os valores para números.
   */
  const normalizedRates = validRates.map((rate) => ({
    id: String(rate.id),

    price: Number(rate.price) || 0,

    delivery_time: Number(rate.delivery_time) || 0,
  }));

  /**
   * Escolhe UMA única opção.
   *
   * Regra:
   * 1. menor prazo = mais rápida;
   * 2. em caso de empate, maior preço.
   */
  const selectedRate = normalizedRates.sort((a, b) => {
    if (a.delivery_time !== b.delivery_time) {
      return a.delivery_time - b.delivery_time;
    }

    return b.price - a.price;
  })[0];

  /**
   * O frontend NÃO precisa conhecer:
   * - Correios
   * - Jadlog
   * - SEDEX
   * - nome da transportadora
   * - serviço utilizado
   *
   * Ele recebe apenas o necessário para
   * mostrar o valor do frete.
   */
  return [
    {
      id: "Entrega em outra cidade",

      price: Number(selectedRate.price.toFixed(2)),

      delivery_time: selectedRate.delivery_time,
    },
  ];
}
