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
    isLoadingOptions,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={true}
        render={
          <Button className="gap-2 font-semibold">
            <PlusCircle className="h-4 w-4" /> Criar Orçamento
          </Button>
        }
      />

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Novo Orçamento</DialogTitle>
          <DialogDescription>
            Gere um orçamento customizado negociado via WhatsApp. O cliente
            receberá uma notificação para concluir o pagamento e calcular o
            frete.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Combobox Cliente */}
          <div className="space-y-1.5 flex flex-col">
            <Label>Cliente *</Label>
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
                    aria-expanded={openCustomerCombo}
                    className="justify-between w-full font-normal"
                    disabled={isLoadingOptions}
                  >
                    {selectedCustomer
                      ? `${selectedCustomer.display_name ?? "Cliente"} (${selectedCustomer.email ?? "Sem email"})`
                      : "Selecione o cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                }
              />
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cliente por nome ou e-mail..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((c) => (
                        <CommandItem
                          key={c.user_id}
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
                          <div className="flex flex-col">
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
          <div className="space-y-1.5 flex flex-col">
            <Label>Produto Base *</Label>
            <Popover open={openProductCombo} onOpenChange={setOpenProductCombo}>
              <PopoverTrigger
                nativeButton={true}
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openProductCombo}
                    className="justify-between w-full font-normal"
                    disabled={isLoadingOptions}
                  >
                    {selectedProduct
                      ? selectedProduct.nome
                      : "Selecione o produto..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                }
              />
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar produto..." />
                  <CommandList>
                    <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                    <CommandGroup>
                      {products.map((p) => (
                        <CommandItem
                          key={p.id}
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
                          <span>{p.nome}</span>
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

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full font-bold"
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