"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "./components/EmptyState";
import { OrdersTab } from "./components/orders/orders-tab";
import { ProductsTab } from "./components/products-tab";
import {
  useAdminDashboard,
  type StatusFilterType,
} from "./hooks/use-admin-dashboard";
import { CreateQuoteDialog } from "./components/orders/components/create-quote-dialog";

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    tab,
    setTab,
    statusFilter,
    setStatusFilter,
    products,
    orders,
    searchTerm,
    setSearchTerm,
    orderTab,
    setOrderTab,
    orderStatusFilter,
    setOrderStatusFilter,
  } = useAdminDashboard();

  /**
   * Sincroniza a aba e a pesquisa com a URL.
   */
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const rawSearch = searchParams.get("search") ?? "";
    const cleanSearchFromUrl = rawSearch.replace(/#/g, "").trim();

    // Se houver busca e não houver hash, vai para 'pedidos' por padrão
    if (cleanSearchFromUrl && !hash) {
      if (tab !== "pedidos") {
        setTab("pedidos");
      }
    } else if (hash === "pedidos" || hash === "produtos") {
      if (tab !== hash) {
        setTab(hash as "produtos" | "pedidos");
      }
    }

    if (cleanSearchFromUrl !== searchTerm) {
      setSearchTerm(cleanSearchFromUrl);
    }
  }, [searchParams, searchTerm, tab, setSearchTerm, setTab]);

  const handleTabChange = (newTab: "produtos" | "pedidos") => {
    setTab(newTab);

    const params = new URLSearchParams(searchParams.toString());
    const queryString = params.toString();

    router.replace(
      `/admin${queryString ? `?${queryString}` : ""}#${newTab}`,
      {
        scroll: false,
      }
    );
  };

  /**
   * Atualiza o termo de pesquisa e a URL simultaneamente.
   * Permite que o usuário digite com '#' sem quebrar a busca.
   */
  const handleSearchChange = (value: string) => {
    const cleanValue = value.replace(/#/g, "").trim();
    setSearchTerm(cleanValue);

    const params = new URLSearchParams(searchParams.toString());

    if (cleanValue) {
      params.set("search", cleanValue);
    } else {
      params.delete("search");
    }

    const currentHash = window.location.hash || `#${tab}`;
    const queryString = params.toString();

    router.replace(
      `/admin${queryString ? `?${queryString}` : ""}${currentHash}`,
      {
        scroll: false,
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Administração
          </h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie o catálogo de produtos, fluxo de pedidos e orçamentos.
          </p>
        </div>

        {/* AÇÕES E ABAS PRINCIPAIS */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* BOTÃO PARA CRIAR ORÇAMENTO */}
          <CreateQuoteDialog />

          <div className="flex gap-2 bg-muted/40 p-1 rounded-xl border border-border/50">
            <Button
              variant={tab === "produtos" ? "default" : "ghost"}
              className={`rounded-lg font-semibold text-sm px-4 ${
                tab === "produtos" ? "text-white" : ""
              }`}
              onClick={() => handleTabChange("produtos")}
            >
              Produtos
            </Button>

            <Button
              variant={tab === "pedidos" ? "default" : "ghost"}
              className={`rounded-lg font-semibold text-sm px-4 ${
                tab === "pedidos" ? "text-white" : ""
              }`}
              onClick={() => handleTabChange("pedidos")}
            >
              Pedidos
            </Button>
          </div>
        </div>
      </div>

      {/* FILTROS E PESQUISA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
        {tab === "produtos" ? (
          /* FILTROS DE PRODUTOS */
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-muted-foreground mr-2">
              Status:
            </span>

            {(
              ["todos", "ativos", "inativos"] as StatusFilterType[]
            ).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={statusFilter === type ? "secondary" : "outline"}
                onClick={() => setStatusFilter(type)}
                className="capitalize h-8 rounded-lg text-xs"
              >
                {type}
              </Button>
            ))}
          </div>
        ) : (
          /* FILTROS DE PEDIDOS */
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-wrap gap-2 w-full">
              {/* PESQUISA */}
              <Input
                placeholder="Buscar por código do pedido (ID)..."
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="w-full sm:max-w-xs rounded-xl h-9 text-sm"
              />

              {/* STATUS */}
              <select
                className="h-9 px-3 rounded-xl border border-input bg-background text-xs"
                value={orderStatusFilter}
                onChange={(event) => setOrderStatusFilter(event.target.value)}
              >
                <option value="todos">Todos os Status</option>
                <option value="Aguardando Pagamento">
                  Aguardando Pagamento (Orçamentos)
                </option>
                <option value="Em Preparação">Em Preparação</option>
                <option value="pronto_para_retirada">Pronto p/ Retirada</option>
                <option value="preparando_entrega">Preparando Entrega</option>
                <option value="Etiqueta Paga">Etiqueta Paga</option>
                <option value="Postado">Postado</option>
                <option value="Entregue">Entregue</option>
              </select>
            </div>

            {/* ABAS DE PEDIDOS */}
            <div className="flex gap-1 bg-muted/40 p-0.5 rounded-lg border border-border w-fit">
              <Button
                size="sm"
                variant={orderTab === "pendentes" ? "default" : "ghost"}
                onClick={() => setOrderTab("pendentes")}
                className={`h-8 rounded-md text-xs ${
                  orderTab === "pendentes" ? "text-white" : ""
                }`}
              >
                Ativos
              </Button>

              <Button
                size="sm"
                variant={orderTab === "arquivados" ? "default" : "ghost"}
                onClick={() => setOrderTab("arquivados")}
                className={`h-8 rounded-md text-xs ${
                  orderTab === "arquivados" ? "text-white" : ""
                }`}
              >
                Arquivados
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CONTEÚDO */}
      {tab === "produtos" ? (
        <ProductsTab products={products} />
      ) : orders.length > 0 ? (
        <OrdersTab orders={orders} />
      ) : (
        <EmptyState
          title="Nenhum pedido encontrado"
          description="Tente ajustar os filtros ou termo de busca."
          iconType="order"
        />
      )}
    </div>
  );
}