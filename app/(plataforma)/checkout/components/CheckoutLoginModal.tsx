"use client";

import {
  Bell,
  Clock3,
  History,
  UserPlus,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

interface CheckoutLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  saveLabel?: string;
  continueLabel?: string;
  onLogin: () => void;
  onContinue: () => void;
}

export function CheckoutLoginModal({
  open,
  onOpenChange,
  title = "Tenha mais vantagens criando sua conta",
  description = "Você pode continuar sem conta, mas ao criar uma conta terá acesso a recursos exclusivos.",
  saveLabel = "Entrar ou criar minha conta",
  continueLabel = "Continuar sem conta",
  onLogin,
  onContinue,
}: CheckoutLoginModalProps) {
  const handleContinue = () => {
    onOpenChange(false);
    onContinue();
  };

  const handleLogin = () => {
    onOpenChange(false);
    onLogin();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>

          <DialogTitle className="text-center text-lg">
            {title}
          </DialogTitle>

          <DialogDescription className="text-center text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Área com scroll */}
        <div className="max-h-[45vh] overflow-y-auto pr-2 space-y-2">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
            <History className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

            <div>
              <p className="text-sm font-medium">
                Histórico de pedidos
              </p>

              <p className="text-xs text-muted-foreground">
                Consulte seus pedidos anteriores quando quiser.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

            <div>
              <p className="text-sm font-medium">
                Acompanhe seus pedidos
              </p>

              <p className="text-xs text-muted-foreground">
                Veja o status e as atualizações do seu pedido.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

            <div>
              <p className="text-sm font-medium">
                Receba novidades
              </p>

              <p className="text-xs text-muted-foreground">
                Fique por dentro de novos lançamentos e novidades da loja.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
            <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

            <div>
              <p className="text-sm font-medium">
                Mais praticidade
              </p>

              <p className="text-xs text-muted-foreground">
                Facilite seus próximos pedidos com seus dados já cadastrados.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:grid-flow-row">
          <Button
            type="button"
            className="w-full font-semibold"
            onClick={handleLogin}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {saveLabel}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleContinue}
          >
            {continueLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}