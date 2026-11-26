"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
  const pendingUrl = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();

  const {
    tab,
    setTab,
    statusFilter,
    setStatusFilter,
    isInitialLoading, loadFailed, retry,
    products,
    orders,
    searchTerm,
    setSearchTerm,
    orderTab,
    setOrderTab,
    orderStatusFilter,
    setOrderStatusFilter,
  } = useAdminDashboard();

  useEffect(() => {
    const syncFromUrl = () => {
      if (pendingUrl.current) clearTimeout(pendingUrl.current);
      const term = new URLSearchParams(window.location.search).get("search") || "";
      setSearchTerm(term);
      setTab(window.location.hash === "#pedidos" || (!window.location.hash && term) ? "pedidos" : "produtos");
    };
    syncFromUrl();
    window.addEventListener("hashchange", syncFromUrl);
    window.addEventListener("popstate", syncFromUrl);
    return () => {
      if (pendingUrl.current) clearTimeout(pendingUrl.current);
      window.removeEventListener("hashchange", syncFromUrl);
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, [searchParams, setSearchTerm, setTab]);

  function handleTabChange(newTab: "produtos" | "pedidos") {
    setTab(newTab);
    const url = new URL(window.location.href);
    url.hash = newTab;
    window.history.replaceState(null, "", url);
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    if (pendingUrl.current) clearTimeout(pendingUrl.current);
    pendingUrl.current = setTimeout(() => {
      const url = new URL(window.location.href);
      if (value.trim()) url.searchParams.set("search", value.trim());
      else url.searchParams.delete("search");
      url.hash ||= "pedidos";
      window.history.replaceState(null, "", url);
    }, 300);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="page-title">Administração</h1>
            <p className="text-sm text-brand-muted">Gerencie os produtos e acompanhe os pedidos da loja.</p>
          </div>
          <CreateQuoteDialog />
        </div>
        <nav aria-label="Seções da administração" className="flex gap-1 border-b">
          {(["produtos", "pedidos"] as const).map((section) => (
            <button key={section} type="button" aria-current={tab === section ? "page" : undefined}
              onClick={() => handleTabChange(section)}
              className="min-h-11 border-b-2 border-transparent px-4 text-sm font-semibold capitalize text-brand-muted hover:text-brand-action aria-[current=page]:border-brand-action aria-[current=page]:text-brand-action">
              {section}
            </button>
          ))}
        </nav>
      </header>
      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {tab === "produtos" ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-brand-muted">
              Status:
            </span>

            {(
              ["todos", "ativos", "inativos"] as StatusFilterType[]
            ).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={
                  statusFilter === type
                    ? "secondary"
                    : "outline"
                }
                onClick={() => setStatusFilter(type)}
                aria-pressed={statusFilter === type}
                className="capitalize aria-pressed:bg-brand-tint aria-pressed:text-brand-action"
              >
                {type}
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-wrap gap-2 w-full">
              {/* PESQUISA */}
              <Input
                aria-label="Buscar por código do pedido" placeholder="Buscar por código do pedido"
                value={searchTerm}
                onChange={(event) =>
                  handleSearchChange(event.target.value)
                }
                className="w-full sm:max-w-xs"
              />

              {/* STATUS DO PEDIDO */}
              <select
                aria-label="Filtrar por status do pedido"
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm sm:w-auto"
                value={orderStatusFilter}
                onChange={(event) =>
                  setOrderStatusFilter(event.target.value)
                }
              >
                <option value="todos">
                  Todos os Status
                </option>

                <option value="Aguardando confirmação">
                  Aguardando confirmação
                </option>

                <option value="Em preparação">
                  Em preparação
                </option>

                <option value="Pronto para retirada">
                  Pronto para retirada
                </option>

                <option value="Saiu para entrega">
                  Saiu para entrega
                </option>

                <option value="Entregue">
                  Entregue
                </option>

                <option value="Cancelado">
                  Cancelado
                </option>
              </select>
            </div>

            {/* ABAS DE PEDIDOS */}
            <div className="flex gap-1 bg-muted/40 p-0.5 rounded-lg border border-border w-fit">
              <Button
                size="sm"
                variant={
                  orderTab === "pendentes"
                    ? "default"
                    : "ghost"
                }
                onClick={() =>
                  setOrderTab("pendentes")
                }
                aria-pressed={orderTab === "pendentes"}
              >
                Ativos
              </Button>

              <Button
                size="sm"
                variant={
                  orderTab === "arquivados"
                    ? "default"
                    : "ghost"
                }
                onClick={() =>
                  setOrderTab("arquivados")
                }
                aria-pressed={orderTab === "arquivados"}
              >
                Arquivados
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CONTEÚDO */}
      {isInitialLoading ? (
        <div aria-label="Carregando dados" role="status" className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((id) => <div key={id} className="h-36 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : loadFailed ? (
        <div role="alert" className="space-y-3">
          <p>Não foi possível carregar os {tab}.</p>
          <Button variant="outline" onClick={() => void retry()}>Tentar novamente</Button>
        </div>
      ) : tab === "produtos" ? (
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