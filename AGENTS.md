# Mimos da Kah

## Objetivo

O Mimos da Kah é um catálogo de produtos. O cliente deve poder abrir a vitrine, escolher um produto, ver suas fotos e informações e digitar o CEP de destino na própria página do produto para consultar o valor e o prazo estimado de entrega. Assim, consegue avaliar o custo de receber aquele item antes de decidir pela compra.

## Escopo do frete

A integração com o Melhor Envio serve apenas para cotar o frete. A consulta deve funcionar sem cadastro, carrinho ou pedido e terminar assim que a estimativa for exibida. Compra, geração e impressão de etiquetas ficam fora do fluxo do catálogo.

## Onde trabalhar

- A vitrine consulta os produtos no Supabase em `app/(plataforma)/home/services/get-home-data.ts`. A página de detalhes fica em `app/(plataforma)/produto/[id]/`, com componentes de apresentação em `components/site/`.
- A página do produto usa `components/site/product-shipping.tsx` e a ação pública em `lib/actions/shipping.ts`. Uma consulta usa o CEP de origem e as medidas cadastradas. Para o mesmo CEP da loja, vale a taxa local quando habilitada.
- O pedido é opcional. Ao escolher **Fazer pedido**, a cliente segue como visitante para `app/(plataforma)/checkout/`. O fluxo aproveita o CEP consultado, valida preços e frete no servidor e registra o pedido para atendimento da loja. Produtos sob orçamento iniciam o contato pelo WhatsApp.
- As credenciais do Melhor Envio ficam no servidor. A autorização da loja pede somente o escopo de cotação. Alterações em tabelas e políticas ficam em `supabase/migrations/`.
