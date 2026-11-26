"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { unmask } from "@/lib/utils";

export function WhatsAppFab() {
  const pathname = usePathname();
  const inCatalog = pathname === "/" || pathname.startsWith("/produto/");
  const { config, isLoading: isStoreLoading } = useStore();
  const { profile, user, loading: isAuthLoading } = useAuth();

  if (!inCatalog || isStoreLoading || !config?.phone) {
    return null;
  }

  // Limpa o telefone para garantir que esteja apenas em números para o link
  const cleanPhone = unmask(config.phone);

  // Define a mensagem dependendo se o usuário está logado/possui nome cadastrado no perfil
  let message = "Olá! Gostaria de tirar algumas dúvidas com a loja.";
  
  if (!isAuthLoading && user && profile?.display_name) {
    message = `Olá! Me chamo ${profile.display_name} e gostaria de tirar algumas dúvidas com a loja.`;
  }

  const encodedMessage = encodeURIComponent(message);

  return (
    <a
      href={`https://wa.me/${[10, 11].includes(cleanPhone.length) ? '55' + cleanPhone : cleanPhone}?text=${encodedMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-brand-action text-brand-action-foreground flex items-center justify-center shadow-lg hover:bg-brand-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action motion-safe:transition-colors"
      aria-label="WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}