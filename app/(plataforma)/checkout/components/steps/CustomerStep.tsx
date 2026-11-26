"use client";

import { ArrowRight, User } from "lucide-react";
import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CheckoutCustomerDraft } from "@/lib/checkout-draft";
import { maskPhone } from "@/lib/utils";
import { hasCheckoutContact } from "../../checkout-values";

interface CustomerStepProps {
  customerData: CheckoutCustomerDraft;
  setCustomerData: Dispatch<SetStateAction<CheckoutCustomerDraft>>;
  isGuest: boolean;
  onNext: () => void;
}

export function CustomerStep({ customerData, setCustomerData, isGuest, onNext }: CustomerStepProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Contato do pedido</h2>
            <p className="text-xs text-muted-foreground">Informe como a loja pode falar com você.</p>
          </div>
        </div>
        {isGuest && (
          <p className="text-sm text-muted-foreground">
            Você pode pedir sem cadastro. Já tem conta?{" "}
            <Link href="/login?redirect=%2Fcheckout%3Fstep%3Dcustomer" className="text-primary underline">
              Entrar
            </Link>
          </p>
        )}
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onNext(); }}>
          <div className="space-y-2">
            <label htmlFor="order-name" className="text-sm font-medium">Nome completo</label>
            <Input
              id="order-name" autoComplete="name" required
              placeholder="Ex: Maria Silva"
              value={customerData.name}
              onChange={(event) => setCustomerData({ ...customerData, name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="order-phone" className="text-sm font-medium">Telefone / WhatsApp com DDD</label>
            <Input
              id="order-phone" type="tel" autoComplete="tel-national" required
              placeholder="(00) 00000-0000"
              value={customerData.phone}
              onChange={(event) => setCustomerData({ ...customerData, phone: maskPhone(event.target.value) })}
            />
          </div>
          <Button type="submit" className="flow-action" size="lg" disabled={!hasCheckoutContact(customerData)}>
            Continuar para Endereço <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
