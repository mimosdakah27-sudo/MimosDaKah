import { getShippingRates } from "@/lib/actions/shipping";
import { useQuery } from "@tanstack/react-query";

type ShippingItem = { product: { id: string }; quantity: number };

export function useShipping(
  originZip: string | undefined,
  destinationZip: string | undefined,
  items: ShippingItem[],
) {
  const origin = originZip?.replace(/\D/g, "") ?? "";
  const destination = destinationZip?.replace(/\D/g, "") ?? "";
  const shippingItems = items.map(({ product, quantity }) => ({ product: { id: product.id }, quantity }));

  return useQuery({
    queryKey: ["shipping-rates", origin, destination, shippingItems],
    queryFn: () => getShippingRates(origin, destination, shippingItems),
    enabled: origin.length === 8 && destination.length === 8 && shippingItems.length > 0,
    staleTime: (query) => query.state.data?.ok ? 5 * 60 * 1000 : 0,
    retry: false,
  });
}
