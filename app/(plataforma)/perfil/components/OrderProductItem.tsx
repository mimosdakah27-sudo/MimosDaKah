// components/profile/order-product-item.tsx
import Image from "next/image";
import { formatBRL } from "@/lib/utils";

interface OrderProductItemProps {
  item: any;
}

export function OrderProductItem({ item }: OrderProductItemProps) {
  return (
    <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted border shrink-0">
        <Image
          src={item.product_image || "/placeholder.png"}
          alt={item.product_name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0 text-xs space-y-1">
        <p className="font-semibold text-foreground truncate">
          {item.product_name}
        </p>

        {(item.name || item.tamanho) && (
          <p className="text-primary font-medium">
            {item.name ? `Variante: ${item.name}` : ""}
            {item.name && item.tamanho ? " • " : ""}
            {item.tamanho ? `Tamanho: ${item.tamanho}` : ""}
          </p>
        )}

        <p className="text-muted-foreground">
          {item.quantity}x {formatBRL(Number(item.unit_price))}
        </p>
      </div>
      <div className="text-right font-bold text-foreground text-xs">
        {formatBRL(Number(item.unit_price) * item.quantity)}
      </div>
    </div>
  );
}