"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, maskBRL, parseDigitsToFloat, maskOnlyNumbers } from "@/lib/utils";

export function StepPricingWarranty() {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  
  const tipoVenda = watch("tipo_venda") || "normal";
  const garantiaTipo = watch("garantia_tipo");
  const permiteRetirada = watch("permite_retirada");
  const destaque = watch("destaque");
  
  const precoRaw = watch("preco");
  const precoPromoRaw = watch("preco_promocional");

  const preco = parseDigitsToFloat(precoRaw || 0);
  const precoPromocional = parseDigitsToFloat(precoPromoRaw || 0);

  let descontoPercentual = 0;
  if (preco > 0 && precoPromocional > 0 && precoPromocional < preco) {
    descontoPercentual = Math.round(((preco - precoPromocional) / preco) * 100);
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* SELETOR DE TIPO DE VENDA (EXCLUSIVO) */}
      <div className="space-y-1.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <Label className="text-sm font-medium text-brand-ink">
          Como este produto é vendido?
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {[
            { id: "normal", label: "Preço fixo", desc: "Mostra o preço no catálogo." },
            { id: "orcamento", label: "Sob Orçamento", desc: "A cliente pede o valor pelo WhatsApp." },
            { id: "whatsapp_finalizacao", label: "Finalizar no WhatsApp", desc: "A cliente pode enviar o pedido para a loja." },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={tipoVenda === item.id}
              onClick={() => {
                setValue("tipo_venda", item.id, { shouldValidate: true });
                if (item.id === "orcamento") {
                  setValue("preco", 0);
                  setValue("preco_promocional", null);
                }
              }}
              className={cn(
                "p-2.5 rounded-lg border text-left transition-all",
                tipoVenda === item.id 
                  ? "border-primary bg-primary/10 text-foreground shadow-xs ring-1 ring-primary" 
                  : "border-border/60 bg-card text-muted-foreground hover:border-border"
              )}
            >
              <div className="font-semibold text-xs text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* BLOCO DE PREÇOS (Oculto se for orçamento) */}
      {tipoVenda !== "orcamento" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          <div className="space-y-1">
            <Label htmlFor="product-price" className="text-sm font-medium text-brand-ink">
              Preço regular (R$)
            </Label>
            <Input id="product-price"
              placeholder="R$ 0,00" 
              value={maskBRL(precoRaw)}
              onChange={(e) => {
                const numericFloat = parseDigitsToFloat(e.target.value);
                setValue("preco", numericFloat, { shouldValidate: true });
              }}
              className={cn("text-base sm:text-sm", errors.preco && "border-destructive")}
            />
            {errors.preco && <span className="text-xs text-destructive block">{String(errors.preco.message)}</span>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="product-promo" className="text-sm font-medium text-brand-ink">
              Preço promocional (Opcional)
            </Label>
            <div className="relative flex items-center">
              <Input id="product-promo"
                placeholder="R$ 0,00" 
                value={maskBRL(precoPromoRaw)}
                onChange={(e) => {
                  const numericFloat = parseDigitsToFloat(e.target.value);
                  setValue("preco_promocional", numericFloat > 0 ? numericFloat : null, { shouldValidate: true });
                }}
                className={cn("text-base sm:text-sm pr-16", errors.preco_promocional && "border-destructive")}
              />
              
              {descontoPercentual > 0 && (
                <span className="absolute right-2 bg-success/10 text-success border border-success/25 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md whitespace-nowrap">
                  {descontoPercentual}% OFF
                </span>
              )}
            </div>
            {errors.preco_promocional && <span className="text-xs text-destructive block">{String(errors.preco_promocional.message)}</span>}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-brand-surface border border-border text-brand-action text-xs font-medium">
          ℹ️ Este produto está configurado para <strong>Orçamento</strong>. Os campos de preço foram ocultados e substituídos pelo botão de atendimento via WhatsApp.
        </div>
      )}

      <div className="space-y-2 pt-1 border-t border-border/40">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="permite_retirada"
            checked={permiteRetirada}
            onChange={(e) => setValue("permite_retirada", e.target.checked, { shouldValidate: true })}
            className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
          <Label htmlFor="permite_retirada" className="text-xs font-medium text-foreground cursor-pointer select-none">
            Permite retirada pessoalmente (ótimo para mimos locais)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="destaque"
            checked={destaque}
            onChange={(e) => setValue("destaque", e.target.checked, { shouldValidate: true })}
            className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
          <Label htmlFor="destaque" className="text-xs font-medium text-foreground cursor-pointer select-none">
            Marcar como destaque na página inicial
          </Label>
        </div>
      </div>

      <div className="space-y-1.5 pt-1 border-t border-border/40">
        <Label className="text-sm font-medium text-brand-ink">
          Garantia
        </Label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {[
            { id: "vendedor", label: "Vendedor" },
            { id: "fabrica", label: "Fábrica" },
            { id: "nenhuma", label: "Sem garantia" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={garantiaTipo === item.id}
              onClick={() => setValue("garantia_tipo", item.id, { shouldValidate: true })}
              className={cn(
                "p-2 sm:p-3 rounded-lg border text-center sm:text-left font-medium text-[11px] sm:text-xs transition-all truncate",
                garantiaTipo === item.id ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs" : "border-border/60 bg-card text-muted-foreground hover:border-border"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {errors.garantia_tipo && <span className="text-xs text-destructive block">{String(errors.garantia_tipo.message)}</span>}
      </div>

      {garantiaTipo !== "nenhuma" && (
        <div className="space-y-1 max-w-[160px] sm:max-w-xs">
          <Label className="text-sm font-medium text-brand-ink">
            Dias de garantia
          </Label>
          <Input 
            type="text" 
            value={watch("garantia_dias") ?? ""}
            onChange={(e) => {
              const numeric = maskOnlyNumbers(e.target.value);
              setValue("garantia_dias", numeric === "" ? 0 : Number(numeric), { shouldValidate: true });
            }}
            placeholder="Ex: 30" 
            className={cn("text-base sm:text-sm", errors.garantia_dias && "border-destructive")}
          />
          {errors.garantia_dias && <span className="text-xs text-destructive block">{String(errors.garantia_dias.message)}</span>}
        </div>
      )}
    </div>
  );
}