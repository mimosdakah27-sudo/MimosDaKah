import { getShippingRates } from "@/lib/actions/shipping";
import { useQuery } from "@tanstack/react-query";

function normalizeZip(zip?: string) {
  return String(zip ?? "").replace(/\D/g, "");
}

export function useShipping(
  originZip: string | undefined,
  destinationZip: string | undefined,
  items: any[]
) {
  const normalizedOriginZip = normalizeZip(originZip);
  const normalizedDestinationZip =
    normalizeZip(destinationZip);

  const itemKeys = items.map(
    (item) =>
      `${item.product.id}:${item.quantity}`
  );

  /**
   * O frete do Melhor Envio só deve ser calculado
   * quando o CEP do cliente for diferente do CEP
   * da loja.
   */
  const isLocalZip =
    normalizedOriginZip.length === 8 &&
    normalizedDestinationZip.length === 8 &&
    normalizedOriginZip ===
      normalizedDestinationZip;

  const shouldCalculateShipping =
    normalizedOriginZip.length === 8 &&
    normalizedDestinationZip.length === 8 &&
    items.length > 0 &&
    !isLocalZip;

  return useQuery({
    queryKey: [
      "shipping-rates",
      normalizedOriginZip,
      normalizedDestinationZip,
      itemKeys,
    ],

    queryFn: async () => {
      if (!shouldCalculateShipping) {
        return null;
      }

      return getShippingRates(
        normalizedOriginZip,
        normalizedDestinationZip,
        items
      );
    },

    enabled: shouldCalculateShipping,

    staleTime: 1000 * 60 * 5,
  });
}