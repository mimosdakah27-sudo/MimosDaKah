"use client";

import { MessageCircle } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { unmask } from "@/lib/utils";

export function WhatsAppFab() {
  const { config, isLoading: isStoreLoading } = useStore();
  const { profile, user, loading: isAuthLoading } = useAuth();

  // Se estiver carregando a loja ou o telefone não estiver configurado, não mostra o botão
  if (isStoreLoading || !config?.phone) {
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
      href={`https://wa.me/55${cleanPhone}?text=${encodedMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-[#25D366] opacity-70 backdrop-blur-md text-white flex items-center justify-center shadow-lg hover:opacity-100 hover:scale-110 transition-all duration-300"
      aria-label="WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}