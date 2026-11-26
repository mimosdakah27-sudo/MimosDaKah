"use client";

import { ExternalLink } from "lucide-react";

export function OrderTracking({ trackingCode }: { trackingCode: string }) {
  return (
    <a
      href={`https://www.melhorrastreio.com.br/rastreio/${trackingCode}`}
      target="_blank"
      rel="noreferrer"
      className="block bg-brand-surface p-2 rounded border border-border hover:bg-brand-tint transition-colors"
    >
      <p className="font-bold text-brand-action flex justify-between items-center text-[10px] sm:text-xs">
        <span className="truncate">Rastreio: {trackingCode}</span>
        <ExternalLink size={11} className="shrink-0 ml-1" />
      </p>
    </a>
  );
}