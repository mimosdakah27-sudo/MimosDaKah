import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getUserOrders, rejectQuote } from "../services/profile-service";
import type { OrderWithItems } from "../types/profile-type";

export function useProfile() {
  const { user, loading } = useAuth();
  const client = useQueryClient();
  const key = ["profile-orders", user?.id];
  const orders = useQuery({
    queryKey: key,
    queryFn: () => getUserOrders(user!.id),
    enabled: !!user,
    staleTime: 0,
  });
  const reject = useMutation({
    mutationFn: rejectQuote,
    onSuccess: (_, orderId) => {
      client.setQueryData<OrderWithItems[]>(key, (data) => data?.filter((order) => order.id !== orderId));
      toast.success("Orçamento recusado.");
    },
    onError: () => toast.error("Não foi possível recusar o orçamento."),
  });
  return {
    user, orders: orders.data ?? [], isInitialLoading: loading || orders.isLoading,
    loadFailed: orders.isError, retry: orders.refetch, handleRejectQuote: reject.mutate, rejectingId: reject.isPending ? reject.variables : undefined,
  };
}
