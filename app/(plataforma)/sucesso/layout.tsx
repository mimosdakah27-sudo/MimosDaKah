import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Pedido recebido", "Confira a confirmação do pedido e continue o atendimento pelo WhatsApp.", "/sucesso", undefined, false);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
