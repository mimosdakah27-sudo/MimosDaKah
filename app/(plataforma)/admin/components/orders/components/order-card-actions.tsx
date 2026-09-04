"use client";

import { Button } from "@/components/ui/button";
import {
  Archive,
  ArchiveRestore,
  MessageCircle,
} from "lucide-react";

export function OrderCardActions({
  order,
  updateArchive,
  isArchivePending,
  whatsappUrl,
}: any) {
  return (
    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-[10px] flex-1 sm:flex-none"
        onClick={() =>
          updateArchive({
            id: order.id,
            is_archived: !order.is_archived,
          })
        }
        disabled={isArchivePending}
      >
        {order.is_archived ? (
          <ArchiveRestore size={13} className="mr-1" />
        ) : (
          <Archive size={13} className="mr-1" />
        )}

        {order.is_archived
          ? "Desarquivar"
          : "Arquivar"}
      </Button>

      {order.shipping_phone && whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 sm:flex-none"
        >
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-[10px] w-full"
          >
            <MessageCircle
              size={13}
              className="mr-1 text-emerald-600"
            />

            WhatsApp
          </Button>
        </a>
      )}
    </div>
  );
}