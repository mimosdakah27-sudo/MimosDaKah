"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";
import { getProductShippingQuote } from "@/lib/actions/shipping";
import { formatBRL } from "@/lib/utils";

export function ProductShipping({ productId }: { productId: string }) {
  const [zip, setZip] = useState("");
  const [settledZip, setSettledZip] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    try {
      const previous = sessionStorage.getItem("catalog-shipping-zip");
      if (previous && /^\d{8}$/.test(previous)) setZip(previous);
    } catch { /* Storage is optional in private browsing. */ }
  }, []);

  useEffect(() => {
    if (zip.length !== 8) return;
    const timer = window.setTimeout(() => {
      setSettledZip(zip);

    }, 350);
    return () => window.clearTimeout(timer);
  }, [zip]);

  const ready = zip.length === 8 && zip === settledZip;
  const quote = useQuery({
    queryKey: ["product-shipping", productId, zip],
    enabled: ready,
    queryFn: () => getProductShippingQuote(productId, zip),
    staleTime: (query) => query.state.data?.ok ? 5 * 60_000 : 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const result = ready ? quote.data : undefined;
  const incomplete = touched && zip.length > 0 && zip.length < 8;

  return (
    <section aria-labelledby="shipping-heading" className="rounded-[var(--panel-radius)] bg-brand-surface p-4 text-brand-ink sm:p-5">
      <h2 id="shipping-heading" className="flex items-center gap-2 font-semibold">
        <Truck aria-hidden className="size-5 text-brand-action" /> Calcular frete
      </h2>
      <label htmlFor="shipping-zip" className="mb-1.5 mt-3 block text-sm">CEP de entrega</label>
      <input id="shipping-zip" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
        aria-describedby="shipping-result" aria-invalid={incomplete}
        value={zip.replace(/^(\d{5})(\d+)/, "$1-$2")}
        onBlur={() => setTouched(true)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
          setZip(digits);
          try {
            if (digits.length === 8) sessionStorage.setItem("catalog-shipping-zip", digits);
            else sessionStorage.removeItem("catalog-shipping-zip");
          } catch { /* A consulta também funciona sem armazenamento local. */ }
        }}
        className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-card text-foreground placeholder:text-brand-muted px-3 text-base tabular-nums outline-none focus:ring-2 focus:ring-brand-action" />
      <div id="shipping-result" role="status" aria-live="polite" aria-atomic="true" className="mt-2 min-h-5 text-sm">
        {zip.length === 8 && (!ready || quote.isFetching) ? "Calculando entrega…" :
          result?.ok ? (
            <div className="mt-3 flex justify-between gap-3 border-t border-border pt-3">
              <div>{result.label}{result.deliveryTime != null && <p className="text-xs">Prazo estimado de {result.deliveryTime} {result.deliveryTime === 1 ? "dia útil" : "dias úteis"}</p>}</div>
              <strong className="shrink-0">{result.price === 0 ? "Grátis" : formatBRL(result.price)}</strong>
            </div>
          ) : ready && (quote.isError || result?.ok === false) ? (
            <><p>{result?.ok === false ? result.message : "Não foi possível consultar o frete agora."}</p>
            <button type="button" onClick={() => quote.refetch()} className="mt-1 font-semibold underline">Tentar novamente</button></>
          ) : incomplete ? "Complete os 8 dígitos do CEP." : "Consulte a entrega de uma unidade."}
      </div>
    </section>
  );
}
