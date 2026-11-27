import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Administração", "Gerencie o catálogo e os pedidos da loja.", "/admin", undefined, false);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
