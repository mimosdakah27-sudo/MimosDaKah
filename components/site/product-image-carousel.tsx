"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { CatalogImage } from "./catalog-image";

export function ProductImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const multiple = images.length > 1;
  const [viewport, carousel] = useEmblaCarousel({
    loop: multiple,
    breakpoints: { "(prefers-reduced-motion: reduce)": { duration: 0 } },
  });
  const [selected, setSelected] = useState(0);
  const sizes = multiple
    ? "(min-width: 1248px) 546px, (min-width: 1024px) calc(58.33vw - 182px), (min-width: 768px) calc(100vw - 162px), (min-width: 640px) calc(100vw - 138px), calc(100vw - 50px)"
    : "(min-width: 1248px) 626px, (min-width: 1024px) calc(58.33vw - 102px), (min-width: 768px) calc(100vw - 82px), calc(100vw - 50px)";

  useEffect(() => {
    if (!carousel) return;
    const onSelect = () => setSelected(carousel.selectedScrollSnap());
    carousel.on("select", onSelect).on("reInit", onSelect);
    onSelect();
    return () => { carousel.off("select", onSelect).off("reInit", onSelect); };
  }, [carousel]);

  const arrowClass = "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-control bg-background text-foreground shadow-sm hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand-action sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 motion-safe:transition-opacity";

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm sm:flex-row sm:gap-4 sm:p-4">
      <div className="group relative order-1 aspect-square w-full min-w-0 overflow-hidden rounded-xl bg-muted sm:order-2 sm:aspect-[5/4] sm:flex-1">
        {images.length ? (
          <div ref={viewport} className="h-full w-full touch-pan-y overflow-hidden">
            <div className="flex h-full">
              {images.map((src, index) => {
                const distance = Math.abs(index - selected);
                // A Embla mede todos os slides. Só as fotos adjacentes precisam estar prontas para o gesto.
                const nearby = index === selected || (carousel && Math.min(distance, images.length - distance) <= 1);
                return (
                  <div key={src} className="relative h-full min-w-0 flex-[0_0_100%]">
                    {nearby && <CatalogImage src={src} alt={`${alt}, foto ${index + 1}`} priority={index === 0} sizes={sizes} className="object-contain p-2" />}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem imagem</div>
        )}

        {multiple && <>
          <button type="button" aria-label="Imagem anterior" onClick={() => carousel?.scrollPrev()} className={cn(arrowClass, "left-2")}>
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Próxima imagem" onClick={() => carousel?.scrollNext()} className={cn(arrowClass, "right-2")}>
            <ChevronRight size={19} aria-hidden="true" />
          </button>
        </>}
      </div>

      {multiple && (
        <div className="order-2 flex max-h-[450px] gap-2 overflow-x-auto py-1 sm:order-1 sm:flex-col sm:overflow-y-auto sm:py-0">
          {images.map((src, index) => (
            <button key={src} type="button" onClick={() => carousel?.scrollTo(index, true)}
              aria-label={`Selecionar imagem ${index + 1}`} aria-pressed={index === selected}
              className="relative size-14 shrink-0 overflow-hidden rounded-lg border-2 border-border bg-muted opacity-75 hover:opacity-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-action aria-pressed:border-brand-action aria-pressed:opacity-100 sm:size-16">
              <CatalogImage src={src} alt="" sizes="(min-width: 640px) 64px, 56px" quality={60} className="object-cover" compact />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
