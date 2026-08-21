"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getAdminDashboardData } from "../services/admin-service";

export type StatusFilterType = "todos" | "ativos" | "inativos";
export type OrderTabType = "pendentes" | "arquivados";

export function useAdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<"produtos" | "pedidos">("produtos");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilterType>("todos");

  const [searchTerm, setSearchTerm] = useState("");
  const [orderTab, setOrderTab] =
    useState<OrderTabType>("pendentes");
  const [orderStatusFilter, setOrderStatusFilter] =
    useState<string>("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-data"],
    queryFn: getAdminDashboardData,
    enabled: !!user && isAdmin,
    refetchInterval: 10000,
    staleTime: 0,
  });

  // URL -> estado da pesquisa
  useEffect(() => {
    const searchFromUrl = searchParams.get("search") ?? "";

    if (searchFromUrl !== searchTerm) {
      setSearchTerm(searchFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/");
    }
  }, [user, isAdmin, authLoading, router]);

  const filteredProducts = useMemo(() => {
    const allProducts = data?.products ?? [];

    if (statusFilter === "ativos") {
      return allProducts.filter((p: any) => p.ativo !== false);
    }

    if (statusFilter === "inativos") {
      return allProducts.filter((p: any) => p.ativo === false);
    }

    return allProducts;
  }, [data?.products, statusFilter]);

  const filteredOrders = useMemo(() => {
    const allOrders = data?.orders ?? [];

    let list = allOrders.filter((o: any) =>
      orderTab === "pendentes"
        ? !o.is_archived
        : o.is_archived
    );

    if (orderStatusFilter !== "todos") {
      list = list.filter(
        (o: any) => o.status === orderStatusFilter
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm
        .trim()
        .replace(/^#/, "")
        .toLowerCase();

      list = list.filter((o: any) => {
        const orderId = String(o.id ?? "").toLowerCase();

        const protocol = String(
          o.melhor_envio_protocol ?? ""
        ).toLowerCase();

        const document = String(
          o.shipping_document ?? ""
        ).replace(/\D/g, "");

        // Código reduzido do pedido.
        // IMPORTANTE:
        // use aqui EXATAMENTE a mesma regra
        // usada para mostrar o código na interface.
        const orderCode = orderId.slice(0, 4);

        return (
          orderCode.includes(term) ||
          orderId.includes(term) ||
          protocol.includes(term) ||
          document.includes(term)
        );
      });
    }

    return list;
  }, [
    data?.orders,
    searchTerm,
    orderTab,
    orderStatusFilter,
  ]);

  return {
    tab,
    setTab,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    orderTab,
    setOrderTab,
    orderStatusFilter,
    setOrderStatusFilter,
    products: filteredProducts,
    orders: filteredOrders,
    isInitialLoading: authLoading || isLoading,
    isAdmin,
  };
}