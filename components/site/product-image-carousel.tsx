"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { CatalogImage } from "./catalog-image";

function ProductVideo({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    return () => video?.pause();
  }, []);
  return <video ref={ref} src={src} aria-label={label} controls playsInline preload="metadata"
    className="h-full w-full object-contain" />;
}

export function ProductImageCarousel({ images, videos, alt }: { images: string[]; videos: string[]; alt: string }) {
  const photos = images.map((src, index) => ({ src, video: false, label: `Foto ${index + 1}` }));
  const clips = videos.map((src, index) => ({ src, video: true, label: `Vídeo ${index + 1}` }));
  const slides = [...photos.slice(0, 1), ...clips, ...photos.slice(1)];
  const multiple = slides.length > 1;
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
        {slides.length ? (
          <div ref={viewport} className="h-full w-full touch-pan-y overflow-hidden">
            <div className="flex h-full">
              {slides.map(({ src, video, label }, index) => {
                const distance = Math.abs(index - selected);
                // A Embla mede todos os slides. Só as fotos adjacentes precisam estar prontas para o gesto.
                const nearby = index === selected || (carousel && Math.min(distance, slides.length - distance) <= 1);
                return (
                  <div key={label} className="relative h-full min-w-0 flex-[0_0_100%]">
                    {video && index === selected && <ProductVideo src={src} label={`${alt}, ${label}`} />}
                    {!video && nearby && <CatalogImage src={src} alt={`${alt}, ${label}`} priority={index === 0} sizes={sizes} className="object-contain p-2" />}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem imagem</div>
        )}

        {multiple && <>
          <button type="button" aria-label="Mídia anterior" onClick={() => carousel?.scrollPrev()} className={cn(arrowClass, "left-2")}>
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Próxima mídia" onClick={() => carousel?.scrollNext()} className={cn(arrowClass, "right-2")}>
            <ChevronRight size={19} aria-hidden="true" />
          </button>
        </>}
      </div>

      {multiple && (
        <div className="order-2 flex max-h-[450px] gap-2 overflow-x-auto py-1 sm:order-1 sm:flex-col sm:overflow-y-auto sm:py-0">
          {slides.map(({ src, video, label }, index) => (
            <button key={label} type="button" onClick={() => carousel?.scrollTo(index, true)}
              aria-label={`Selecionar ${label.toLowerCase()}`} aria-pressed={index === selected}
              className="relative size-14 shrink-0 overflow-hidden rounded-lg border-2 border-border bg-muted opacity-75 hover:opacity-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-action aria-pressed:border-brand-action aria-pressed:opacity-100 sm:size-16">
              {video ? <span className="flex h-full flex-col items-center justify-center gap-1 text-brand-action">
                <Play size={16} aria-hidden="true" /><span className="text-xs">{label}</span>
              </span> : <CatalogImage src={src} alt="" sizes="(min-width: 640px) 64px, 56px" quality={60} className="object-cover" compact />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
