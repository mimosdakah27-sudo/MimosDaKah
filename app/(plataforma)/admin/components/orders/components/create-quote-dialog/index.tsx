"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Loader2, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { useCreateQuote } from "./hook/use-create-quote";

export function CreateQuoteDialog({ onCreated }: { onCreated?: () => void }) {
  const {
    open,
    setOpen,
    customers,
    products,
    isLoadingOptions, optionsFailed, retryOptions,
    isSubmitting,
    openCustomerCombo,
    setOpenCustomerCombo,
    selectedCustomer,
    setSelectedCustomer,
    openProductCombo,
    setOpenProductCombo,
    selectedProduct,
    setSelectedProduct,
    price,
    setPrice,
    quantity,
    setQuantity,
    observation,
    setObservation,
    handleSubmit,
  } = useCreateQuote(onCreated);

  const parsedPrice = parseFloat(price.replace(",", ".")) || 0;
  const parsedQty = parseInt(quantity, 10) || 0;
  const calculatedTotal = parsedPrice * parsedQty;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isSubmitting) setOpen(next); }}>
      <DialogTrigger
        nativeButton={true}
        render={
          <Button variant="outline">
            <PlusCircle className="h-4 w-4" /> Criar orçamento
          </Button>
        }
      />

      <DialogContent showCloseButton={!isSubmitting} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Novo Orçamento</DialogTitle>
          <DialogDescription>
            Gere um orçamento customizado negociado via WhatsApp. O cliente
            receberá uma notificação para concluir o pagamento e calcular o
            frete.
          </DialogDescription>
        </DialogHeader>

        <form className="min-w-0" onSubmit={handleSubmit}>
          <fieldset disabled={isSubmitting} className="min-w-0 space-y-4">
            {optionsFailed && <div role="alert" className="space-y-2">
              <p>Não foi possível carregar os clientes e produtos.</p>
              <Button type="button" variant="outline" onClick={() => retryOptions()}>Tentar novamente</Button>
            </div>}
            {/* Combobox Cliente */}
            <div className="min-w-0 space-y-1.5 flex flex-col">
              <Label id="quote-customer-label">Cliente *</Label>
              <Popover
                open={openCustomerCombo}
                onOpenChange={setOpenCustomerCombo}
              >
                <PopoverTrigger
                  nativeButton={true}
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-labelledby="quote-customer-label"
                      aria-expanded={openCustomerCombo}
                      className="justify-between w-full font-normal"
                      disabled={isLoadingOptions || optionsFailed}
                    >
                      <span className="min-w-0 truncate">{selectedCustomer
                        ? `${selectedCustomer.display_name ?? "Cliente"} (${selectedCustomer.email ?? "Sem email"})`
                        : "Selecione o cliente..."}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  }
                />
                <PopoverContent className="w-[min(25rem,calc(100vw-3rem))] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente por nome ou e-mail..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((c) => (
                          <CommandItem
                            key={c.user_id}
                            className="min-h-11"
                            value={`${c.display_name ?? ""} ${c.email ?? ""}`}
                            onSelect={() => {
                              setSelectedCustomer(c);
                              setOpenCustomerCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomer?.user_id === c.user_id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <div className="flex min-w-0 flex-col [overflow-wrap:anywhere]">
                              <span className="font-medium text-sm">
                                {c.display_name ?? "Sem nome"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {c.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Combobox Produto */}
            <div className="min-w-0 space-y-1.5 flex flex-col">
              <Label id="quote-product-label">Produto base *</Label>
              <Popover open={openProductCombo} onOpenChange={setOpenProductCombo}>
                <PopoverTrigger
                  nativeButton={true}
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-labelledby="quote-product-label"
                      aria-expanded={openProductCombo}
                      className="justify-between w-full font-normal"
                      disabled={isLoadingOptions || optionsFailed}
                    >
                      <span className="min-w-0 truncate">{selectedProduct
                        ? selectedProduct.nome
                        : "Selecione o produto..."}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  }
                />
                <PopoverContent className="w-[min(25rem,calc(100vw-3rem))] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar produto..." />
                    <CommandList>
                      <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                      <CommandGroup>
                        {products.map((p) => (
                          <CommandItem
                            key={p.id}
                            className="min-h-11"
                            value={p.nome}
                            onSelect={() => {
                              setSelectedProduct(p);
                              if (!price && p.preco) {
                                setPrice(String(p.preco));
                              }
                              setOpenProductCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProduct?.id === p.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span className="min-w-0 [overflow-wrap:anywhere]">{p.nome}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Valor Unitário e Quantidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quote-price">Valor Unitário (R$) *</Label>
                <Input
                  id="quote-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-qty">Quantidade *</Label>
                <Input
                  id="quote-qty"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            {/* Subtotal */}
            {calculatedTotal > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center text-sm font-medium">
                <span className="text-muted-foreground">Valor Total do Pedido:</span>
                <span className="text-primary font-bold text-base">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(calculatedTotal)}
                </span>
              </div>
            )}

            {/* Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="quote-obs">
                Observações / Detalhes de Personalização
              </Label>
              <Textarea
                id="quote-obs"
                placeholder="Ex: Nome gravado em dourado, tamanho especial G..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                rows={3}
              />
            </div>

          </fieldset>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingOptions || optionsFailed}
            className="mt-4 min-h-[var(--action-height)] w-full"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : null}
            Gerar e Enviar Orçamento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
