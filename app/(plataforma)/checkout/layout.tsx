import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Fazer pedido", "Revise os produtos, consulte o frete e combine seu pedido com a loja.", "/checkout", undefined, false);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
