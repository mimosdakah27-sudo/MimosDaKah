"use client";

import { ImageOff } from "lucide-react";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type CatalogImageProps = Pick<ImageProps, "alt" | "className" | "priority" | "sizes" | "quality"> & {
  src: string | null | undefined;
  compact?: boolean;
};

function isCatalogImage(src?: string | null): src is string {
  if (!src) return false;
  if (src.startsWith("/") && !src.startsWith("//")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && (
      url.hostname.endsWith(".supabase.co") ||
      url.hostname === "images.unsplash.com" ||
      url.origin === process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
    );
  } catch {
    return false;
  }
}

export function CatalogImage({ src, compact = false, ...props }: CatalogImageProps) {
  const [failedSrc, setFailedSrc] = useState<string>();

  if (!isCatalogImage(src) || src === failedSrc) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-brand-muted">
        <ImageOff className="size-6" strokeWidth={1.4} aria-hidden="true" />
        <span className={compact ? "sr-only" : "text-xs"}>Foto indisponível</span>
      </div>
    );
  }

  return <Image {...props} src={src} fill onError={() => setFailedSrc(src)} />;
}
