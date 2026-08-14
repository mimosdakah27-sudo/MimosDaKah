"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";
import { useProfile } from "./hooks/use-profile";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { BackButton } from "@/components/site/back-button";
import { Truck, MapPin, CalendarDays, ReceiptText, ExternalLink, MessageCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, orders } = useProfile();
  const { config } = useStore();
  const { profile } = useAuth();

  // Função para abrir o WhatsApp com mensagem automática do pedido
  const handleWhatsAppSupport = (order: any) => {
    const phone = config?.phone || "";
    const cleanPhone = phone.replace(/\D/g, "");
    
    if (!cleanPhone) {
      alert("O WhatsApp da loja não está configurado.");
      return;
    }

    const userName = profile?.display_name || user?.email || "Cliente";
    const orderIdShort = order.id.substring(0, 8);

    const message = `Olá! Gostaria de tirar uma dúvida sobre o meu pedido #${orderIdShort}.
*Cliente:* ${userName}
*Status atual:* ${order.status}

Poderia me ajudar?`;

    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Função auxiliar ajustada exatamente às regras de texto solicitadas
  const getLogisticsMessage = (order: any) => {
    const status = order.status;

    if (order.shipping_type === 'retirada') {
      switch (status) {
        case "Em Preparação":
          return "Seu produto está sendo preparado.";
        case "pronto_para_retirada":
          return "Seu produto está pronto para retirada";
        case "Preparando Entrega":
          return "Estamos organizando os últimos detalhes para a retirada.";
        case "Etiqueta Paga":
          return "Pagamento confirmado. Aguardando separação.";
        case "Postado":
          return "Pedido separado para retirada.";
        case "Entregue":
          return "Seu produto foi entregue com sucesso";
        default:
          return "Aguardando atualizações do status.";
      }
    }

    if (order.shipping_type === 'entrega_propria') {
      switch (status) {
        case "Em Preparação":
          return "Seu produto está sendo preparado.";
        case "pronto_para_retirada":
          return "Pedido pronto.";
        case "Preparando Entrega":
          return "Seu produto está sendo preparado e logo sairá para entrega.";
        case "Etiqueta Paga":
          return "Pagamento confirmado.";
        case "Postado":
          return "Pedido a caminho com o entregador.";
        case "Entregue":
          return "Seu produto foi entregue com sucesso";
        default:
          return "Seu produto está sendo preparado.";
      }
    }

    // Caso seja transportadora / melhor_envio
    switch (status) {
      case "Em Preparação":
        return "Seu produto está sendo preparado.";
      case "Preparando Entrega":
        return "Preparando pacote para envio.";
      case "pronto_para_retirada":
        return "Seu produto está pronto para retirada.";
      case "Etiqueta Paga":
        return "Etiqueta gerada, aguardando postagem.";
      case "Postado":
        return "Seu pedido foi postado na transportadora.";
      case "Entregue":
        return "Seu produto foi entregue com sucesso";
      default:
        return "Acompanhe o rastreio do seu envio abaixo.";
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <BackButton />
      
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Meu perfil</h1>
        <p className="text-muted-foreground font-medium">{user?.email}</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Meus pedidos</h2>
        
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground font-medium text-sm">
              Você ainda não fez nenhum pedido.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-0.5">
                      <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge className="rounded-md uppercase tracking-wider font-extrabold text-[10px] px-3 py-1">
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 space-y-6">
                  {/* Produtos do Pedido com suporte a variantes (name e tamanho) salvos em order_items */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Produtos</h4>
                    {order.order_items.map((it) => (
                      <div key={it.id} className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted border shrink-0">
                          <Image src={it.product_image || "/placeholder.png"} alt={it.product_name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 text-xs space-y-1">
                          <p className="font-semibold text-foreground truncate">{it.product_name}</p>
                          
                          {(it.name || it.tamanho) && (
                            <p className="text-primary font-medium">
                              {it.name ? `Variante: ${it.name}` : ""}
                              {it.name && it.tamanho ? " • " : ""}
                              {it.tamanho ? `Tamanho: ${it.tamanho}` : ""}
                            </p>
                          )}

                          <p className="text-muted-foreground">
                            {it.quantity}x {formatBRL(Number(it.unit_price))}
                          </p>
                        </div>
                        <div className="text-right font-bold text-foreground text-xs">
                          {formatBRL(Number(it.unit_price) * it.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                    {/* Logística */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Truck className="h-4 w-4 text-primary" /> Informações de Entrega
                      </div>
                      <div className="bg-muted/40 p-3 rounded-lg text-xs text-muted-foreground space-y-2 border">
                        <p className="font-bold text-foreground">
                          {order.shipping_type === 'retirada' 
                            ? "Retirada na Loja" 
                            : order.shipping_type === 'entrega_propria' 
                              ? "Entrega Própria da Loja" 
                              : "Envio por Transportadora"}
                        </p>

                        {order.shipping_type !== 'retirada' && (
                          <p className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 mt-0.5" /> 
                            {order.shipping_address}, {order.shipping_city}
                          </p>
                        )}

                        {order.shipping_type === 'melhor_envio' ? (
                          order.tracking_code ? (
                            <a 
                              href={`https://www.melhorrastreio.com.br/rastreio/${order.tracking_code}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-1 text-primary font-bold hover:underline"
                            >
                              Rastrear: {order.tracking_code} <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <p className="font-semibold text-amber-600">Esperando código de rastreio</p>
                          )
                        ) : (
                          <p className={`font-semibold ${order.status === 'Pronto p/ Retirada' ? 'text-emerald-600 dark:text-emerald-400 text-sm font-bold' : 'text-primary'}`}>
                            {getLogisticsMessage(order)}
                          </p>
                        )}

                        {/* Botão para suporte / tirar dúvidas via WhatsApp sobre o pedido */}
                        <div className="pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleWhatsAppSupport(order)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                            Falar sobre este pedido no WhatsApp
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Valores */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <ReceiptText className="h-4 w-4 text-primary" /> Resumo Financeiro
                      </div>
                      <div className="space-y-2 p-3 bg-card border rounded-lg">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Subtotal</span>
                          <span>{formatBRL(Number(order.total) - Number(order.shipping_cost || 0))}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Frete</span>
                          <span>{formatBRL(Number(order.shipping_cost || 0))}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t">
                          <span>Total</span>
                          <span className="text-primary">{formatBRL(Number(order.total))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}