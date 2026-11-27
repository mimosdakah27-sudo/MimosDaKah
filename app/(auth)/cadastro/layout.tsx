import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Criar conta", "Cadastre-se para acompanhar seus pedidos.", "/cadastro", undefined, false);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
