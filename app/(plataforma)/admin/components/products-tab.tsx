"use client";

import { Eye, EyeOff, Pencil, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteProductService,
  toggleProductActiveService,
} from "../services/admin-service";

import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { EmptyState } from "./EmptyState";
import { revalidateProductFull, revalidateProductById, revalidateProductsList } from "@/lib/actions/revalidate";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ProductRow } from "../types/admin-types";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ProductForm = dynamic(() => import("./product-form").then((module) => module.ProductForm), {
  loading: () => <Skeleton className="h-52 w-full" role="status" aria-label="Carregando formulário de produto" />,
});

interface ProductsTabProps {
  products: ProductRow[];
}

export function ProductsTab({ products }: ProductsTabProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  
  const [productToDelete, setProductToDelete] = useState<ProductRow | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProductService(id),
    onSuccess: async (_, id) => {
      await revalidateProductFull(id);
      toast.success("Mimo removido definitivamente do catálogo.");
      queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      setProductToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao excluir mimo.");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({
      id,
      currentStatus,
    }: {
      id: string;
      currentStatus: boolean;
    }) => toggleProductActiveService(id, currentStatus),
    onSuccess: async (_, variables) => {
      await Promise.all([
        revalidateProductById(variables.id),
        revalidateProductsList()
      ]);
      toast.success(
        variables.currentStatus
          ? "Mimo ocultado da vitrine."
          : "Mimo reativado na vitrine!",
      );
      queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleOpenDeleteModal = (
    e: React.MouseEvent,
    product: ProductRow,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setProductToDelete(product);
  };

  const handleToggleActiveClick = (
    e: React.MouseEvent,
    product: ProductRow,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const statusAtual = product.ativo !== false;

    toggleActiveMutation.mutate({ id: product.id, currentStatus: statusAtual });
  };

  if (creating || editing) {
    const closeEditor = () => {
      setCreating(false);
      setEditing(null);
    };
    return <ProductForm product={editing} onClose={closeEditor} onSaved={closeEditor} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-brand-ink">Catálogo de produtos</h2>
        <Button onClick={() => setCreating(true)}><Plus /> Novo mimo</Button>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 min-[430px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const isAtivo = product.ativo !== false;

            return (
              <div
                key={product.id}
                className="relative min-w-0"
              >
                <ProductCard
                  product={product as any}
                  isAdmin={true}
                  actions={
                    <div className="flex gap-1.5 w-full pt-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setEditing(product);
                        }}
                        className="size-9 p-0"
                        aria-label={`Editar ${product.nome}`}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant={isAtivo ? "outline" : "default"}
                        onClick={(e) => handleToggleActiveClick(e, product)}
                        disabled={toggleActiveMutation.isPending}
                        className="flex-1"
                        aria-label={isAtivo ? `Ocultar ${product.nome}` : `Ativar ${product.nome}`}
                        title={isAtivo ? "Ocultar" : "Ativar"}
                      >
                        {isAtivo ? (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        <span className="inline">
                          {isAtivo ? "Ocultar" : "Ativar"}
                        </span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleOpenDeleteModal(e, product)}
                        className="size-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Excluir ${product.nome}`}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Nenhum mimo encontrado no catálogo" iconType="product" />
      )}

      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && !deleteMutation.isPending && setProductToDelete(null)}>
        <DialogContent showCloseButton={!deleteMutation.isPending} className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">
              Excluir mimo definitivamente?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground space-y-2">
              <span>
                Você está prestes a apagar permanentemente o item{" "}
                <strong className="text-foreground font-semibold">
                  "{productToDelete?.nome}"
                </strong>
                . Esta ação não poderá ser desfeita.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 rounded-2xl p-3 text-xs text-muted-foreground space-y-1 my-2 border">
            <p>• O item será removido da vitrine e do painel administrativo.</p>
            <p>• O histórico de pedidos antigos continuará preservado com segurança.</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="font-medium"
              onClick={() => setProductToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="font-semibold"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (productToDelete) {
                  deleteMutation.mutate(productToDelete.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Sim, excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}