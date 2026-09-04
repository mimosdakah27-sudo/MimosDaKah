"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { supabaseBrowser } from "@/lib/supabase/client";

import {
  updateOrderStatusService,
  updatePaymentStatusService,
  updateRefundStatusService,
} from "../services/admin-service";

export function useAdminOrders() {
  const queryClient = useQueryClient();
  const supabase = supabaseBrowser();

  /**
   * Atualização do status do pedido.
   */
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) =>
      updateOrderStatusService(id, status),

    onSuccess: () => {
      toast.success(
        "Status do pedido atualizado.",
      );

      queryClient.invalidateQueries({
        queryKey: ["admin-data"],
      });
    },

    onError: (err: any) => {
      toast.error(
        err.message ||
          "Não foi possível atualizar o status do pedido.",
      );
    },
  });

  /**
   * Atualização do status do pagamento.
   *
   * pending = pagamento pendente
   * paid    = pagamento confirmado
   */
  const paymentMutation = useMutation({
    mutationFn: ({
      id,
      paymentStatus,
    }: {
      id: string;
      paymentStatus: string;
    }) =>
      updatePaymentStatusService(
        id,
        paymentStatus,
      ),

    onSuccess: () => {
      toast.success(
        "Status do pagamento atualizado.",
      );

      queryClient.invalidateQueries({
        queryKey: ["admin-data"],
      });
    },

    onError: (err: any) => {
      toast.error(
        err.message ||
          "Não foi possível atualizar o pagamento.",
      );
    },
  });

  /**
   * Status de reembolso.
   *
   * Mantido porque o campo ainda existe
   * no banco e pode ser utilizado futuramente.
   */
  const refundMutation = useMutation({
    mutationFn: ({
      id,
      refundStatus,
    }: {
      id: string;
      refundStatus: string;
    }) =>
      updateRefundStatusService(
        id,
        refundStatus,
      ),

    onSuccess: () => {
      toast.success(
        "Status do reembolso atualizado.",
      );

      queryClient.invalidateQueries({
        queryKey: ["admin-data"],
      });
    },

    onError: (err: any) => {
      toast.error(
        err.message ||
          "Não foi possível atualizar o reembolso.",
      );
    },
  });

  /**
   * Arquivar / desarquivar pedido.
   */
  const archiveMutation = useMutation({
    mutationFn: async ({
      id,
      is_archived,
    }: {
      id: string;
      is_archived: boolean | null;
    }) => {
      const { error } = await (
        supabase.from("orders") as any
      )
        .update({
          is_archived,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      toast.success(
        "Pedido atualizado com sucesso.",
      );

      queryClient.invalidateQueries({
        queryKey: ["admin-data"],
      });
    },

    onError: (err: any) => {
      toast.error(
        err.message ||
          "Não foi possível atualizar o pedido.",
      );
    },
  });

  return {
  updateStatus: statusMutation.mutate,

  updatePaymentStatus:
    paymentMutation.mutate,

  updateRefund:
    refundMutation.mutate,

  updateArchive:
    archiveMutation.mutate,

  isStatusPending:
    statusMutation.isPending,

  isPaymentStatusPending:
    paymentMutation.isPending,

  isRefundPending:
    refundMutation.isPending,

  isArchivePending:
    archiveMutation.isPending,
};
}