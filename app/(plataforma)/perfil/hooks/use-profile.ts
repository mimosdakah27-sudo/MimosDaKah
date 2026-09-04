import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";

import {
  getUserOrders,
  rejectQuote,
} from "../services/profile-service";

import type { OrderWithItems } from "../types/profile-type";

export function useProfile() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [
    orders,
    setOrders,
  ] = useState<OrderWithItems[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const fetchOrders =
    useCallback(async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data =
          await getUserOrders(
            user.id,
          );

        setOrders(data);
      } catch (error: any) {
        toast.error(
          error?.message ||
            "Erro ao carregar seus pedidos.",
        );
      } finally {
        setLoading(false);
      }
    }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    // Se não estiver logado, apenas para o loading e não busca nada no banco
    if (!user) {
      setLoading(false);
      return;
    }

    fetchOrders();
  }, [
    user,
    authLoading,
    fetchOrders,
  ]);

  /**
   * Remove um orçamento recusado.
   */
  const handleRejectQuote =
    useCallback(
      async (
        orderId: string,
      ) => {
        try {
          await rejectQuote(
            orderId,
          );

          setOrders(
            (currentOrders) =>
              currentOrders.filter(
                (order) =>
                  order.id !==
                  orderId,
              ),
          );

          toast.success(
            "Orçamento recusado com sucesso.",
          );
        } catch (error: any) {
          console.error(
            "Erro ao recusar orçamento:",
            error,
          );

          toast.error(
            error?.message ||
              "Não foi possível recusar o orçamento.",
          );
        }
      },
      [],
    );

  return {
    user,
    orders,
    isInitialLoading:
      authLoading || loading,
    handleRejectQuote,
  };
}