"use client";

import { ExternalLink } from "lucide-react";

export function OrderTracking({ trackingCode }: { trackingCode: string }) {
  return (
    <a
      href={`https://www.melhorrastreio.com.br/rastreio/${trackingCode}`}
      target="_blank"
      rel="noreferrer"
      className="block bg-blue-50/80 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors"
    >
      <p className="font-bold text-blue-800 dark:text-blue-300 flex justify-between items-center text-[10px] sm:text-xs">
        <span className="truncate">Rastreio: {trackingCode}</span>
        <ExternalLink size={11} className="shrink-0 ml-1" />
      </p>
    </a>
  );
}