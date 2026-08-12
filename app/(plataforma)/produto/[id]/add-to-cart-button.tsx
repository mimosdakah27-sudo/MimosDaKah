"use client";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/store/cart";
import type { CartProduct } from "@/lib/store/types";

export function AddToCartButton({ product }: { product: CartProduct }) {
  const add = useCart((s) => s.add);  
  console.log("AddToCartButton product:", product);
  
  return (
    <Button 
      variant="outline"
      size="lg" 
      className="w-full h-12 text-sm font-semibold border-primary/40 text-primary hover:bg-primary/10 rounded-2xl" 
      onClick={() => add(product, 1)}
    >
      <ShoppingBag className="h-4 w-4 mr-2" />
      Adicionar ao carrinho
    </Button>
  );
}